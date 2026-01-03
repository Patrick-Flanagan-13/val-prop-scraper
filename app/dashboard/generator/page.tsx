
import GeneratorInterface from './GeneratorInterface';

export default function Page() {
    return (
        <div className="h-full">
            <div className="mb-8">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                    Value Proposition Generator
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Combine multiple scans to discover the market "Sweet Spot" and generate the perfect value proposition.
                </p>
            </div>
            <GeneratorInterface />
        </div>
    );
}
