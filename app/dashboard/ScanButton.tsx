'use client';

import { triggerScan } from '@/app/lib/actions';
import { useTransition } from 'react';
import { useToast } from '@/app/lib/toast';
import { useRouter } from 'next/navigation';

interface Props {
    targetId: string;
    className?: string;
}

export default function ScanButton({ targetId, className }: Props) {
    const [isPending, startTransition] = useTransition();
    const { showToast } = useToast();
    const router = useRouter();

    const handleClick = () => {
        if (!window.confirm("Are you sure you want to start a scan?")) {
            return;
        }

        startTransition(async () => {
            try {
                const result = await triggerScan(targetId);
                if (result.success) {
                    showToast("Scan completed successfully!", "success");
                    router.push(`/dashboard/${targetId}`);
                } else {
                    showToast("Scan failed. Please try again.", "error");
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
            className={`${className} ${isPending ? 'opacity-50 cursor-not-allowed' : ''
                }`}
        >
            {isPending ? 'Scanning...' : 'Scan Now'}
        </button>
    );
}
