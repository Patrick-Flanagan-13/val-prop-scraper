import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export async function scrapeAndProcess(targetId: string) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const target = await prisma.targetURL.findUnique({
            where: { id: targetId },
        });

        if (!target) throw new Error('Target not found');

        // 1. Launch Browser
        const isLocal = process.env.NODE_ENV === 'development';

        let browser;
        if (isLocal) {
            // For local dev, try to find local chrome installation.
            const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

            browser = await puppeteer.launch({
                args: isLocal ? puppeteer.defaultArgs() : chromium.args,
                defaultViewport: { width: 1920, height: 1080 },
                executablePath: isLocal ? executablePath : await chromium.executablePath(),
                headless: true,
                ignoreHTTPSErrors: true,
            } as any);
        } else {
            // Production (Vercel)
            browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: { width: 1920, height: 1080 },
                executablePath: await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'),
                headless: true,
                ignoreHTTPSErrors: true,
            } as any);
        }

        const page = await browser.newPage();
        const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Check HTTP Status
        if (!response || !response.ok()) {
            const status = response ? response.status() : 'Unknown';
            throw new Error(`HTTP Error: ${status} for URL: ${target.url}`);
        }

        // Screenshot
        const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 60, encoding: 'base64' });
        const screenshot = `data:image/jpeg;base64,${screenshotBuffer}`;

        // Extract Text
        // Remove scripts/styles
        await page.evaluate(() => {
            document.querySelectorAll('script, style, noscript, iframe').forEach(el => el.remove());
        });

        const textContent = await page.evaluate(() => {
            return document.body.innerText.replace(/\s+/g, ' ').trim().substring(0, 15000);
        });

        // Check for "Page Not Found" indicators in the text
        const errorPhrases = ['page not found', '404 error', '404 not found', 'page cannot be found'];
        const lowerText = textContent.toLowerCase();

        // Check if the page text is very short AND contains an error phrase (to avoid false positives on long pages mentioning 404)
        // Or if it just prominently features the error.
        // Simple heuristic: If text is short (< 500 chars) and contains error phrase, likely a 404 page.
        if (textContent.length < 1000 && errorPhrases.some(phrase => lowerText.includes(phrase))) {
            throw new Error('Page content indicates "Page Not Found"');
        }

        await browser.close();

        // 2. Process with LLM
        const userPrompt = target.prompt ? `Additional Instructions: ${target.prompt}` : "";

        // Build dynamic schema from customFields or default
        const fieldsToExtract = target.customFields && target.customFields.length > 0
            ? [...target.customFields]
            : ["APR", "Points Earned", "Cash Back", "Benefits"];

        // Ensure "Card Brands" is always included
        if (!fieldsToExtract.includes("Card Brands")) {
            fieldsToExtract.push("Card Brands");
        }

        // Ensure "Card Brands" is always included
        if (!fieldsToExtract.includes("Card Brands")) {
            fieldsToExtract.push("Card Brands");
        }

        const fieldSchema = fieldsToExtract.reduce((acc: Record<string, string>, field: string) => {
            if (field === "Card Brands") {
                acc[field] = "Extract available credit card networks/brands (Visa, Mastercard, American Express). Return as a comma-separated string if multiple.";
            } else {
                acc[field] = `Extract details regarding ${field}.`;
            }
            return acc;
        }, {} as Record<string, string>);

        const systemMessage = `You are a helpful assistant that extracts structured information from web page text about credit cards or financial products.
        You MUST return the result as a valid JSON object with the following structure:
        {
            "summary": "A concise text summary of the value proposition and key features (max 3 sentences).",
            "structured": ${JSON.stringify(fieldSchema, null, 4)}
        }
        
        If a field is not found, use "N/A". return ONLY the JSON object, no markdown formatting.`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: `${userPrompt}\n\nWeb Page Text:\n${textContent}` }
            ],
            model: "gpt-4o",
        });

        const extractedData = completion.choices[0].message.content;

        // 3. Save Result
        await prisma.scanResult.create({
            data: {
                targetUrlId: target.id,
                status: 'SUCCESS',
                content: textContent.substring(0, 5000), // Save a snippet of raw text
                extractedData: extractedData,
                screenshot: screenshot,
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
