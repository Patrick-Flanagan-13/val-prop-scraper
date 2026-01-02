import { getTargetUrls, getUserSettings } from '@/app/lib/data';
import { triggerScan } from '@/app/lib/actions';
import Link from 'next/link';
import ScanButton from './ScanButton';
import { formatDate } from '@/app/lib/date-utils';
import SearchFilterBar from './SearchFilterBar';
import ScanAllButton from './ScanAllButton';
import { BrandLogo, getBrands } from './BrandLogo';

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
