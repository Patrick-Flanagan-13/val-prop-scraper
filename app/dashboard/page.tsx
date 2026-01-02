import { getTargetUrls, getUserSettings } from '@/app/lib/data';
import { triggerScan } from '@/app/lib/actions';
import Link from 'next/link';
import ScanButton from './ScanButton';
import { formatDate } from '@/app/lib/date-utils';
import SearchFilterBar from './SearchFilterBar';

import ScanAllButton from './ScanAllButton';

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{
        query?: string;
        page?: string;
        sort?: string;
        order?: string;
        status?: string;
    }>;
}) {
    const params = await searchParams;
    const query = params?.query || '';
    const status = (params?.status as 'all' | 'active' | 'suspended') || 'all';
    const sort = params?.sort || 'createdAt';
    const order = (params?.order as 'asc' | 'desc') || 'desc';

    const targets = await getTargetUrls(query, sort, order, status);
    const user = await getUserSettings();
    const timezone = user?.timezone || 'UTC';

    const getSortLink = (key: string) => {
        const isCurrent = sort === key;
        const newOrder = isCurrent && order === 'asc' ? 'desc' : 'asc';
        const search = new URLSearchParams();
        if (query) search.set('query', query);
        if (status && status !== 'all') search.set('status', status);
        search.set('sort', key);
        search.set('order', newOrder);
        return `/dashboard?${search.toString()}`;
    };

    const SortIcon = ({ active, order }: { active: boolean; order: string }) => {
        if (!active) return <span className="text-gray-400 opacity-0 group-hover:opacity-50 ml-1">⇅</span>;
        return <span className="text-gray-900 ml-1">{order === 'asc' ? '↑' : '↓'}</span>;
    };

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
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Target URLs
                    </h2>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0 gap-3">
                    <ScanAllButton className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50" />
                    <Link
                        href="/dashboard/new"
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Add New URL
                    </Link>
                </div>
            </div>

            <div className="mt-8">
                <SearchFilterBar />
                <div className="flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                                <Link href={getSortLink('name')} className="group inline-flex items-center hover:bg-gray-100 rounded px-1 -ml-1">
                                                    Name
                                                    <SortIcon active={sort === 'name'} order={order} />
                                                </Link>
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Brands
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                <Link href={getSortLink('url')} className="group inline-flex items-center hover:bg-gray-100 rounded px-1 -ml-1">
                                                    URL
                                                    <SortIcon active={sort === 'url'} order={order} />
                                                </Link>
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                <Link href={getSortLink('schedule')} className="group inline-flex items-center hover:bg-gray-100 rounded px-1 -ml-1">
                                                    Schedule
                                                    <SortIcon active={sort === 'schedule'} order={order} />
                                                </Link>
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                <Link href={getSortLink('createdAt')} className="group inline-flex items-center hover:bg-gray-100 rounded px-1 -ml-1">
                                                    Last Scan / Created
                                                    <SortIcon active={sort === 'createdAt'} order={order} />
                                                </Link>
                                            </th>
                                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {targets.map((target) => (
                                            <tr key={target.id}>
                                                <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 max-w-[200px] break-words">
                                                    {target.name}
                                                    {!target.active && (
                                                        <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 whitespace-nowrap">
                                                            Suspended
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-4 text-sm text-gray-500">
                                                    <div className="flex flex-wrap gap-1">
                                                        {getBrands(target.scanResults[0]?.extractedData).map(brand => (
                                                            <BrandLogo key={brand} brand={brand} />
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                                                    <div className="flex flex-col">
                                                        <span>{target.url}</span>
                                                        {target.country && (
                                                            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 w-fit mt-1">
                                                                {target.country}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {target.schedule}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {target.scanResults[0]?.createdAt
                                                        ? formatDate(target.scanResults[0].createdAt, timezone)
                                                        : formatDate(target.createdAt, timezone)}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <div className="flex justify-end gap-2">
                                                        <ScanButton
                                                            targetId={target.id}
                                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md"
                                                        />
                                                        <Link href={`/dashboard/${target.id}`} className="text-indigo-600 hover:text-indigo-900 px-3 py-1 flex items-center">
                                                            View<span className="sr-only">, {target.name}</span>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {targets.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-4 text-gray-500">No targets found matching your criteria.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
