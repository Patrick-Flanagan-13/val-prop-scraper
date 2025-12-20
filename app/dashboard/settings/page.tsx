"use client"

import { signIn } from "next-auth/webauthn"
import { useState } from "react"
import { useSession } from "next-auth/react"

export default function SettingsPage() {
    const { data: session } = useSession()
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [errorMessage, setErrorMessage] = useState<string>("")

    const handleRegisterPasskey = async () => {
        setStatus("loading")
        setErrorMessage("")
        try {
            await signIn("webauthn", { action: "register", redirect: false })
            setStatus("success")
        } catch (error) {
            console.error("Failed to register passkey", error)
            setStatus("error")
            if (error instanceof Error) {
                setErrorMessage(error.message)
            } else {
                setErrorMessage("An unknown error occurred")
            }
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your account settings and security.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Security</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your sign-in methods.</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-medium text-slate-900 dark:text-slate-100">Passkeys</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Securely sign in without a password using your fingerprint, face, or device screen lock.
                            </p>
                        </div>
                        <button
                            onClick={handleRegisterPasskey}
                            disabled={status === "loading"}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {status === "loading" ? "Registering..." : "Add Passkey"}
                        </button>
                    </div>

                    {status === "success" && (
                        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                        Passkey registered successfully! You can now use it to sign in.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                        Failed to register passkey. {errorMessage && <span className="block mt-1 font-mono text-xs">{errorMessage}</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
