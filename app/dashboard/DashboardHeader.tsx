'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getTargetName } from '@/app/lib/actions';

export default function DashboardHeader() {
    const pathname = usePathname();
    const [pageName, setPageName] = useState('Dashboard');
    const [isTargetDetail, setIsTargetDetail] = useState(false);

    useEffect(() => {
        const updateHeader = async () => {
            setIsTargetDetail(false);
            if (pathname === '/dashboard') {
                setPageName('Dashboard');
                return;
            }
            if (pathname === '/dashboard/discovery') {
                setPageName('Discovery');
                return;
            }
            if (pathname === '/dashboard/users') {
                setPageName('User Management');
                return;
            }
            if (pathname === '/dashboard/settings') {
                setPageName('Settings');
                return;
            }
            if (pathname === '/dashboard/new') {
                setPageName('New Target');
                return;
            }

            // Regex for /dashboard/[cuid] where cuid is alphanumeric
            // We assume IDs don't conflict with sub-routes like 'settings'
            const parts = pathname.split('/');
            // /dashboard/xyz -> ["", "dashboard", "xyz"]
            if (parts.length === 3 && parts[1] === 'dashboard') {
                const id = parts[2];
                setIsTargetDetail(true);
                setPageName('Loading...');
                const name = await getTargetName(id);
                setPageName(name || 'Target Details');
                return;
            }

            if (pathname.startsWith('/dashboard/scan/')) {
                setPageName('Scan Results');
                return;
            }

            setPageName('Details');
        };

        updateHeader();
    }, [pathname]);

    return (
        <header className="h-16 flex items-center justify-between px-8 border-b border-gray-200 bg-white">
            <div className="flex items-center text-sm text-gray-500">
                <Link href="/dashboard" className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                    Dashboard
                </Link>
                {pathname !== '/dashboard' && (
                    <>
                        <span className="mx-2">/</span>
                        <span className={isTargetDetail ? "font-semibold text-indigo-600" : ""}>{pageName}</span>
                    </>
                )}
            </div>
        </header>
    );
}
