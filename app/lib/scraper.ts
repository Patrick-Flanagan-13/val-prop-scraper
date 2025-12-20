import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

export async function scrapeAndProcess(targetId: string) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const target = await prisma.targetURL.findUnique({
            where: { id: targetId },
        });

        if (!target) throw new Error('Target not found');

        // 1. Fetch content
        const response = await fetch(target.url);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove scripts, styles, and comments to reduce noise
        $('script').remove();
        $('style').remove();
        $('noscript').remove();
        $('iframe').remove();

        const textContent = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 15000); // Limit context window

        // 2. Process with LLM
        const userPrompt = target.prompt ? `Additional Instructions: ${target.prompt}` : "";

        const systemMessage = `You are a helpful assistant that extracts structured information from web page text about credit cards or financial products.
        You MUST return the result as a valid JSON object with the following keys:
        - "APR": The Annual Percentage Rate details.
        - "Points Earned": Details about points, miles, or rewards currency.
        - "Cash Back": Details about cash back offers.
        - "Benefits": Other key benefits or perks.
        
        If a field is not found, use "N/A". return ONLY the JSON object, no markdown formatting.`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: `${userPrompt}\n\nWeb Page Text:\n${textContent}` }
            ],
            model: "gpt-3.5-turbo",
        });

        const extractedData = completion.choices[0].message.content;

        // 3. Save Result
        await prisma.scanResult.create({
            data: {
                targetUrlId: target.id,
                status: 'SUCCESS',
                content: textContent.substring(0, 5000), // Save a snippet of raw text
                extractedData: extractedData,
            },
        });

        return { success: true, data: extractedData };

    } catch (error: any) {
        console.error('Scrape failed:', error);
        await prisma.scanResult.create({
            data: {
                targetUrlId: targetId,
                status: 'FAILED',
                errorMessage: error.message,
            },
        });
        return { success: false, error: error.message };
    }
}
