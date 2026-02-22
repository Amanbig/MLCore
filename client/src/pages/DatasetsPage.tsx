import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Database, FileUp, MoreVertical, Plus, Settings2, Trash2, FolderOutput } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Dataset {
    id: string;
    name: string;
    version: string;
    file_type: string;
    created_at: string;
    size?: number;
}

export function DatasetsPage() {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }

    const handleUploadSubmit = async () => {
        if (!selectedFile) {
            toast.error("Please select a file first");
            return;
        }

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', selectedFile);

            // Expected backend fields based on previous python implementation
            formData.append('name', selectedFile.name);
            formData.append('description', "Uploaded via web interface");
            formData.append('source', "User Upload");

            // Mocked upload for now until Auth is hooked up
            toast.promise(
                new Promise((resolve) => setTimeout(resolve, 2000)),
                {
                    loading: 'Uploading dataset...',
                    success: () => {
                        const newMockDataset: Dataset = {
                            id: Math.random().toString(36).substr(2, 9),
                            name: selectedFile.name,
                            version: "1.0",
                            file_type: selectedFile.name.split('.').pop() || 'unknown',
                            created_at: new Date().toISOString()
                        };
                        setDatasets([newMockDataset, ...datasets]);
                        setSelectedFile(null);
                        setIsUploadOpen(false);
                        return 'Dataset uploaded successfully. Note: Backend requires Auth Token to persist.';
                    },
                    error: 'Upload failed',
                }
            );

        } catch (error) {
            toast.error("An error occurred during upload.");
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Datasets</h2>
                    <p className="text-muted-foreground mt-2">Manage, clean, and transform your machine learning datasets.</p>
                </div>

                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                        <Button className="shrink-0 gap-2">
                            <Plus className="w-4 h-4" />
                            New Dataset
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Upload Dataset</DialogTitle>
                            <DialogDescription>
                                Drag and drop your CSV or Excel file or click to browse.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div
                                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors h-40"
                                onClick={handleUploadClick}
                            >
                                <FileUp className="w-10 h-10 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    {selectedFile ? selectedFile.name : "Click to select a file"}
                                </span>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv, .xlsx, .xls"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>Cancel</Button>
                            <Button onClick={handleUploadSubmit} disabled={!selectedFile || isUploading}>
                                {isUploading ? "Uploading..." : "Upload"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {datasets.length === 0 ? (
                <div className="border rounded-xl p-8 bg-card/30 backdrop-blur-sm border-dashed border-primary/20 flex flex-col items-center justify-center text-center min-h-[400px]">
                    <div className="max-w-[420px] space-y-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                            <Database className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold">No datasets found</h3>
                        <p className="text-sm text-muted-foreground">You haven't uploaded any datasets yet. Get started by uploading a CSV or Excel file to prepare your data for machine learning.</p>
                        <Button variant="outline" onClick={() => setIsUploadOpen(true)}>Upload your first dataset</Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {datasets.map((ds) => (
                        <Card key={ds.id} className="group hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                <div className="space-y-1 pr-6">
                                    <CardTitle className="text-lg leading-tight truncate" title={ds.name}>{ds.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 text-xs">
                                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">v{ds.version}</span>
                                        <span>•</span>
                                        <span className="uppercase">{ds.file_type}</span>
                                    </CardDescription>
                                </div>

                                {/* Placeholder for the dropdown menu, ignoring the unused import for now.
                                  The dropdown menu is complex to mock without the specific components added via CLI so standard buttons are safer if missing. 
                                */}
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <Settings2 className="w-4 h-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground mt-2">
                                    Uploaded {new Date(ds.created_at).toLocaleDateString()}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-4">
                                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                                    <FolderOutput className="w-4 h-4" />
                                    Wrangle
                                </Button>
                                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
