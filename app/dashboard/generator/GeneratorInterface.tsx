'use client';

import { useState, useEffect } from 'react';
import { searchScans, generateValueProposition } from './actions';
import { Skeleton } from '@/app/components/Skeleton';

type TargetOption = {
    targetId: string;
    targetName: string;
    targetUrl: string;
    updatedAt: Date;
};

export default function GeneratorInterface() {
    const [query, setQuery] = useState('');
    const [targets, setTargets] = useState<TargetOption[]>([]);
    const [selectedTargetIds, setSelectedTargetIds] = useState<Set<string>>(new Set());
    const [isSearching, setIsSearching] = useState(false);

    const [generatedContent, setGeneratedContent] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const [selectedModel, setSelectedModel] = useState("gpt-4o");

    // Initial load
    useEffect(() => {
        handleSearch("");
    }, []);

    const handleSearch = async (q: string) => {
        setIsSearching(true);
        const res = await searchScans(q);
        if (res.success && res.targets) {
            setTargets(res.targets);
        }
        setIsSearching(false);
    };

    const toggleSelection = (targetId: string) => {
        const next = new Set(selectedTargetIds);
        if (next.has(targetId)) {
            next.delete(targetId);
        } else {
            next.add(targetId);
        }
        setSelectedTargetIds(next);
    };

    const handleGenerate = async () => {
        if (selectedTargetIds.size === 0) return;
        setIsGenerating(true);
        setGeneratedContent(null);

        const res = await generateValueProposition(Array.from(selectedTargetIds), selectedModel);

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
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Select Inputs (Master Data)</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Search and select targets to synthesize.
                    </p>
                    <div className="mt-4 space-y-3">
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

                        <div>
                            <label htmlFor="model" className="block text-xs font-medium text-gray-700 mb-1">AI Model</label>
                            <select
                                id="model"
                                name="model"
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                            >
                                <option value="gpt-4o">GPT-4o (Best Quality)</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fastest)</option>
                                <option value="o1-preview">o1 Preview (Reasoning)</option>
                                <option value="o1-mini">o1 Mini (Deep Research)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {targets.length === 0 && !isSearching && (
                        <p className="text-center text-sm text-gray-500 mt-4">No targets with master data found.</p>
                    )}
                    {targets.map(target => (
                        <div
                            key={target.targetId}
                            onClick={() => toggleSelection(target.targetId)}
                            className={`p-3 rounded-md cursor-pointer border transition-colors ${selectedTargetIds.has(target.targetId)
                                    ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        checked={selectedTargetIds.has(target.targetId)}
                                        onChange={() => { }} // handled by parent div
                                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded pointer-events-none"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label className="font-medium text-gray-700 block cursor-pointer">
                                        {target.targetName}
                                    </label>
                                    <span className="text-gray-500 text-xs">
                                        Last updated: {new Date(target.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <button
                        onClick={handleGenerate}
                        disabled={selectedTargetIds.size === 0 || isGenerating}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? 'Generating...' : `Generate from ${selectedTargetIds.size} Targets`}
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
                            <p>Select targets and click Generate to see the Perfect Value Proposition.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
