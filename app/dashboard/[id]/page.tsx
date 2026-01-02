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

    function getBrands(extractedData: string | null): string[] {
        if (!extractedData) return [];
        try {
            const parsed = JSON.parse(extractedData);
            const structured = parsed.structured || parsed;
            const brandsStr = structured["Card Brands"] || structured["Brands"] || "";
            if (!brandsStr || brandsStr === "N/A") return [];
            return brandsStr.split(',').map((s: string) => s.trim());
        } catch (e) {
            return [];
        }
    }

    const BrandLogo = ({ brand }: { brand: string }) => {
        const b = brand.toLowerCase();
        if (b.includes('visa')) {
            return (
                <svg className="h-8 w-auto" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="50" height="30" rx="2" fill="white" />
                    <path d="M19.7 4.6L16.4 20.8H12.6L10.3 9.4C10.2 9 10.1 8.7 8.8 8.1C6.7 7 3.2 5.5 1.5 5.1L1.6 4.6H9.7C10.9 4.6 12 5.5 12.3 6.9L14.7 18.8L20.8 4.6H26.3L27 4.6H19.7ZM37.9 4.6H34.4C33.6 4.6 32.8 4.9 32.5 5.8L27.8 17L25.3 4.6H21.5L25.8 24H30.6L37.9 4.6ZM42.2 11.2C42.3 10.5 42.9 9.8 44.1 9.8C45.2 9.8 46.2 10.3 46.6 10.5L47.5 8.4C46.9 8.1 45.9 7.8 44.6 7.8C41.2 7.8 38.6 9.6 38.6 12.2C38.6 14.2 40.4 15.3 41.9 16C43.5 16.8 44 17.3 44 18.2C44 19.5 42.4 20.1 41.2 20.1C39.6 20.1 38.6 19.8 37.9 19.5L37 21.7C37.8 22.1 39.4 22.5 41.3 22.5C45.1 22.5 47.7 20.6 47.7 17.8C47.7 15.5 46.1 14.5 44.2 13.6C42.6 12.7 42.1 12.3 42.2 11.2Z" fill="#1A1F71" />
                    <path d="M13.6 4.3H13.6L13.6 4.3L13.6 4.3Z" fill="#1A1F71" />
                </svg>
            );
        }
        if (b.includes('mastercard')) {
            return (
                <svg className="h-8 w-auto" viewBox="0 0 50 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="50" height="38" rx="2" fill="#252525" />
                    <circle cx="17.2" cy="19" r="11.8" fill="#EB001B" />
                    <circle cx="32.8" cy="19" r="11.8" fill="#F79E1B" />
                    <path d="M25 19V19C24.3 21.6 22.8 23.9 20.8 25.7C22 26.6 23.5 27.2 25 27.2C26.5 27.2 28 26.7 29.2 25.7C27.2 23.9 25.7 21.6 25 19Z" fill="#FF5F00" />
                </svg>
            );
        }
        if (b.includes('american express') || b.includes('amex')) {
            return (
                <svg className="h-8 w-auto" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="50" height="30" rx="2" fill="#2E77BC" />
                    <path d="M5.4 19.9L2.8 19.9L6.5 11.4L6.9 11.4L10.3 19.9L7.8 19.9H7.7L7.0 18.2L4.6 18.2L3.9 19.9H5.4ZM6.6 17.0L5.8 14.7L5.0 17.0H6.6ZM15.6 19.9V11.4L18.4 11.4L19.5 17.6L20.6 11.4H23.5V19.9L21.7 19.9V13.8L20.4 19.9L18.7 19.9L17.3 13.8V19.9H15.6ZM25.0 19.9H29.7V17.9H26.8V16.3H29.1V14.4H26.8V13.1H29.6V11.4H25.0V19.9ZM36.1 19.9L34.1 16.5L32.0 19.9H30.1L33.0 15.6L30.3 11.4H32.4L33.9 14.3L35.5 11.4H37.5L34.8 15.6L37.9 19.9H36.1Z" fill="white" />
                </svg>
            )
        }
        return <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">{brand}</span>;
    };

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


            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Configuration</h3>
                </div>
                <TargetConfigurationForm
                    targetId={target.id}
                    initialSchedule={target.schedule}
                    initialPrompt={target.prompt}
                    initialCustomFields={target.customFields}
                    initialActive={target.active}
                />
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
