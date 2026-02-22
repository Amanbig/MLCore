export function ModelsPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Machine Learning Models</h2>
                <p className="text-muted-foreground mt-2">Train, retrain, and track lineages of your deployed models.</p>
            </div>

            <div className="border rounded-xl p-8 bg-card/30 backdrop-blur-sm flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="max-w-[420px] space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                        <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold">Ready to train a model?</h3>
                    <p className="text-sm text-muted-foreground">Select a dataset from the Dataset catalog first, then click "Train Model" to configure hyperparameters.</p>
                </div>
            </div>
        </div>
    );
}
