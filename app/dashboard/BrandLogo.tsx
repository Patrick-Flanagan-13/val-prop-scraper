import React from 'react';

export function getBrands(extractedData: string | null | undefined): string[] {
    if (!extractedData) return [];
    try {
        const parsed = JSON.parse(extractedData);
        const structured = parsed.structured || parsed;
        const brandsStr = structured["Card Brands"] || structured["Brands"] || "";
        if (!brandsStr || brandsStr === "N/A") return [];
        return brandsStr.split(',').map((s: string) => s.trim());
    } catch (e) {
        return [];
    }
}

export const BrandLogo = ({ brand }: { brand: string }) => {
    const b = brand.toLowerCase();
    if (b.includes('visa')) {
        return (
            <svg className="h-8 w-auto" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <title>Visa</title>
                <rect width="50" height="30" rx="2" fill="white" />
                <path d="M19.7 4.6L16.4 20.8H12.6L10.3 9.4C10.2 9 10.1 8.7 8.8 8.1C6.7 7 3.2 5.5 1.5 5.1L1.6 4.6H9.7C10.9 4.6 12 5.5 12.3 6.9L14.7 18.8L20.8 4.6H26.3L27 4.6H19.7ZM37.9 4.6H34.4C33.6 4.6 32.8 4.9 32.5 5.8L27.8 17L25.3 4.6H21.5L25.8 24H30.6L37.9 4.6ZM42.2 11.2C42.3 10.5 42.9 9.8 44.1 9.8C45.2 9.8 46.2 10.3 46.6 10.5L47.5 8.4C46.9 8.1 45.9 7.8 44.6 7.8C41.2 7.8 38.6 9.6 38.6 12.2C38.6 14.2 40.4 15.3 41.9 16C43.5 16.8 44 17.3 44 18.2C44 19.5 42.4 20.1 41.2 20.1C39.6 20.1 38.6 19.8 37.9 19.5L37 21.7C37.8 22.1 39.4 22.5 41.3 22.5C45.1 22.5 47.7 20.6 47.7 17.8C47.7 15.5 46.1 14.5 44.2 13.6C42.6 12.7 42.1 12.3 42.2 11.2Z" fill="#1A1F71" />
                <path d="M13.6 4.3H13.6L13.6 4.3L13.6 4.3Z" fill="#1A1F71" />
            </svg>
        );
    }
    if (b.includes('mastercard')) {
        return (
            <svg className="h-8 w-auto" viewBox="0 0 50 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <title>Mastercard</title>
                <rect width="50" height="38" rx="2" fill="#252525" />
                <circle cx="17.2" cy="19" r="11.8" fill="#EB001B" />
                <circle cx="32.8" cy="19" r="11.8" fill="#F79E1B" />
                <path d="M25 19V19C24.3 21.6 22.8 23.9 20.8 25.7C22 26.6 23.5 27.2 25 27.2C26.5 27.2 28 26.7 29.2 25.7C27.2 23.9 25.7 21.6 25 19Z" fill="#FF5F00" />
            </svg>
        );
    }
    if (b.includes('american express') || b.includes('amex')) {
        return (
            <svg className="h-8 w-auto" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <title>American Express</title>
                <rect width="50" height="30" rx="2" fill="#2E77BC" />
                <path d="M5.4 19.9L2.8 19.9L6.5 11.4L6.9 11.4L10.3 19.9L7.8 19.9H7.7L7.0 18.2L4.6 18.2L3.9 19.9H5.4ZM6.6 17.0L5.8 14.7L5.0 17.0H6.6ZM15.6 19.9V11.4L18.4 11.4L19.5 17.6L20.6 11.4H23.5V19.9L21.7 19.9V13.8L20.4 19.9L18.7 19.9L17.3 13.8V19.9H15.6ZM25.0 19.9H29.7V17.9H26.8V16.3H29.1V14.4H26.8V13.1H29.6V11.4H25.0V19.9ZM36.1 19.9L34.1 16.5L32.0 19.9H30.1L33.0 15.6L30.3 11.4H32.4L33.9 14.3L35.5 11.4H37.5L34.8 15.6L37.9 19.9H36.1Z" fill="white" />
            </svg>
        )
    }
    return <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">{brand}</span>;
};
