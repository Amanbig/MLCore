import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
	Database,
	FileUp,
	MoreVertical,
	Plus,
	Trash2,
	FolderOutput,
	Loader2,
	RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";

interface Dataset {
	id: string;
	name: string;
	version: string;
	file_type: string;
	created_at: string;
}

export function DatasetsPage() {
	const user = useAuthStore((state) => state.user);
	const [datasets, setDatasets] = useState<Dataset[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const fetchDatasets = async () => {
		try {
			setIsLoading(true);
			const res = await api.get("/dataset");
			setDatasets(res.data || []);
		} catch (error: any) {
			if (error.response?.status !== 401) {
				toast.error("Failed to load datasets");
			}
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchDatasets();
	}, []);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			setSelectedFile(e.target.files[0]);
		}
	};

	const handleUploadSubmit = async () => {
		if (!selectedFile) {
			toast.error("Please select a file first");
			return;
		}

		try {
			setIsUploading(true);
			const formData = new FormData();
			formData.append("file", selectedFile);
			formData.append("name", selectedFile.name);
			formData.append("description", "Uploaded via web interface");
			formData.append("source", "User Upload");

			await api.post("/dataset", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			toast.success("Dataset uploaded successfully!");
			setSelectedFile(null);
			setIsUploadOpen(false);
			await fetchDatasets();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Upload failed");
		} finally {
			setIsUploading(false);
		}
	};

	const handleDelete = async (id: string, name: string) => {
		try {
			await api.delete(`/dataset/${id}`);
			toast.success(`"${name}" deleted`);
			setDatasets((prev) => prev.filter((d) => d.id !== id));
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Delete failed");
		}
	};

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">Datasets</h2>
					<p className="text-muted-foreground mt-1">
						Hi{" "}
						<span className="font-medium text-foreground">
							{user?.username}
						</span>{" "}
						— manage, clean and transform your ML datasets.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={fetchDatasets}
						disabled={isLoading}
					>
						<RefreshCw
							className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
						/>
					</Button>
					<Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
						<DialogTrigger asChild>
							<Button className="gap-2">
								<Plus className="w-4 h-4" />
								New Dataset
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[425px]">
							<DialogHeader>
								<DialogTitle>Upload Dataset</DialogTitle>
								<DialogDescription>
									Upload a CSV or Excel file to create a new dataset.
								</DialogDescription>
							</DialogHeader>

							<div className="grid gap-4 py-4">
								<label
									htmlFor="file-upload"
									className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors h-40"
								>
									<FileUp className="w-10 h-10 text-muted-foreground" />
									<span className="text-sm font-medium text-center">
										{selectedFile
											? selectedFile.name
											: "Click to select a CSV or Excel file"}
									</span>
									{selectedFile && (
										<span className="text-xs text-muted-foreground">
											{(selectedFile.size / 1024).toFixed(1)} KB
										</span>
									)}
									<input
										id="file-upload"
										type="file"
										className="hidden"
										accept=".csv,.xlsx,.xls"
										onChange={handleFileChange}
									/>
								</label>
							</div>

							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => {
										setIsUploadOpen(false);
										setSelectedFile(null);
									}}
									disabled={isUploading}
								>
									Cancel
								</Button>
								<Button
									onClick={handleUploadSubmit}
									disabled={!selectedFile || isUploading}
								>
									{isUploading ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
											Uploading...
										</>
									) : (
										"Upload"
									)}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center min-h-[400px]">
					<Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
				</div>
			) : datasets.length === 0 ? (
				<div className="border rounded-xl p-8 bg-card/30 backdrop-blur-sm border-dashed border-primary/20 flex flex-col items-center justify-center text-center min-h-[400px]">
					<div className="max-w-[420px] space-y-4">
						<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
							<Database className="w-8 h-8" />
						</div>
						<h3 className="text-xl font-semibold">No datasets found</h3>
						<p className="text-sm text-muted-foreground">
							You haven't uploaded any datasets yet. Get started by uploading
							your first CSV or Excel file.
						</p>
						<Button variant="outline" onClick={() => setIsUploadOpen(true)}>
							Upload your first dataset
						</Button>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{datasets.map((ds) => (
						<Card
							key={ds.id}
							className="group hover:shadow-md transition-all hover:border-primary/30"
						>
							<CardHeader className="flex flex-row items-start justify-between pb-2">
								<div className="space-y-1 pr-2 min-w-0">
									<CardTitle
										className="text-base leading-tight truncate"
										title={ds.name}
									>
										{ds.name}
									</CardTitle>
									<CardDescription className="flex items-center gap-2 text-xs">
										<Badge variant="secondary" className="text-xs font-mono">
											v{ds.version}
										</Badge>
										<span className="uppercase text-muted-foreground">
											{ds.file_type}
										</span>
									</CardDescription>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
										>
											<MoreVertical className="w-4 h-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem className="gap-2">
											<FolderOutput className="w-4 h-4" /> Wrangle
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="gap-2 text-destructive focus:text-destructive"
											onClick={() => handleDelete(ds.id, ds.name)}
										>
											<Trash2 className="w-4 h-4" /> Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</CardHeader>
							<CardContent>
								<p className="text-xs text-muted-foreground">
									Uploaded{" "}
									{new Date(ds.created_at).toLocaleDateString("en-US", {
										year: "numeric",
										month: "short",
										day: "numeric",
									})}
								</p>
							</CardContent>
							<CardFooter className="border-t pt-4">
								<Button
									variant="ghost"
									size="sm"
									className="gap-2 w-full justify-start text-muted-foreground hover:text-primary"
								>
									<FolderOutput className="w-4 h-4" />
									Open & Wrangle
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
