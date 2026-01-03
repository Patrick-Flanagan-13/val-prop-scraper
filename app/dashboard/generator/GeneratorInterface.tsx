'use client';

import { useState, useEffect } from 'react';
import { searchScans, generateValueProposition } from './actions';
import { formatDate } from '@/app/lib/date-utils'; // Assuming this exists or simple date
import { Skeleton } from '@/app/components/Skeleton';
import ReactMarkdown from 'react-markdown';

// Note: If you don't have react-markdown installed, we might need to fallback or just pre-wrap.
// Assuming simple pre-wrap for now to avoid dependency issues if not present, checking imports later.
// Actually, let's use a simple detailed view or `whitespace-pre-wrap` if markdown lib isn't guaranteed.
// Better yet, I'll attempt to use a simple text display first.

type ScanOption = {
    targetId: string;
    targetName: string;
    targetUrl: string;
    scanId: string;
    scanDate: Date;
};

export default function GeneratorInterface() {
    const [query, setQuery] = useState('');
    const [scans, setScans] = useState<ScanOption[]>([]);
    const [selectedScanIds, setSelectedScanIds] = useState<Set<string>>(new Set());
    const [isSearching, setIsSearching] = useState(false);

    const [generatedContent, setGeneratedContent] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Initial load
    useEffect(() => {
        handleSearch("");
    }, []);

    const handleSearch = async (q: string) => {
        setIsSearching(true);
        const res = await searchScans(q);
        if (res.success && res.scans) {
            setScans(res.scans);
        }
        setIsSearching(false);
    };

    const toggleSelection = (scanId: string) => {
        const next = new Set(selectedScanIds);
        if (next.has(scanId)) {
            next.delete(scanId);
        } else {
            next.add(scanId);
        }
        setSelectedScanIds(next);
    };

    const handleGenerate = async () => {
        if (selectedScanIds.size === 0) return;
        setIsGenerating(true);
        setGeneratedContent(null);

        const res = await generateValueProposition(Array.from(selectedScanIds));

        if (res.success && res.content) {
            setGeneratedContent(res.content);
        } else {
            alert("Failed to generate. Please try again.");
        }
        setIsGenerating(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* Left Panel: Selection */}
            <div className="lg:col-span-1 bg-white shadow sm:rounded-lg flex flex-col h-[calc(100vh-10rem)]">
                <div className="px-4 py-5 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Select Inputs</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Search and select scans to synthesize.
                    </p>
                    <div className="mt-4">
                        <input
                            type="text"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                            placeholder="Search targets..."
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                handleSearch(e.target.value);
                            }}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {scans.length === 0 && !isSearching && (
                        <p className="text-center text-sm text-gray-500 mt-4">No scans found.</p>
                    )}
                    {scans.map(scan => (
                        <div
                            key={scan.scanId}
                            onClick={() => toggleSelection(scan.scanId)}
                            className={`p-3 rounded-md cursor-pointer border transition-colors ${selectedScanIds.has(scan.scanId)
                                    ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        checked={selectedScanIds.has(scan.scanId)}
                                        onChange={() => { }} // handled by parent div
                                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded pointer-events-none"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label className="font-medium text-gray-700 block cursor-pointer">
                                        {scan.targetName}
                                    </label>
                                    <span className="text-gray-500 text-xs">
                                        Last scan: {new Date(scan.scanDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <button
                        onClick={handleGenerate}
                        disabled={selectedScanIds.size === 0 || isGenerating}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? 'Generating...' : `Generate from ${selectedScanIds.size} Scans`}
                    </button>
                </div>
            </div>

            {/* Right Panel: Result */}
            <div className="lg:col-span-2 bg-white shadow sm:rounded-lg h-[calc(100vh-10rem)] flex flex-col">
                <div className="px-4 py-5 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Value Proposition Result</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {isGenerating ? (
                        <div className="max-w-xl mx-auto mt-12">
                            <h4 className="text-center text-gray-500 mb-6">Analyzing data and calculating sweet spots...</h4>
                            <Skeleton />
                        </div>
                    ) : generatedContent ? (
                        <div className="prose prose-indigo max-w-none">
                            <div className="whitespace-pre-wrap font-sans text-gray-800">
                                {generatedContent}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            <p>Select scans and click Generate to see the Perfect Value Proposition.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
