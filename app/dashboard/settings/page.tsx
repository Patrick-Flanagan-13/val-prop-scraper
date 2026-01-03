import { getUserSettings } from '@/app/lib/data';
import SettingsForm from './SettingsForm';
import PasskeySection from './PasskeySection';
import ExtractionFieldsForm from './ExtractionFieldsForm';

export default async function Page() {
    const user = await getUserSettings();

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Settings
                    </h2>
                </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Preferences</h3>
                    <div className="mt-5 space-y-8 divide-y divide-gray-200">
                        <SettingsForm initialTimezone={user.timezone} initialName={user.name} />
                        <div className="pt-8">
                            <ExtractionFieldsForm initialFields={user.requiredExtractionFields || ["APR", "Points Earned", "Cash Back", "Benefits"]} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <PasskeySection />
            </div>
        </div>
    );
}
