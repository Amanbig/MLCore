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
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
} from "recharts";
import {
	Database,
	FileUp,
	MoreVertical,
	Plus,
	Trash2,
	Wand2,
	Loader2,
	RefreshCw,
	Eye,
	BarChart3,
	Filter,
	Sigma,
	Pencil,
	GitBranch,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";

interface FileInfo {
	file_type: string;
	name: string;
	size: string;
}

interface DatasetMeta {
	shape?: { rows: number; columns: number };
	dtypes?: Record<string, string>;
	missing_values?: Record<string, number>;
	missing_percentage?: Record<string, number>;
	statistics?: Record<string, Record<string, number>>;
	correlation?: Record<string, Record<string, number>>;
	preview?: Record<string, unknown>[];
}

interface Dataset {
	id: string;
	name: string;
	version: string;
	description: string;
	rows: number;
	columns: number;
	created_at: string;
	parent_id: string | null;
	dataset_metadata: DatasetMeta;
	file: FileInfo;
	file_id: string;
}

const CLEAN_STRATEGIES = [
	{ value: "drop_nulls", label: "Drop Nulls" },
	{ value: "fill_mean", label: "Fill with Mean" },
	{ value: "fill_median", label: "Fill with Median" },
	{ value: "fill_mode", label: "Fill with Mode" },
	{ value: "drop_columns", label: "Drop Columns" },
	{ value: "remove_outliers_iqr", label: "Remove Outliers (IQR)" },
];

const TRANSFORM_STRATEGIES = [
	{ value: "standard_scaler", label: "Standard Scaler" },
	{ value: "min_max_scaler", label: "Min-Max Scaler" },
	{ value: "label_encoder", label: "Label Encoder" },
	{ value: "one_hot_encoder", label: "One-Hot Encoder (Dummies)" },
	{ value: "log_transform", label: "Log1p Transform" },
];

export function DatasetsPage() {
	const user = useAuthStore((state) => state.user);
	const [datasets, setDatasets] = useState<Dataset[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadName, setUploadName] = useState("");
	const [uploadDescription, setUploadDescription] = useState("");
	const [isUploading, setIsUploading] = useState(false);

	// Explorer sheet state
	const [explorerDs, setExplorerDs] = useState<Dataset | null>(null);
	const [explorerTab, setExplorerTab] = useState("preview");

	// Wrangle tool state (integrated into Explorer)
	const [isWrangling, setIsWrangling] = useState(false);
	const [cleanStrategy, setCleanStrategy] = useState("drop_nulls");
	const [cleanCols, setCleanCols] = useState<string[]>([]);
	const [cleanSearch, setCleanSearch] = useState("");
	const [transformStrategy, setTransformStrategy] = useState("standard_scaler");
	const [transformCols, setTransformCols] = useState<string[]>([]);
	const [transformSearch, setTransformSearch] = useState("");

	// Edit/rename dialog state
	const [editDs, setEditDs] = useState<Dataset | null>(null);
	const [editName, setEditName] = useState("");
	const [editDescription, setEditDescription] = useState("");
	const [isSavingEdit, setIsSavingEdit] = useState(false);

	// Delete confirm dialog state
	const [deleteDs, setDeleteDs] = useState<Dataset | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Versions sheet state
	const [versionsDs, setVersionsDs] = useState<Dataset | null>(null);
	const [versions, setVersions] = useState<Dataset[]>([]);
	const [isLoadingVersions, setIsLoadingVersions] = useState(false);

	const fetchDatasets = async () => {
		try {
			setIsLoading(true);
			const res = await api.get("/datasets");
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
			const file = e.target.files[0];
			setSelectedFile(file);
			// Auto-fill name from filename (without extension) if not already set
			if (!uploadName.trim()) {
				setUploadName(file.name.replace(/\.[^.]+$/, ""));
			}
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
			const fileRes = await api.post("/dataset/upload", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			const fileId: string = fileRes.data.id;
			const fileType: string = fileRes.data.file_type;
			await api.post("/dataset", {
				name: uploadName.trim() || selectedFile.name.replace(/\.[^.]+$/, ""),
				description: uploadDescription.trim() || "Uploaded via web interface",
				file_id: fileId,
				rows: 0,
				columns: 0,
				dataset_metadata: { file_type: fileType },
			});
			toast.success("Dataset uploaded successfully!");
			setSelectedFile(null);
			setUploadName("");
			setUploadDescription("");
			setIsUploadOpen(false);
			await fetchDatasets();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Upload failed");
		} finally {
			setIsUploading(false);
		}
	};

	const handleDeleteConfirm = async () => {
		if (!deleteDs) return;
		try {
			setIsDeleting(true);
			await api.delete(`/dataset/${deleteDs.id}`);
			toast.success(`"${deleteDs.name}" deleted`);
			setDatasets((prev) => prev.filter((d) => d.id !== deleteDs.id));
			setDeleteDs(null);
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Delete failed");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleRefresh = async (id: string, name: string) => {
		try {
			toast.info(`Refreshing "${name}"...`);
			await api.post(`/dataset/${id}/refresh`);
			toast.success(`"${name}" metadata refreshed!`);
			await fetchDatasets();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Refresh failed");
		}
	};

	const openEdit = (ds: Dataset) => {
		setEditDs(ds);
		setEditName(ds.name);
		setEditDescription(ds.description);
	};

	const handleEditSave = async () => {
		if (!editDs) return;
		try {
			setIsSavingEdit(true);
			await api.put(`/dataset/${editDs.id}`, {
				name: editName,
				description: editDescription,
				file_id: editDs.file_id,
				rows: editDs.rows,
				columns: editDs.columns,
				dataset_metadata: editDs.dataset_metadata,
			});
			toast.success("Dataset updated!");
			setEditDs(null);
			await fetchDatasets();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Update failed");
		} finally {
			setIsSavingEdit(false);
		}
	};

	const openVersions = async (ds: Dataset) => {
		setVersionsDs(ds);
		setVersions([]);
		setIsLoadingVersions(true);
		try {
			const res = await api.get(`/dataset/${ds.id}/versions`);
			setVersions(res.data || []);
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Failed to load versions");
		} finally {
			setIsLoadingVersions(false);
		}
	};

	const handleClean = async () => {
		if (!explorerDs) return;
		if (cleanStrategy === "drop_columns" && cleanCols.length === 0) {
			toast.error("Select at least one column to drop");
			return;
		}
		try {
			setIsWrangling(true);
			await api.post(`/dataset/${explorerDs.id}/clean`, {
				strategy: cleanStrategy,
				columns: cleanCols.length > 0 ? cleanCols : undefined,
			});
			toast.success("Dataset cleaned — new version created!");
			setExplorerDs(null);
			await fetchDatasets();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Clean failed");
		} finally {
			setIsWrangling(false);
		}
	};

	const handleTransform = async () => {
		if (!explorerDs) return;
		if (
			(transformStrategy === "label_encoder" ||
				transformStrategy === "one_hot_encoder") &&
			transformCols.length === 0
		) {
			toast.error("Select at least one column to encode");
			return;
		}
		const meta = explorerDs.dataset_metadata;
		const allCols = meta?.dtypes ? Object.keys(meta.dtypes) : [];
		if (allCols.length === 0) {
			toast.error("No columns found in dataset metadata");
			return;
		}
		try {
			setIsWrangling(true);
			await api.post(`/dataset/${explorerDs.id}/transform`, {
				strategy: transformStrategy,
				columns: transformCols.length > 0 ? transformCols : allCols,
			});
			toast.success("Dataset transformed — new version created!");
			setExplorerDs(null);
			await fetchDatasets();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Transform failed");
		} finally {
			setIsWrangling(false);
		}
	};

	// ── preview table ──────────────────────────────────────────────────
	const PreviewTable = ({ ds }: { ds: Dataset }) => {
		const [page, setPage] = useState(1);
		const [data, setData] = useState<any[]>([]);
		const [totalRows, setTotalRows] = useState(0);
		const [totalPages, setTotalPages] = useState(0);
		const [loading, setLoading] = useState(false);
		const limit = 50;

		useEffect(() => {
			let isMounted = true;
			const fetchData = async () => {
				setLoading(true);
				try {
					const res = await api.get(
						`/dataset/${ds.id}/data?page=${page}&limit=${limit}`,
					);
					if (isMounted) {
						setData(res.data.data);
						setTotalRows(res.data.total_rows);
						setTotalPages(res.data.total_pages);
					}
				} catch (err) {
					if (isMounted) toast.error("Failed to load data for preview");
				} finally {
					if (isMounted) setLoading(false);
				}
			};
			fetchData();
			return () => {
				isMounted = false;
			};
		}, [ds.id, page]);

		const dtypes = ds.dataset_metadata?.dtypes ?? {};
		const missing = ds.dataset_metadata?.missing_percentage ?? {};
		const cols = Object.keys(dtypes);

		if (loading && data.length === 0) {
			return (
				<div className="flex justify-center p-8">
					<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
				</div>
			);
		}

		if (!loading && data.length === 0)
			return (
				<p className="text-sm text-muted-foreground py-4 text-center">
					No preview data available.
				</p>
			);
		return (
			<div className="space-y-4">
				<div className="overflow-auto rounded-lg border max-h-[500px]">
					<table className="min-w-full text-xs">
						<thead className="bg-muted/60 sticky top-0 z-10">
							<tr>
								{cols.map((c) => (
									<th
										key={c}
										className="px-3 py-2 text-left font-semibold whitespace-nowrap border-b bg-muted/60 backdrop-blur-sm"
									>
										<div>{c}</div>
										<div className="text-muted-foreground font-normal">
											{dtypes[c]}
										</div>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{data.map((row, i) => (
								<tr
									key={i}
									className="border-b last:border-0 hover:bg-muted/30 transition-colors"
								>
									{cols.map((c) => (
										<td key={c} className="px-3 py-1.5 whitespace-nowrap">
											{String(row[c] ?? "—")}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">
						Showing {(page - 1) * limit + 1} to{" "}
						{Math.min(page * limit, totalRows)} of {totalRows} rows
					</span>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage(page - 1)}
							disabled={page <= 1 || loading}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage(page + 1)}
							disabled={page >= totalPages || loading}
						>
							Next
						</Button>
					</div>
				</div>
				{cols.some((c) => (missing[c] ?? 0) > 0) && (
					<div className="p-3 border rounded-lg bg-muted/20 space-y-1">
						<p className="text-xs font-medium text-muted-foreground mb-2">
							Missing Values
						</p>
						{cols
							.filter((c) => (missing[c] ?? 0) > 0)
							.map((c) => (
								<div key={c} className="flex items-center gap-2 text-xs">
									<span className="w-32 truncate">{c}</span>
									<div className="flex-1 bg-muted rounded-full h-1.5">
										<div
											className="bg-orange-500 h-1.5 rounded-full"
											style={{ width: `${missing[c]}%` }}
										/>
									</div>
									<span className="w-10 text-right text-muted-foreground">
										{missing[c].toFixed(1)}%
									</span>
								</div>
							))}
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			{/* Header */}
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
					<Dialog
						open={isUploadOpen}
						onOpenChange={(o) => {
							setIsUploadOpen(o);
							if (!o) {
								setSelectedFile(null);
								setUploadName("");
								setUploadDescription("");
							}
						}}
					>
						<DialogTrigger asChild>
							<Button className="gap-2">
								<Plus className="w-4 h-4" />
								New Dataset
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[460px]">
							<DialogHeader>
								<DialogTitle>Upload Dataset</DialogTitle>
								<DialogDescription>
									Upload a CSV or Excel file to create a new dataset.
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-2">
								{/* File picker */}
								<label
									htmlFor="file-upload"
									className="border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors h-36"
								>
									<FileUp className="w-8 h-8 text-muted-foreground" />
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

								{/* Name */}
								<div className="space-y-1.5">
									<Label htmlFor="upload-name">
										Name{" "}
										<span className="text-muted-foreground text-xs">
											(auto-filled from filename)
										</span>
									</Label>
									<Input
										id="upload-name"
										placeholder="Dataset name"
										value={uploadName}
										onChange={(e) => setUploadName(e.target.value)}
									/>
								</div>

								{/* Description */}
								<div className="space-y-1.5">
									<Label htmlFor="upload-desc">
										Description{" "}
										<span className="text-muted-foreground text-xs">
											(optional)
										</span>
									</Label>
									<Textarea
										id="upload-desc"
										placeholder="Short description of this dataset"
										value={uploadDescription}
										onChange={(e) => setUploadDescription(e.target.value)}
										rows={2}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => {
										setIsUploadOpen(false);
										setSelectedFile(null);
										setUploadName("");
										setUploadDescription("");
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

			{/* Cards */}
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
											{ds.file?.file_type ?? "—"}
										</span>
										{ds.parent_id && (
											<Badge variant="outline" className="text-xs gap-1">
												<GitBranch className="w-2.5 h-2.5" /> derived
											</Badge>
										)}
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
										<DropdownMenuItem
											className="gap-2"
											onClick={() => setExplorerDs(ds)}
										>
											<Eye className="w-4 h-4" /> Preview
										</DropdownMenuItem>
										<DropdownMenuItem
											className="gap-2"
											onClick={() => {
												setExplorerDs(ds);
												setExplorerTab("wrangle");
											}}
										>
											<Wand2 className="w-4 h-4" /> Wrangle
										</DropdownMenuItem>
										<DropdownMenuItem
											className="gap-2"
											onClick={() => openEdit(ds)}
										>
											<Pencil className="w-4 h-4" /> Edit
										</DropdownMenuItem>
										<DropdownMenuItem
											className="gap-2"
											onClick={() => openVersions(ds)}
										>
											<GitBranch className="w-4 h-4" /> Versions
										</DropdownMenuItem>
										<DropdownMenuItem
											className="gap-2"
											onClick={() => handleRefresh(ds.id, ds.name)}
										>
											<RefreshCw className="w-4 h-4" /> Refresh metadata
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="gap-2 text-destructive focus:text-destructive"
											onClick={() => setDeleteDs(ds)}
										>
											<Trash2 className="w-4 h-4" /> Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-2 mt-1">
									<div className="rounded-lg bg-muted/50 p-2 text-center">
										<p className="text-xs text-muted-foreground">Rows</p>
										<p className="text-lg font-bold">
											{ds.rows.toLocaleString()}
										</p>
									</div>
									<div className="rounded-lg bg-muted/50 p-2 text-center">
										<p className="text-xs text-muted-foreground">Columns</p>
										<p className="text-lg font-bold">{ds.columns}</p>
									</div>
								</div>
								{/* Data quality indicator */}
								{ds.dataset_metadata?.missing_percentage &&
									(() => {
										const vals = Object.values(
											ds.dataset_metadata.missing_percentage as Record<
												string,
												number
											>,
										);
										const avgMissing = vals.length
											? vals.reduce((a, b) => a + b, 0) / vals.length
											: 0;
										const quality = Math.max(0, 100 - avgMissing);
										return (
											<div className="mt-2 space-y-1">
												<div className="flex justify-between text-xs text-muted-foreground">
													<span>Data quality</span>
													<span
														className={
															quality >= 90
																? "text-emerald-400"
																: quality >= 70
																	? "text-amber-400"
																	: "text-red-400"
														}
													>
														{quality.toFixed(0)}%
													</span>
												</div>
												<Progress
													value={quality}
													className={`h-1 ${quality >= 90 ? "[&>[data-slot=progress-indicator]]:bg-emerald-400" : quality >= 70 ? "[&>[data-slot=progress-indicator]]:bg-amber-400" : "[&>[data-slot=progress-indicator]]:bg-red-400"}`}
												/>
											</div>
										);
									})()}
							</CardContent>
							<CardFooter className="border-t pt-3 gap-2">
								<Button
									variant="ghost"
									size="sm"
									className="flex-1 gap-2 text-muted-foreground hover:text-primary"
									onClick={() => setExplorerDs(ds)}
								>
									<Eye className="w-4 h-4" /> Preview
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="flex-1 gap-2 text-muted-foreground hover:text-primary"
									onClick={() => {
										setExplorerDs(ds);
										setExplorerTab("wrangle");
									}}
								>
									<Wand2 className="w-4 h-4" /> Wrangle
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			)}

			{/* ── Delete Confirmation Dialog ───────────────────────────── */}
			<Dialog open={!!deleteDs} onOpenChange={(o) => !o && setDeleteDs(null)}>
				<DialogContent className="sm:max-w-[400px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-destructive">
							<Trash2 className="w-5 h-5" /> Delete Dataset
						</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete{" "}
							<span className="font-semibold text-foreground">
								{deleteDs?.name}
							</span>
							? This will permanently remove the dataset and its file. This
							action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteDs(null)}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteConfirm}
							disabled={isDeleting}
						>
							{isDeleting ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
								</>
							) : (
								"Delete"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Edit / Rename Dialog ─────────────────────────────────── */}
			<Dialog open={!!editDs} onOpenChange={(o) => !o && setEditDs(null)}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Pencil className="w-5 h-5" /> Edit Dataset
						</DialogTitle>
						<DialogDescription>
							Update the name and description of this dataset.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label htmlFor="edit-name">Name</Label>
							<Input
								id="edit-name"
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								placeholder="Dataset name"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="edit-desc">Description</Label>
							<Textarea
								id="edit-desc"
								value={editDescription}
								onChange={(e) => setEditDescription(e.target.value)}
								placeholder="Short description"
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setEditDs(null)}
							disabled={isSavingEdit}
						>
							Cancel
						</Button>
						<Button
							onClick={handleEditSave}
							disabled={isSavingEdit || !editName.trim()}
						>
							{isSavingEdit ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
								</>
							) : (
								"Save"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Versions Sheet ───────────────────────────────────────── */}
			<Sheet
				open={!!versionsDs}
				onOpenChange={(o) => !o && setVersionsDs(null)}
			>
				<SheetContent className="w-full sm:max-w-lg overflow-y-auto">
					{versionsDs && (
						<>
							<SheetHeader className="mb-4">
								<SheetTitle className="flex items-center gap-2">
									<GitBranch className="w-5 h-5" /> Version History
								</SheetTitle>
								<SheetDescription>
									All versions of{" "}
									<span className="font-medium text-foreground">
										{versionsDs.name}
									</span>
								</SheetDescription>
							</SheetHeader>
							{isLoadingVersions ? (
								<div className="flex items-center justify-center py-12">
									<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
								</div>
							) : versions.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-8">
									No version history found.
								</p>
							) : (
								<div className="relative border-l-2 border-muted/60 ml-4 space-y-6 py-4">
									{[...versions]
										.sort((a, b) => a.version.localeCompare(b.version))
										.map((v) => (
											<div key={v.id} className="relative pl-6">
												{/* Connecting dot */}
												<div className="absolute w-3.5 h-3.5 bg-primary/80 rounded-full -left-[8px] top-4 ring-4 ring-background" />

												<div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 space-y-2 hover:border-primary/50 transition-colors hover:shadow-md cursor-default">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-2">
															<Badge
																variant="secondary"
																className="font-mono text-xs"
															>
																v{v.version}
															</Badge>
															{!v.parent_id && (
																<Badge
																	variant="outline"
																	className="text-xs text-primary border-primary/40"
																>
																	original
																</Badge>
															)}
														</div>
														<span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
															{new Date(v.created_at).toLocaleDateString()}
														</span>
													</div>
													<p className="text-sm font-semibold">{v.name}</p>
													<div className="flex items-center gap-3 text-xs text-muted-foreground">
														<span className="flex items-center gap-1">
															<BarChart3 className="w-3 h-3" />{" "}
															{v.rows.toLocaleString()}
														</span>
														<span className="flex items-center gap-1">
															<Filter className="w-3 h-3" /> {v.columns}
														</span>
														<span className="flex items-center gap-1">
															<Sigma className="w-3 h-3" />{" "}
															{v.file?.file_type?.toUpperCase() ?? "—"}
														</span>
													</div>
												</div>
											</div>
										))}
								</div>
							)}
						</>
					)}
				</SheetContent>
			</Sheet>

			{/* ── Dataset Explorer Sheet ───────────────────────────────── */}
			<Sheet
				open={!!explorerDs}
				onOpenChange={(o) => !o && setExplorerDs(null)}
			>
				<SheetContent className="w-full sm:max-w-4xl flex flex-col h-full p-4 sm:p-6 overflow-hidden">
					{explorerDs && (
						<>
							<div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 space-y-6">
								<SheetHeader className="mb-2">
									<SheetTitle className="flex items-center gap-2">
										<Database className="w-5 h-5" />
										{explorerDs.name}
										<Badge variant="secondary" className="font-mono text-xs">
											v{explorerDs.version}
										</Badge>
									</SheetTitle>
									<SheetDescription>{explorerDs.description}</SheetDescription>
								</SheetHeader>

								{/* Stats row */}
								<div className="grid grid-cols-3 gap-3 mb-4">
									{[
										{
											icon: BarChart3,
											label: "Rows",
											value: explorerDs.rows.toLocaleString(),
										},
										{
											icon: Filter,
											label: "Columns",
											value: explorerDs.columns,
										},
										{
											icon: Sigma,
											label: "File type",
											value: explorerDs.file?.file_type?.toUpperCase() ?? "—",
										},
									].map(({ icon: Icon, label, value }) => (
										<div
											key={label}
											className="rounded-lg bg-muted/50 p-3 text-center"
										>
											<Icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
											<p className="text-xs text-muted-foreground">{label}</p>
											<p className="font-semibold text-sm">{value}</p>
										</div>
									))}
								</div>

								{/* Tabs: Preview / Columns / Stats / Wrangle */}
								<Tabs value={explorerTab} onValueChange={setExplorerTab}>
									<TabsList className="mb-3 w-full">
										<TabsTrigger value="preview" className="flex-1">
											Preview
										</TabsTrigger>
										<TabsTrigger value="columns" className="flex-1">
											Columns
										</TabsTrigger>
										<TabsTrigger value="stats" className="flex-1">
											Statistics
										</TabsTrigger>
										<TabsTrigger value="wrangle" className="flex-1">
											Wrangle
										</TabsTrigger>
									</TabsList>

									<TabsContent value="preview">
										<PreviewTable ds={explorerDs} />
									</TabsContent>

									<TabsContent value="columns">
										{explorerDs.dataset_metadata?.dtypes ? (
											<div className="rounded-lg border overflow-auto">
												<table className="min-w-full text-sm">
													<thead className="bg-muted/60">
														<tr>
															<th className="px-4 py-2 text-left font-semibold border-b">
																Column
															</th>
															<th className="px-4 py-2 text-left font-semibold border-b">
																Type
															</th>
															<th className="px-4 py-2 text-left font-semibold border-b">
																Missing
															</th>
														</tr>
													</thead>
													<tbody>
														{Object.entries(
															explorerDs.dataset_metadata.dtypes,
														).map(([col, dtype]) => {
															const pct =
																explorerDs.dataset_metadata
																	.missing_percentage?.[col] ?? 0;
															return (
																<tr
																	key={col}
																	className="border-b last:border-0 hover:bg-muted/30"
																>
																	<td className="px-4 py-2 font-medium font-mono text-xs">
																		{col}
																	</td>
																	<td className="px-4 py-2">
																		<Badge
																			variant="outline"
																			className="text-xs"
																		>
																			{dtype}
																		</Badge>
																	</td>
																	<td className="px-4 py-2">
																		<div className="flex items-center gap-2">
																			<Progress
																				value={pct}
																				className="h-1.5 w-16"
																			/>
																			<span className="text-xs text-muted-foreground w-10">
																				{pct.toFixed(1)}%
																			</span>
																		</div>
																	</td>
																</tr>
															);
														})}
													</tbody>
												</table>
											</div>
										) : (
											<p className="text-sm text-muted-foreground">
												No column metadata available.
											</p>
										)}
									</TabsContent>

									<TabsContent value="stats" className="space-y-4">
										{(() => {
											const stats = explorerDs.dataset_metadata?.statistics;
											const dtypes = explorerDs.dataset_metadata?.dtypes ?? {};
											const numericCols = Object.entries(dtypes)
												.filter(
													([, t]) => t.includes("int") || t.includes("float"),
												)
												.map(([c]) => c);

											if (!stats || numericCols.length === 0) {
												return (
													<p className="text-sm text-muted-foreground text-center py-8">
														No numeric columns found. Refresh metadata to
														compute statistics.
													</p>
												);
											}

											// Missing values bar chart data
											const missingData = Object.entries(
												explorerDs.dataset_metadata.missing_percentage ?? {},
											)
												.filter(([, v]) => v > 0)
												.map(([col, val]) => ({
													col: col.length > 10 ? `${col.slice(0, 10)}…` : col,
													pct: val,
												}))
												.sort((a, b) => b.pct - a.pct)
												.slice(0, 10);

											// Numeric ranges (min/max/mean) for up to 8 columns
											const rangeData = numericCols.slice(0, 8).map((col) => ({
												col: col.length > 8 ? `${col.slice(0, 8)}…` : col,
												mean: parseFloat((stats[col]?.mean ?? 0).toFixed(2)),
												min: parseFloat((stats[col]?.min ?? 0).toFixed(2)),
												max: parseFloat((stats[col]?.max ?? 0).toFixed(2)),
											}));

											const CHART_COLORS = [
												"#5B8AF0",
												"#4DC0A0",
												"#F5C842",
												"#A78BFA",
												"#E05C5C",
											];

											const TOOLTIP_STYLE = {
												backgroundColor: "#1e2130",
												border: "1px solid rgba(255,255,255,0.1)",
												borderRadius: 8,
												fontSize: 11,
											};

											return (
												<>
													{/* Summary stat cards */}
													<div className="grid grid-cols-3 gap-2">
														{[
															{
																label: "Numeric cols",
																value: numericCols.length,
															},
															{
																label: "Total rows",
																value: explorerDs.rows.toLocaleString(),
															},
															{
																label: "Total cols",
																value: explorerDs.columns,
															},
														].map(({ label, value }) => (
															<div
																key={label}
																className="rounded-lg bg-muted/40 border p-2 text-center"
															>
																<p className="text-xs text-muted-foreground">
																	{label}
																</p>
																<p className="text-base font-bold">{value}</p>
															</div>
														))}
													</div>

													{/* Mean values bar chart */}
													<div>
														<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
															Column Mean Values
														</p>
														<ResponsiveContainer width="100%" height={160}>
															<BarChart
																data={rangeData}
																margin={{
																	top: 2,
																	right: 4,
																	bottom: 0,
																	left: -20,
																}}
															>
																<CartesianGrid
																	strokeDasharray="3 3"
																	stroke="rgba(255,255,255,0.06)"
																	vertical={false}
																/>
																<XAxis
																	dataKey="col"
																	tick={{ fontSize: 10, fill: "#888" }}
																	tickLine={false}
																	axisLine={false}
																/>
																<YAxis
																	tick={{ fontSize: 10, fill: "#888" }}
																	tickLine={false}
																	axisLine={false}
																/>
																<Tooltip
																	contentStyle={TOOLTIP_STYLE}
																	labelStyle={{ color: "#888" }}
																/>
																<Bar
																	dataKey="mean"
																	name="Mean"
																	radius={[4, 4, 0, 0]}
																>
																	{rangeData.map((_, i) => (
																		<Cell
																			key={i}
																			fill={
																				CHART_COLORS[i % CHART_COLORS.length]
																			}
																		/>
																	))}
																</Bar>
															</BarChart>
														</ResponsiveContainer>
													</div>

													{/* Missing values chart (if any) */}
													{missingData.length > 0 && (
														<div>
															<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
																Missing Values (%)
															</p>
															<ResponsiveContainer width="100%" height={130}>
																<BarChart
																	data={missingData}
																	margin={{
																		top: 2,
																		right: 4,
																		bottom: 0,
																		left: -20,
																	}}
																>
																	<CartesianGrid
																		strokeDasharray="3 3"
																		stroke="rgba(255,255,255,0.06)"
																		vertical={false}
																	/>
																	<XAxis
																		dataKey="col"
																		tick={{ fontSize: 10, fill: "#888" }}
																		tickLine={false}
																		axisLine={false}
																	/>
																	<YAxis
																		domain={[0, 100]}
																		tick={{ fontSize: 10, fill: "#888" }}
																		tickLine={false}
																		axisLine={false}
																		unit="%"
																	/>
																	<Tooltip contentStyle={TOOLTIP_STYLE} />
																	<Bar
																		dataKey="pct"
																		name="Missing %"
																		fill="#F5C842"
																		radius={[4, 4, 0, 0]}
																	/>
																</BarChart>
															</ResponsiveContainer>
														</div>
													)}

													{/* Numeric statistics table */}
													<div>
														<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
															Descriptive Statistics
														</p>
														<div className="rounded-lg border overflow-auto">
															<table className="min-w-full text-xs">
																<thead className="bg-muted/60">
																	<tr>
																		{[
																			"Column",
																			"Count",
																			"Mean",
																			"Std",
																			"Min",
																			"25%",
																			"50%",
																			"75%",
																			"Max",
																		].map((h) => (
																			<th
																				key={h}
																				className="px-3 py-1.5 text-left font-semibold border-b whitespace-nowrap"
																			>
																				{h}
																			</th>
																		))}
																	</tr>
																</thead>
																<tbody>
																	{numericCols.map((col) => (
																		<tr
																			key={col}
																			className="border-b last:border-0 hover:bg-muted/20"
																		>
																			<td className="px-3 py-1.5 font-medium font-mono">
																				{col}
																			</td>
																			<td className="px-3 py-1.5 text-muted-foreground">
																				{(stats[col]?.count ?? 0).toFixed(0)}
																			</td>
																			<td className="px-3 py-1.5 text-muted-foreground">
																				{(stats[col]?.mean ?? 0).toFixed(2)}
																			</td>
																			<td className="px-3 py-1.5 text-muted-foreground">
																				{(stats[col]?.std ?? 0).toFixed(2)}
																			</td>
																			<td className="px-3 py-1.5 text-muted-foreground">
																				{(stats[col]?.min ?? 0).toFixed(2)}
																			</td>
																			<td className="px-3 py-1.5 text-muted-foreground">
																				{(stats[col]?.["25%"] ?? 0).toFixed(2)}
																			</td>
																			<td className="px-3 py-1.5 text-muted-foreground">
																				{(stats[col]?.["50%"] ?? 0).toFixed(2)}
																			</td>
																			<td className="px-3 py-1.5 text-muted-foreground">
																				{(stats[col]?.["75%"] ?? 0).toFixed(2)}
																			</td>
																			<td className="px-3 py-1.5 text-muted-foreground">
																				{(stats[col]?.max ?? 0).toFixed(2)}
																			</td>
																		</tr>
																	))}
																</tbody>
															</table>
														</div>
													</div>

													{/* Correlation Matrix */}
													{(() => {
														const correlationDict =
															explorerDs.dataset_metadata?.correlation;
														const corrCols = correlationDict
															? Object.keys(correlationDict)
															: [];
														if (corrCols.length < 2) return null;

														return (
															<div className="pt-2">
																<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
																	Correlation Matrix
																</p>
																<div className="overflow-auto border rounded-xl bg-card p-4">
																	<div
																		className="grid gap-[2px] min-w-max items-center"
																		style={{
																			gridTemplateColumns: `max-content repeat(${corrCols.length}, 36px)`,
																		}}
																	>
																		{/* Header row */}
																		<div className="h-6"></div>
																		{corrCols.map((c) => (
																			<div
																				key={c}
																				className="text-[10px] font-mono text-center truncate text-muted-foreground pb-1"
																				title={c}
																			>
																				{c.slice(0, 4)}
																			</div>
																		))}

																		{/* Data rows */}
																		{corrCols.map((row) => (
																			<div
																				key={row}
																				style={{ display: "contents" }}
																			>
																				<div
																					className="text-[10px] font-mono pr-3 text-right text-muted-foreground truncate max-w-[100px]"
																					title={row}
																				>
																					{row}
																				</div>
																				{corrCols.map((col) => {
																					const val =
																						correlationDict[row][col] ?? 0;
																					const isPositive = val >= 0;
																					const opacity = Math.abs(val);
																					// Green for pos, Red for neg
																					const bg = isPositive
																						? `rgba(77, 192, 160, ${opacity * 0.9 + 0.1})`
																						: `rgba(224, 92, 92, ${opacity * 0.9 + 0.1})`;
																					const isSelf = row === col;
																					const showText =
																						opacity > 0.4 && !isSelf;

																					return (
																						<div
																							key={col}
																							className={`h-9 flex items-center justify-center text-[10px] font-medium ${isSelf ? "bg-muted/80 text-muted-foreground/60" : showText ? "text-white" : "text-transparent"}`}
																							style={{
																								backgroundColor: isSelf
																									? undefined
																									: bg,
																							}}
																							title={`${row} ↔ ${col}: ${val.toFixed(3)}`}
																						>
																							{isSelf ? "—" : val.toFixed(1)}
																						</div>
																					);
																				})}
																			</div>
																		))}
																	</div>
																</div>
															</div>
														);
													})()}
												</>
											);
										})()}
									</TabsContent>
									<TabsContent value="wrangle">
										<div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 space-y-4">
											<div>
												<h3 className="text-lg font-semibold flex items-center gap-2">
													<Wand2 className="w-5 h-5" /> Data Pipeline
												</h3>
												<p className="text-sm text-muted-foreground">
													Configurations set here execute on the backend,
													generating a cleanly formatted derivative version of
													your dataset.
												</p>
											</div>
											<Tabs defaultValue="clean" className="mt-2 w-full">
												<TabsList className="w-full">
													<TabsTrigger value="clean" className="flex-1">
														Clean
													</TabsTrigger>
													<TabsTrigger value="transform" className="flex-1">
														Transform
													</TabsTrigger>
												</TabsList>

												{/* ── Clean tab ── */}
												<TabsContent
													value="clean"
													className="space-y-4 pt-4 pb-2"
												>
													<div className="space-y-1.5">
														<Label>Strategy</Label>
														<Select
															value={cleanStrategy}
															onValueChange={setCleanStrategy}
														>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																{CLEAN_STRATEGIES.map((s) => (
																	<SelectItem key={s.value} value={s.value}>
																		{s.label}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>

													{/* Column picker for clean */}
													{(() => {
														const dtypes =
															explorerDs?.dataset_metadata?.dtypes ?? {};
														const allCols = Object.keys(dtypes);
														if (allCols.length === 0) return null;
														const toggleCol = (col: string) =>
															setCleanCols((prev) =>
																prev.includes(col)
																	? prev.filter((c) => c !== col)
																	: [...prev, col],
															);
														const filteredCols = cleanSearch
															? allCols.filter((c) =>
																	c
																		.toLowerCase()
																		.includes(cleanSearch.toLowerCase()),
																)
															: allCols;
														return (
															<div className="space-y-1.5">
																<div className="flex items-center justify-between">
																	<Label className="text-sm">Columns</Label>
																	<div className="flex gap-2 text-xs">
																		<button
																			type="button"
																			className="text-primary hover:underline"
																			onClick={() => setCleanCols(allCols)}
																		>
																			All
																		</button>
																		<span className="text-muted-foreground">
																			·
																		</span>
																		<button
																			type="button"
																			className="text-muted-foreground hover:underline"
																			onClick={() => setCleanCols([])}
																		>
																			None
																		</button>
																	</div>
																</div>
																<Input
																	placeholder="Search columns..."
																	value={cleanSearch}
																	onChange={(e) =>
																		setCleanSearch(e.target.value)
																	}
																	className="h-8 text-xs"
																/>
																<p className="text-xs text-muted-foreground">
																	Leave all unselected to apply to every column.
																</p>
																<div className="rounded-lg border bg-muted/20 p-2 max-h-40 overflow-y-auto grid grid-cols-2 gap-1">
																	{filteredCols.map((col) => (
																		<label
																			key={col}
																			className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer text-xs"
																		>
																			<input
																				type="checkbox"
																				className="accent-primary w-3.5 h-3.5 shrink-0"
																				checked={cleanCols.includes(col)}
																				onChange={() => toggleCol(col)}
																			/>
																			<span
																				className="truncate font-mono"
																				title={col}
																			>
																				{col}
																			</span>
																			<span className="ml-auto text-muted-foreground shrink-0">
																				{dtypes[col]}
																			</span>
																		</label>
																	))}
																</div>
																{cleanCols.length > 0 && (
																	<p className="text-xs text-primary">
																		{cleanCols.length} column
																		{cleanCols.length > 1 ? "s" : ""} selected
																	</p>
																)}
															</div>
														);
													})()}

													<div className="flex justify-end pt-2 pb-1">
														<Button
															onClick={handleClean}
															disabled={isWrangling}
														>
															{isWrangling ? (
																<>
																	<Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
																	Executing Pipeline...
																</>
															) : (
																"Apply Clean"
															)}
														</Button>
													</div>
												</TabsContent>

												{/* ── Transform tab ── */}
												<TabsContent
													value="transform"
													className="space-y-4 pt-4 pb-2"
												>
													<div className="space-y-1.5">
														<Label>Strategy</Label>
														<Select
															value={transformStrategy}
															onValueChange={(v) => {
																setTransformStrategy(v);
																const dtypes =
																	explorerDs?.dataset_metadata?.dtypes ?? {};
																if (v === "label_encoder") {
																	const catCols = Object.entries(dtypes)
																		.filter(
																			([, t]) =>
																				!(t as string).includes("int") &&
																				!(t as string).includes("float"),
																		)
																		.map(([c]) => c);
																	setTransformCols(catCols);
																} else {
																	const numCols = Object.entries(dtypes)
																		.filter(
																			([, t]) =>
																				(t as string).includes("int") ||
																				(t as string).includes("float"),
																		)
																		.map(([c]) => c);
																	setTransformCols(numCols);
																}
															}}
														>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																{TRANSFORM_STRATEGIES.map((s) => (
																	<SelectItem key={s.value} value={s.value}>
																		{s.label}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<p className="text-xs text-muted-foreground">
															{transformStrategy === "label_encoder"
																? "Encodes text/category columns as integers. Select the columns to encode."
																: "Scales numeric columns. Select which columns to scale, or leave all selected."}
														</p>
													</div>

													{/* Column picker for transform */}
													{(() => {
														const dtypes =
															explorerDs?.dataset_metadata?.dtypes ?? {};
														const isLabelEncode =
															transformStrategy === "label_encoder" ||
															transformStrategy === "one_hot_encoder";

														const eligibleCols = isLabelEncode
															? Object.keys(dtypes)
															: Object.entries(dtypes)
																	.filter(
																		([, t]) =>
																			(t as string).includes("int") ||
																			(t as string).includes("float"),
																	)
																	.map(([c]) => c);

														if (eligibleCols.length === 0)
															return (
																<p className="text-xs text-muted-foreground">
																	No eligible columns found.
																</p>
															);

														const toggleCol = (col: string) =>
															setTransformCols((prev) =>
																prev.includes(col)
																	? prev.filter((c) => c !== col)
																	: [...prev, col],
															);

														const filteredCols = transformSearch
															? eligibleCols.filter((c) =>
																	c
																		.toLowerCase()
																		.includes(transformSearch.toLowerCase()),
																)
															: eligibleCols;

														return (
															<div className="space-y-1.5">
																<div className="flex items-center justify-between">
																	<Label className="text-sm">
																		Columns
																		{isLabelEncode && (
																			<span className="text-destructive ml-1">
																				*
																			</span>
																		)}
																	</Label>
																	<div className="flex gap-2 text-xs">
																		<button
																			type="button"
																			className="text-primary hover:underline"
																			onClick={() =>
																				setTransformCols(eligibleCols)
																			}
																		>
																			All
																		</button>
																		<span className="text-muted-foreground">
																			·
																		</span>
																		<button
																			type="button"
																			className="text-muted-foreground hover:underline"
																			onClick={() => setTransformCols([])}
																		>
																			None
																		</button>
																	</div>
																</div>
																<Input
																	placeholder="Search columns..."
																	value={transformSearch}
																	onChange={(e) =>
																		setTransformSearch(e.target.value)
																	}
																	className="h-8 text-xs"
																/>
																<div className="rounded-lg border bg-muted/20 p-2 max-h-44 overflow-y-auto grid grid-cols-2 gap-1">
																	{filteredCols.map((col) => {
																		const dtype = dtypes[col] as string;
																		const isCat =
																			!dtype.includes("int") &&
																			!dtype.includes("float");
																		return (
																			<label
																				key={col}
																				className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer text-xs"
																			>
																				<input
																					type="checkbox"
																					className="accent-primary w-3.5 h-3.5 shrink-0"
																					checked={transformCols.includes(col)}
																					onChange={() => toggleCol(col)}
																				/>
																				<span
																					className="truncate font-mono"
																					title={col}
																				>
																					{col}
																				</span>
																				<Badge
																					variant="outline"
																					className={`ml-auto text-[10px] px-1 py-0 h-4 shrink-0 ${isCat ? "border-amber-500/40 text-amber-400" : "border-blue-500/40 text-blue-400"}`}
																				>
																					{isCat ? "cat" : "num"}
																				</Badge>
																			</label>
																		);
																	})}
																</div>
																{transformCols.length > 0 ? (
																	<p className="text-xs text-primary">
																		{transformCols.length} column
																		{transformCols.length > 1 ? "s" : ""}{" "}
																		selected
																	</p>
																) : isLabelEncode ? (
																	<p className="text-xs text-destructive">
																		At least one column must be selected
																	</p>
																) : null}
															</div>
														);
													})()}

													<div className="flex justify-end pt-2 pb-1">
														<Button
															onClick={handleTransform}
															disabled={isWrangling}
														>
															{isWrangling ? (
																<>
																	<Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
																	Executing Pipeline...
																</>
															) : (
																"Apply Transform"
															)}
														</Button>
													</div>
												</TabsContent>
											</Tabs>
										</div>
									</TabsContent>
								</Tabs>
							</div>

							<div className="mt-4 pt-4 border-t flex gap-2 shrink-0 bg-background">
								<Button
									variant="outline"
									className="gap-2 shadow-sm"
									onClick={() => {
										openEdit(explorerDs);
										setExplorerDs(null);
									}}
								>
									<Pencil className="w-4 h-4" /> Edit Details
								</Button>
								<Button
									variant="outline"
									className="gap-2 shadow-sm"
									onClick={() => handleRefresh(explorerDs.id, explorerDs.name)}
								>
									<RefreshCw className="w-4 h-4" /> Hard Refresh
								</Button>
							</div>
						</>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}
