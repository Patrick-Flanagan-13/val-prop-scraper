'use client';

import { useState } from 'react';
import { promoteFieldsToMaster } from '@/app/lib/scan-actions';
import { BrandLogo } from '../../BrandLogo';

interface ScanComparisonProps {
    scanId: string;
    scanData: {
        summary?: string;
        structured?: Record<string, string>;
    };
    masterData: {
        summary?: string;
        structured?: Record<string, string>;
    } | null;
}

export default function ScanComparison({ scanId, scanData, masterData }: ScanComparisonProps) {
    const [loadingField, setLoadingField] = useState<string | null>(null);

    const handlePromote = async (fieldKey: string, value: string, isSummary = false) => {
        setLoadingField(fieldKey);
        try {
            const payload = isSummary
                ? { summary: value }
                : { [fieldKey]: value };

            await promoteFieldsToMaster(scanId, payload);
        } catch (e) {
            console.error(e);
            alert('Failed to promote field');
        } finally {
            setLoadingField(null);
        }
    };

    // Normalize master data structure for comparison
    const masterSummary = masterData?.summary;
    const masterStructured = masterData?.structured || {};

    const scanSummary = scanData.summary;
    const scanStructured = scanData.structured || {};

    return (
        <div className="space-y-8">
            {/* Summary Comparison */}
            {scanSummary && (
                <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Summary</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Scan Result</h4>
                            <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100 text-sm text-gray-900 whitespace-pre-wrap">
                                {scanSummary}
                            </div>
                            <button
                                onClick={() => handlePromote('summary', scanSummary, true)}
                                disabled={!!loadingField || scanSummary === masterSummary}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingField === 'summary' ? 'Promoting...' : 'Promote to Master'}
                            </button>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Current Master</h4>
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-sm text-gray-900 whitespace-pre-wrap min-h-[100px]">
                                {masterSummary || <span className="text-gray-400 italic">No master summary set</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Structured Data Comparison */}
            {Object.keys(scanStructured).length > 0 && (
                <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Structured Data</h3>
                    </div>
                    <div className="border-t border-gray-200">
                        <div className="grid grid-cols-1 divide-y divide-gray-200">
                            {Object.entries(scanStructured).map(([key, value]) => {
                                const masterValue = masterStructured[key];
                                const isDifferent = value !== (masterValue || "").trim(); // simple string compare
                                const isPromoting = loadingField === key;
                                const isBrand = key === 'Card Brands' || key === 'Brands';

                                // Custom rendering and logic for Brands
                                if (isBrand) {
                                    const scanBrands = value.split(',').map(s => s.trim()).filter(Boolean);
                                    const masterBrands = (masterValue || "").split(',').map((s: string) => s.trim()).filter(Boolean);

                                    const addBrand = (brand: string) => {
                                        if (masterBrands.includes(brand)) return;
                                        const newBrands = [...masterBrands, brand].join(', ');
                                        handlePromote(key, newBrands);
                                    };

                                    const removeBrand = (brand: string) => {
                                        const newBrands = masterBrands.filter(b => b !== brand).join(', ');
                                        handlePromote(key, newBrands);
                                    };

                                    return (
                                        <div key={key} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 hover:bg-gray-50 transition-colors">
                                            <div className="md:col-span-3">
                                                <dt className="text-sm font-medium text-gray-500 capitalize break-words">{key}</dt>
                                            </div>

                                            {/* Scan Result Column */}
                                            <div className="md:col-span-4 space-y-2">
                                                <span className="text-xs font-semibold text-indigo-600 uppercase">Scan Result</span>
                                                <div className="text-sm text-gray-900 bg-white p-3 rounded border border-gray-200 shadow-sm flex flex-col gap-2">
                                                    {scanBrands.map(brand => {
                                                        const existsInMaster = masterBrands.includes(brand);
                                                        return (
                                                            <div key={brand} className="flex items-center justify-between group">
                                                                <div className="flex items-center gap-2">
                                                                    <BrandLogo brand={brand} />
                                                                    {/* <span>{brand}</span> */}
                                                                </div>
                                                                {!existsInMaster && (
                                                                    <button
                                                                        onClick={() => addBrand(brand)}
                                                                        disabled={!!loadingField}
                                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 disabled:opacity-50"
                                                                    >
                                                                        Add
                                                                    </button>
                                                                )}
                                                                {existsInMaster && (
                                                                    <span className="text-xs text-green-600 font-medium px-2">Added</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {scanBrands.length === 0 && <span className="text-gray-400 italic">No brands detected</span>}
                                                </div>
                                            </div>

                                            {/* Middle Action Column - Simplified or Hidden for Brands */}
                                            <div className="md:col-span-1 flex items-center justify-center">
                                                {/* Optional: Provide a "Replace All" button if needed, but keeping it clean for granular only as requested */}
                                                <div className="h-full w-px bg-gray-200 mx-auto hidden md:block" />
                                            </div>

                                            {/* Master Data Column */}
                                            <div className="md:col-span-4 space-y-2">
                                                <span className="text-xs font-semibold text-gray-500 uppercase">Master Data</span>
                                                <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded border border-gray-200 shadow-sm min-h-[3rem] flex flex-col gap-2">
                                                    {masterBrands.map(brand => (
                                                        <div key={brand} className="flex items-center justify-between group">
                                                            <div className="flex items-center gap-2">
                                                                <BrandLogo brand={brand} />
                                                                {/* <span>{brand}</span> */}
                                                            </div>
                                                            <button
                                                                onClick={() => removeBrand(brand)}
                                                                disabled={!!loadingField}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 p-1 rounded"
                                                                title="Remove brand"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {masterBrands.length === 0 && <span className="text-gray-400 italic">Empty</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                // Default render for other fields
                                return (
                                    <div key={key} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 hover:bg-gray-50 transition-colors">
                                        <div className="md:col-span-3">
                                            <dt className="text-sm font-medium text-gray-500 capitalize break-words">{key}</dt>
                                        </div>

                                        <div className="md:col-span-4 space-y-2">
                                            <span className="text-xs font-semibold text-indigo-600 uppercase">Scan Result</span>
                                            <dd className="text-sm text-gray-900 whitespace-pre-wrap bg-white p-3 rounded border border-gray-200 shadow-sm">{value}</dd>
                                        </div>

                                        <div className="md:col-span-1 flex items-center justify-center">
                                            <button
                                                onClick={() => handlePromote(key, value)}
                                                disabled={!!loadingField || !isDifferent}
                                                className={`p-2 rounded-full transition-colors ${isDifferent
                                                    ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                title={isDifferent ? "Promote this field to Master" : "Already matches Master"}
                                            >
                                                {isPromoting ? (
                                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>

                                        <div className="md:col-span-4 space-y-2">
                                            <span className="text-xs font-semibold text-gray-500 uppercase">Master Data</span>
                                            <dd className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200 shadow-sm min-h-[3rem] flex items-center">
                                                {masterValue || <span className="text-gray-400 italic">Empty</span>}
                                            </dd>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
