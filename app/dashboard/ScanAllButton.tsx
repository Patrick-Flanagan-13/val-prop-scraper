'use client';

import { getActiveTargetIds, triggerScan } from '@/app/lib/actions';
import { useState } from 'react';
import { useToast } from '@/app/lib/toast';
import { useRouter } from 'next/navigation';

interface Props {
    className?: string;
}

export default function ScanAllButton({ className }: Props) {
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const { showToast } = useToast();
    const router = useRouter();

    const handleClick = async () => {
        if (!window.confirm("Are you sure you want to scan all active targets? This may take a while.")) {
            return;
        }

        setIsScanning(true);
        setProgress(0);
        setTotal(0);

        try {
            // 1. Fetch active targets
            const response = await getActiveTargetIds();
            if (!response.success || !response.targets || response.targets.length === 0) {
                showToast(response.error || "No active targets found.", "error");
                setIsScanning(false);
                return;
            }

            const targets = response.targets;
            setTotal(targets.length);

            // 2. Process in chunks (concurrency = 2)
            const concurrency = 2;
            let completed = 0;
            let successCount = 0;

            for (let i = 0; i < targets.length; i += concurrency) {
                const chunk = targets.slice(i, i + concurrency);
                const results = await Promise.allSettled(
                    chunk.map(async (target) => {
                        const res = await triggerScan(target.id);
                        return res;
                    })
                );

                // Update progress
                results.forEach(res => {
                    if (res.status === 'fulfilled' && res.value.success) {
                        successCount++;
                    }
                });
                completed += chunk.length;
                setProgress(completed);
            }

            showToast(`Scanned ${successCount} of ${targets.length} targets successfully.`, "success");
            router.refresh();

        } catch (error) {
            console.error(error);
            showToast("An unexpected error occurred during bulk scan.", "error");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <>
            {isScanning && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center cursor-wait">
                    <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center gap-6 w-full max-w-md">
                        <div className="w-full relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                                        Scanning
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-indigo-600">
                                        {Math.round((progress / total) * 100)}%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200 font-sans">
                                <div
                                    style={{ width: `${(progress / total) * 100}%`, transition: "width 0.5s ease" }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                                ></div>
                            </div>
                        </div>

                        <div className="text-gray-700 font-medium animate-pulse text-center">
                            Scanning target {Math.min(progress + 1, total)} of {total}...
                        </div>
                    </div>
                </div>
            )}
            <button
                onClick={handleClick}
                disabled={isScanning}
                className={`${className} ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isScanning ? 'Scanning...' : 'Scan All Targets'}
            </button>
        </>
    );
}
