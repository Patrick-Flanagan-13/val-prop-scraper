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

    // Visa
    if (b.includes('visa')) {
        return (
            <img
                src="/brands/visa.png"
                alt="Visa"
                title="Visa"
                className="h-8 w-auto object-contain"
            />
        );
    }

    // Mastercard
    if (b.includes('mastercard')) {
        return (
            <img
                src="/brands/mastercard.png"
                alt="Mastercard"
                title="Mastercard"
                className="h-8 w-auto object-contain"
            />
        );
    }

    // American Express (keeping existing SVG)
    if (b.includes('american express') || b.includes('amex')) {
        return (
            <svg className="h-8 w-auto" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <title>American Express</title>
                <rect width="50" height="30" rx="2" fill="#2E77BC" />
                <path d="M5.4 19.9L2.8 19.9L6.5 11.4L6.9 11.4L10.3 19.9L7.8 19.9H7.7L7.0 18.2L4.6 18.2L3.9 19.9H5.4ZM6.6 17.0L5.8 14.7L5.0 17.0H6.6ZM15.6 19.9V11.4L18.4 11.4L19.5 17.6L20.6 11.4H23.5V19.9L21.7 19.9V13.8L20.4 19.9L18.7 19.9L17.3 13.8V19.9H15.6ZM25.0 19.9H29.7V17.9H26.8V16.3H29.1V14.4H26.8V13.1H29.6V11.4H25.0V19.9ZM36.1 19.9L34.1 16.5L32.0 19.9H30.1L33.0 15.6L30.3 11.4H32.4L33.9 14.3L35.5 11.4H37.5L34.8 15.6L37.9 19.9H36.1Z" fill="white" />
            </svg>
        )
    }

    // Fallback
    return <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">{brand}</span>;
};
