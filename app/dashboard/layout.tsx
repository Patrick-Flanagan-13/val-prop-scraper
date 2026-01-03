import { auth, signOut } from "@/auth";
import Link from "next/link";
import DashboardHeader from "./DashboardHeader";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col">
                {/* Sidebar Header / User Profile */}
                <div className="h-16 flex items-center px-6 border-b border-gray-200/50">
                    <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs uppercase">
                            {session?.user?.email?.charAt(0) || 'U'}
                        </div>
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[140px]" title={session?.user?.email || ''}>
                            {session?.user?.email || 'User'}
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
                        Platform
                    </div>

                    <Link
                        href="/dashboard"
                        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                    >
                        <span className="truncate">Evaluator Dashboard</span>
                    </Link>

                    <Link
                        href="/dashboard/discovery"
                        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                    >
                        <span className="truncate">Discovery</span>
                    </Link>

                    <Link
                        href="/dashboard/generator"
                        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                    >
                        <span className="truncate">Value Generator</span>
                    </Link>

                    <Link
                        href="/dashboard/users"
                        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                    >
                        <span className="truncate">User Management</span>
                    </Link>

                    <div className="mt-8 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
                        Account
                    </div>
                    <Link
                        href="/dashboard/settings"
                        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                    >
                        <span className="truncate">Settings</span>
                    </Link>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-gray-200">
                    <form
                        action={async () => {
                            "use server";
                            await signOut();
                        }}
                    >
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Sign out
                        </button>
                    </form>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header / Breadcrumbs */}
                <DashboardHeader />

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="mx-auto max-w-5xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
