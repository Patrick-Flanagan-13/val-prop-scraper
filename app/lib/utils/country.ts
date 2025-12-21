export const countryMap: Record<string, string> = {
    'uk': 'United Kingdom',
    'gb': 'United Kingdom',
    'ca': 'Canada',
    'au': 'Australia',
    'de': 'Germany',
    'fr': 'France',
    'es': 'Spain',
    'it': 'Italy',
    'nl': 'Netherlands',
    'br': 'Brazil',
    'in': 'India',
    'jp': 'Japan',
    'cn': 'China',
    'ru': 'Russia',
    'za': 'South Africa',
    'sg': 'Singapore',
    'mx': 'Mexico',
    'ie': 'Ireland',
    'nz': 'New Zealand',
    // Add more as needed
};

export function detectCountry(url: string): string | null {
    try {
        const { hostname } = new URL(url.startsWith('http') ? url : `https://${url}`);
        const parts = hostname.split('.');
        const tld = parts[parts.length - 1];
        const secondLevel = parts[parts.length - 2];

        // Check for 2-letter TLDs
        if (countryMap[tld]) {
            return countryMap[tld];
        }

        // Handle cases like .co.uk
        if (tld === 'uk' && secondLevel === 'co') {
            return 'United Kingdom';
        }

        // Generic defaults
        if (tld === 'com' || tld === 'net' || tld === 'org' || tld === 'io' || tld === 'edu' || tld === 'gov') {
            return 'Global'; // or null if we only want specific countries
        }

        return null;
    } catch (e) {
        return null;
    }
}
