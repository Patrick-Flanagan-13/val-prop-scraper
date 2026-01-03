'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function searchScans(query: string = "") {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Not authenticated' };

    const where: any = {
        userId: session.user.id,
        active: true, // Only show active targets? Or all? Let's say all.
    };

    if (query.trim()) {
        where.name = { contains: query, mode: 'insensitive' };
    }

    const targets = await prisma.targetURL.findMany({
        where,
        select: {
            id: true,
            name: true,
            url: true,
            scanResults: {
                where: { status: 'SUCCESS' },
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                    id: true,
                    createdAt: true,
                    extractedData: true, // Need data for preview potentially, but definitely for generation
                }
            }
        },
        orderBy: { name: 'asc' },
        take: 50 // Limit results
    });

    // Filter out targets with no successful scans
    const availableScans = targets
        .filter(t => t.scanResults.length > 0)
        .map(t => ({
            targetId: t.id,
            targetName: t.name,
            targetUrl: t.url,
            scanId: t.scanResults[0].id, // Using the latest scan
            scanDate: t.scanResults[0].createdAt,
            // Don't send full data to client list to save bandwidth, unless needed for preview
        }));

    return { success: true, scans: availableScans };
}

export async function generateValueProposition(scanIds: string[]) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Not authenticated' };

    if (scanIds.length === 0) return { error: 'No scans selected' };

    // Fetch full data for selected scans
    // We fetch by scanId directly
    const scans = await prisma.scanResult.findMany({
        where: {
            id: { in: scanIds },
            targetUrl: { userId: session.user.id } // Ensure ownership via relation
        },
        select: {
            targetUrl: { select: { name: true } },
            extractedData: true
        }
    });

    if (scans.length === 0) return { error: 'Scans not found' };

    // Prepare data for LLM
    const inputs = scans.map(s => {
        let data = "No data";
        try {
            if (s.extractedData) {
                data = s.extractedData;
                // Try to parse if it's JSON string to just send the relevant parts if needed, 
                // but sending the raw string is fine for the LLM to contextually understand.
            }
        } catch (e) { }
        return `Target: ${s.targetUrl.name}\nData: ${data}\n---`;
    }).join('\n\n');

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an expert product strategist. Your goal is to synthesize multiple competitor value propositions into one "Perfect Value Proposition".
                    
Rules for generation:
1. **Summary Synthesis**: Read all summaries and benefits. Create a single, compelling narrative that combines the best features of all inputs into a coherent "sweet spot" description.
2. **Median Calculation**: For any numeric fields found across the inputs (like "APR", "Annual Fee", "Bonus Points", "Cash Back %"), you MUST calculate the mathematical MEDIAN of the available values.
   - Example: If inputs are 15%, 20%, 25%, the "sweet spot" APR is 20%.
   - Explicitly mention that these values represent the "market median" or "sweet spot".
3. **Format**: Return the result in clean Markdown. Use headers for "Value Proposition Summary" and "Key Sweet Spot Metrics".`
                },
                {
                    role: "user",
                    content: `Here are the value propositions from the selected competitors:\n\n${inputs}\n\nGenerate the Perfect Value Proposition.`
                }
            ],
            model: "gpt-4o",
        });

        const content = completion.choices[0].message.content;
        return { success: true, content };

    } catch (error) {
        console.error("Generation error:", error);
        return { error: 'Failed to generate value proposition' };
    }
}
