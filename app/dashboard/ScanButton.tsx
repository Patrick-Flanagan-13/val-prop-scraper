'use client';

import { triggerScan } from '@/app/lib/actions';
import { useTransition } from 'react';

interface Props {
    targetId: string;
    className?: string;
}

export default function ScanButton({ targetId, className }: Props) {
    const [isPending, startTransition] = useTransition();

    const handleClick = () => {
        if (!window.confirm("Are you sure you want to start a scan?")) {
            return;
        }

        startTransition(async () => {
            await triggerScan(targetId);
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
