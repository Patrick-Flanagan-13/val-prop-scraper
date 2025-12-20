import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ScanResultPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const result = await prisma.scanResult.findUnique({
        where: { id },
        include: { targetUrl: true }
    });

    if (!result) {
        notFound();
    }

    let parsedData: any = null;
    let isJson = false;

    if (result.extractedData) {
        try {
            parsedData = JSON.parse(result.extractedData);
            // Basic validation to check if it looks like our requested JSON
            if (typeof parsedData === 'object' && parsedData !== null) {
                isJson = true;
            }
        } catch (e) {
            // Not JSON, fallback to raw text
            isJson = false;
        }
    }

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

            {isJson ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Extracted Information</h3>
                    </div>
                    <div className="border-t border-gray-200">
                        <dl className="sm:divide-y sm:divide-gray-200">
                            {Object.entries(parsedData).map(([key, value]) => (
                                <div key={key} className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 capitalize">{key}</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                                        {String(value)}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
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
        </div>
    );
}
