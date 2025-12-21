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
        <button
            onClick={handleClick}
            disabled={isPending}
            className={`${className} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {isPending ? 'Scanning All...' : 'Scan All Targets'}
        </button>
    );
}
