'use client';

import { updateSettings } from '@/app/lib/actions';
import { useActionState } from 'react';

export default function SettingsForm({ initialTimezone }: { initialTimezone: string }) {
    const [message, formAction, isPending] = useActionState(updateSettings, undefined);

    // Get list of supported timezones
    const timezones = Intl.supportedValuesOf('timeZone');

    return (
        <form action={formAction} className="space-y-6 max-w-lg">
            <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                    Timezone
                </label>
                <div className="mt-1">
                    <select
                        id="timezone"
                        name="timezone"
                        defaultValue={initialTimezone}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                    >
                        {timezones.map((tz) => {
                            const displayName = tz.split('/').pop()?.replace(/_/g, ' ') || tz;
                            return (
                                <option key={tz} value={tz}>
                                    {displayName}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    All dates and times will be displayed in this timezone.
                </p>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {isPending ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {message && (
                <p className={`text-sm ${message.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                    {message}
                </p>
            )}
        </form>
    );
}
