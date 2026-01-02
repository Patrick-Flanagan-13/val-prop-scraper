'use client';

import { generateProposals } from '@/app/lib/actions';
import { useActionState } from 'react';

export default function DiscoveryForm() {
    const [errorMessage, formAction, isPending] = useActionState(generateProposals, undefined);

    return (
        <form action={formAction} className="mt-6">
            <div className="flex gap-4">
                <div className="flex-1">
                    <label htmlFor="prompt" className="sr-only">
                        Discovery Prompt
                    </label>
                    <input
                        type="text"
                        name="prompt"
                        id="prompt"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3 border"
                        placeholder="E.g., Top 10 credit cards for travel rewards..."
                        required
                        minLength={5}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {isPending ? 'Generating...' : 'Generate URLs'}
                </button>
            </div>
            {errorMessage && (
                <p className="mt-2 text-sm text-red-600" id="email-error">
                    {errorMessage}
                </p>
            )}
            <p className="mt-2 text-sm text-gray-500">
                Enter a topic to generate a list of potential target URLs using AI.
            </p>
        </form>
    );
}
