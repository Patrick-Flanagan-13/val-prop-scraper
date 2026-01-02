import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ScanReviewControls from './ScanReviewControls';
import ScanComparison from './ScanComparison';

export default async function ScanResultPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const result = await prisma.scanResult.findUnique({
        where: { id },
        include: { targetUrl: true }
    });

    if (!result) {
        notFound();
    }

    let scanData = { summary: "", structured: {} };
    let masterData = null;

    // Parse Scan Data
    if (result.extractedData) {
        try {
            let cleanData = result.extractedData.trim();
            // Remove markdown code blocks if present
            if (cleanData.startsWith('```')) {
                cleanData = cleanData.replace(/^```(json)?/, '').replace(/```$/, '').trim();
            }

            const parsed = JSON.parse(cleanData);
            if (parsed.structured) {
                scanData = parsed;
            } else {
                // Convert flat structure to normalized format
                const { summary, ...rest } = parsed;
                scanData = { summary: summary || "", structured: rest };
            }
        } catch (e) {
            console.error("Failed to parse scan result JSON", e);
            // Fallback for non-json
        }
    }

    // Parse Master Data
    if (result.targetUrl.masterData) {
        try {
            const parsed = JSON.parse(result.targetUrl.masterData);
            if (parsed.structured) {
                masterData = parsed;
            } else {
                const { summary, ...rest } = parsed;
                masterData = { summary: summary || "", structured: rest };
            }
        } catch (e) {
            // Fallback
        }
    }

    // Check if we have valid structured data to show comparison
    const hasStructuredData = Object.keys(scanData.structured || {}).length > 0 || !!scanData.summary;


    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Scan Results
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        {result.targetUrl.url} - {new Date(result.createdAt).toLocaleString()}
                    </p>
                </div>
                <Link
                    href={`/dashboard/${result.targetUrlId}`}
                    className="ml-4 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                    Back to Target
                </Link>
            </div>

            <ScanReviewControls
                scanId={result.id}
                currentStatus={result.reviewStatus}
                hasStructuredData={hasStructuredData}
            />

            {hasStructuredData ? (
                <ScanComparison
                    scanId={result.id}
                    scanData={scanData as any}
                    masterData={masterData}
                />
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Raw Data</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Could not parse structured data. Showing raw output.
                        </p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                            {result.extractedData || "No data extracted."}
                        </pre>
                    </div>
                </div>
            )}

            {result.screenshot && (
                <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Screenshot</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Capture of the page at time of scan.
                        </p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                        <img
                            src={result.screenshot}
                            alt="Page Screenshot"
                            className="max-w-full h-auto rounded border border-gray-200 shadow-sm"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
