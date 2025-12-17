import { prisma } from '@/lib/prisma';
import { scrapeAndProcess } from '@/app/lib/scraper';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    // In production, verify a secret token to prevent unauthorized access
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    try {
        const targets = await prisma.targetURL.findMany({
            include: {
                scanResults: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        const results = [];

        for (const target of targets) {
            const lastScan = target.scanResults[0];
            const now = new Date();
            let shouldScan = false;

            if (!lastScan) {
                shouldScan = true;
            } else {
                const lastScanDate = new Date(lastScan.createdAt);
                const diffHours = (now.getTime() - lastScanDate.getTime()) / (1000 * 60 * 60);

                if (target.schedule === 'daily' && diffHours >= 24) {
                    shouldScan = true;
                } else if (target.schedule === 'weekly' && diffHours >= 24 * 7) {
                    shouldScan = true;
                } else if (target.schedule === 'monthly' && diffHours >= 24 * 30) {
                    shouldScan = true;
                }
            }

            if (shouldScan) {
                console.log(`Triggering scheduled scan for ${target.url}`);
                const result = await scrapeAndProcess(target.id);
                results.push({ target: target.url, result });
            }
        }

        return NextResponse.json({ success: true, scanned: results.length, results });
    } catch (error) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
