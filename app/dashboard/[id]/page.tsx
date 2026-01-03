import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import { triggerScan } from '@/app/lib/actions';
import TargetConfigurationForm from './TargetConfigurationForm';
import DeleteTargetButton from './DeleteTargetButton';
import Link from 'next/link';
import ScanButton from '../ScanButton';
import { getUserSettings } from '@/app/lib/data';
import { formatDate } from '@/app/lib/date-utils';
import { BrandLogo, getBrands } from '../BrandLogo';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    console.log('Page params:', resolvedParams);
    const { id } = resolvedParams;
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const user = await getUserSettings();
    const timezone = user?.timezone || 'UTC';

    console.log('Querying for ID:', id);

    if (!id) {
        notFound();
    }

    const target = await prisma.targetURL.findUnique({
        where: { id },
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
                    <ScanButton
                        targetId={target.id}
                        className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    />
                </div>
            </div>


            <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6 mb-8">
                <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Configuration</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Update extraction settings and schedule.
                        </p>
                    </div>
                    <div className="mt-5 md:col-span-2 md:mt-0">
                        <TargetConfigurationForm
                            targetId={target.id}
                            initialSchedule={target.schedule}
                            initialPrompt={target.prompt}
                            initialCustomFields={target.customFields}
                            initialActive={target.active}
                            defaultFields={user?.requiredExtractionFields || ["APR", "Points Earned", "Cash Back", "Benefits"]}
                        />
                    </div>
                </div>
            </div>

            {/* Master Data Section */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Master Data</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            The current accepted source of truth for this URL.
                        </p>
                    </div>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    {target.masterData ? (() => {
                        try {
                            const parsed = JSON.parse(target.masterData);
                            const data = parsed.structured || parsed; // Handle both formats
                            const brands = getBrands(target.masterData);

                            return (
                                <div>
                                    {brands.length > 0 && (
                                        <div className="mb-6">
                                            <dt className="text-sm font-medium text-gray-500 capitalize mb-2">Accepted Brands</dt>
                                            <dd className="flex gap-2">
                                                {brands.map(brand => <BrandLogo key={brand} brand={brand} />)}
                                            </dd>
                                        </div>
                                    )}
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                        {Object.entries(data).map(([key, value]) => {
                                            if (key === "Card Brands" || key === "Brands") return null;
                                            return (
                                                <div key={key} className="sm:col-span-1">
                                                    <dt className="text-sm font-medium text-gray-500 capitalize">{key}</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{String(value)}</dd>
                                                </div>
                                            );
                                        })}
                                    </dl>
                                </div>
                            );
                        } catch (e) {
                            return <pre className="text-sm text-gray-800 whitespace-pre-wrap">{target.masterData}</pre>;
                        }
                    })() : (
                        <div className="text-sm text-gray-500 italic">
                            No master data established yet. Review a scan below to accept it as master data.
                        </div>
                    )}
                </div>
            </div>

            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Scan History</h3>
            <div className="overflow-hidden bg-white shadow sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {target.scanResults.map((scan) => (
                        <li key={scan.id}>
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <p className={`truncate text-sm font-medium ${scan.status === 'SUCCESS' ? 'text-indigo-600' : 'text-red-600'}`}>
                                            {scan.status}
                                        </p>
                                        {scan.reviewStatus === 'APPROVED' && (
                                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Master</span>
                                        )}
                                        {scan.reviewStatus === 'REJECTED' && (
                                            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Rejected</span>
                                        )}
                                    </div>

                                    <div className="ml-2 flex flex-shrink-0 items-center gap-2">
                                        <div className="flex gap-1">
                                            {getBrands(scan.extractedData).map(brand => <BrandLogo key={brand} brand={brand} />)}
                                        </div>
                                        <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                            {formatDate(scan.createdAt, timezone)}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex w-full">
                                        <div className="flex items-center text-sm text-gray-500 w-full">
                                            {(() => {
                                                if (!scan.extractedData) return <span className="text-red-500">{scan.errorMessage}</span>;

                                                let summary = scan.extractedData;
                                                let hasStructured = false;

                                                try {
                                                    const parsed = JSON.parse(scan.extractedData);
                                                    if (parsed.summary) {
                                                        summary = parsed.summary;
                                                        hasStructured = !!parsed.structured;
                                                    } else if (parsed.APR || parsed.Benefits) {
                                                        // Fallback for the intermediate format
                                                        summary = "Structured data available";
                                                        hasStructured = true;
                                                    }
                                                } catch (e) {
                                                    // Plain text or invalid JSON
                                                }

                                                return (
                                                    <div className="flex flex-col gap-2 w-full">
                                                        <span className="whitespace-pre-wrap line-clamp-3">{summary}</span>
                                                        <Link href={`/dashboard/scan/${scan.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium self-start mt-1">
                                                            View & Review &rarr;
                                                        </Link>
                                                    </div>
                                                );
                                            })()}
                                        </div>
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

            <div className="bg-white shadow sm:rounded-lg mt-12 mb-8 border border-red-200">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-red-900">Danger Zone</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Irreversible actions.
                    </p>
                </div>
                <div className="border-t border-red-200 px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">Delete Target</h3>
                            <p className="text-sm text-gray-500">
                                Permanently delete this target and all its scan history.
                            </p>
                        </div>
                        <DeleteTargetButton targetId={target.id} />
                    </div>
                </div>
            </div>
        </div>
    );
}
