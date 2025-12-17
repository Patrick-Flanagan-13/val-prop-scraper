import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import { triggerScan } from '@/app/lib/actions';

export default async function Page({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const target = await prisma.targetURL.findUnique({
        where: { id: params.id },
        include: {
            scanResults: {
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!target || target.userId !== session.user.id) {
        notFound();
    }

    return (
        <div>
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        {target.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">{target.url}</p>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <form action={async () => {
                        'use server';
                        await triggerScan(target.id);
                    }}>
                        <button
                            type="submit"
                            className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Scan Now
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Configuration</h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Schedule</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{target.schedule}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Extraction Prompt</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{target.prompt || 'Default'}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Scan History</h3>
            <div className="overflow-hidden bg-white shadow sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {target.scanResults.map((scan) => (
                        <li key={scan.id}>
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <p className="truncate text-sm font-medium text-indigo-600">{scan.status}</p>
                                    <div className="ml-2 flex flex-shrink-0">
                                        <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                            {new Date(scan.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                        <p className="flex items-center text-sm text-gray-500">
                                            {scan.extractedData ? (
                                                <span className="whitespace-pre-wrap">{scan.extractedData}</span>
                                            ) : (
                                                <span className="text-red-500">{scan.errorMessage}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {target.scanResults.length === 0 && (
                        <li className="px-4 py-4 sm:px-6 text-center text-gray-500">No scans yet.</li>
                    )}
                </ul>
            </div>
        </div>
    );
}
