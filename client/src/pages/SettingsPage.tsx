export function SettingsPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground mt-2">Manage your account and platform preferences.</p>
            </div>

            <div className="grid gap-6 max-w-2xl">
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="font-semibold leading-none tracking-tight">API Configuration</h3>
                        <p className="text-sm text-muted-foreground">Modify how the client communicates with the python MLCore server.</p>
                    </div>
                    <div className="p-6 pt-0">
                        {/* Placeholder Form */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium leading-none">Server URL</div>
                            <div className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors text-muted-foreground">
                                http://127.0.0.1:8000
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
