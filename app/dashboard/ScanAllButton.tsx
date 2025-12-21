'use client';

import { triggerAllScans } from '@/app/lib/actions';
import { useTransition } from 'react';
import { useToast } from '@/app/lib/toast';
import { useRouter } from 'next/navigation';

interface Props {
    className?: string;
}

export default function ScanAllButton({ className }: Props) {
    const [isPending, startTransition] = useTransition();
    const { showToast } = useToast();
    const router = useRouter();

    const handleClick = () => {
        if (!window.confirm("Are you sure you want to scan all active targets? This may take a while.")) {
            return;
        }

        startTransition(async () => {
            try {
                const result = await triggerAllScans();
                if (result.success) {
                    showToast(result.message || "Scans completed successfully!", "success");
                    router.refresh();
                } else {
                    showToast(result.message || "Failed to trigger scans.", "error");
                }
            } catch (error) {
                showToast("An unexpected error occurred.", "error");
            }
        });
    };

    return (
        <>
            {isPending && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center cursor-wait">
                    <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                        <p className="text-gray-700 font-medium animate-pulse">Scanning all targets...</p>
                    </div>
                </div>
            )}
            <button
                onClick={handleClick}
                disabled={isPending}
                className={`${className} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isPending ? 'Scanning...' : 'Scan All Targets'}
            </button>
        </>
    );
}
