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
	dataset_metadata: DatasetMeta;
	file: FileInfo;
}

const CLEAN_STRATEGIES = [
	{ value: "drop_nulls", label: "Drop Nulls" },
	{ value: "fill_mean", label: "Fill with Mean" },
	{ value: "fill_median", label: "Fill with Median" },
];

const TRANSFORM_STRATEGIES = [
	{ value: "standard_scaler", label: "Standard Scaler" },
	{ value: "min_max_scaler", label: "Min-Max Scaler" },
	{ value: "label_encoder", label: "Label Encoder" },
];

export function DatasetsPage() {
	const user = useAuthStore((state) => state.user);
	const [datasets, setDatasets] = useState<Dataset[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	// Explorer sheet state
	const [explorerDs, setExplorerDs] = useState<Dataset | null>(null);

	// Wrangle dialog state
	const [wrangleDs, setWrangleDs] = useState<Dataset | null>(null);
	const [isWrangling, setIsWrangling] = useState(false);
	const [cleanStrategy, setCleanStrategy] = useState("drop_nulls");
	const [transformStrategy, setTransformStrategy] = useState("standard_scaler");

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
			const fileRes = await api.post("/file", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			const fileId: string = fileRes.data.id;
			const fileType: string = fileRes.data.file_type;
			await api.post("/dataset", {
				name: selectedFile.name.replace(/\.[^.]+$/, ""),
				description: "Uploaded via web interface",
				file_id: fileId,
				rows: 0,
				columns: 0,
				dataset_metadata: { file_type: fileType },
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

	const handleClean = async () => {
		if (!wrangleDs) return;
		try {
			setIsWrangling(true);
			await api.post(`/dataset/${wrangleDs.id}/clean`, {
				strategy: cleanStrategy,
			});
			toast.success("Dataset cleaned — new version created!");
			setWrangleDs(null);
			await fetchDatasets();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Clean failed");
		} finally {
			setIsWrangling(false);
		}
	};

	const handleTransform = async () => {
		if (!wrangleDs) return;
		const meta = wrangleDs.dataset_metadata;
		const allCols = meta?.dtypes ? Object.keys(meta.dtypes) : [];
		if (allCols.length === 0) {
			toast.error("No columns found in dataset metadata");
			return;
		}
		try {
			setIsWrangling(true);
			await api.post(`/dataset/${wrangleDs.id}/transform`, {
				strategy: transformStrategy,
				columns: allCols,
			});
			toast.success("Dataset transformed — new version created!");
			setWrangleDs(null);
			await fetchDatasets();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Transform failed");
		} finally {
			setIsWrangling(false);
		}
	};

	// ── preview table ──────────────────────────────────────────────────
	const PreviewTable = ({ ds }: { ds: Dataset }) => {
		const preview = ds.dataset_metadata?.preview ?? [];
		const dtypes = ds.dataset_metadata?.dtypes ?? {};
		const missing = ds.dataset_metadata?.missing_percentage ?? {};
		const cols = Object.keys(dtypes);
		if (preview.length === 0)
			return (
				<p className="text-sm text-muted-foreground py-4 text-center">
					No preview data available.
				</p>
			);
		return (
			<div className="overflow-auto rounded-lg border">
				<table className="min-w-full text-xs">
					<thead className="bg-muted/60 sticky top-0">
						<tr>
							{cols.map((c) => (
								<th
									key={c}
									className="px-3 py-2 text-left font-semibold whitespace-nowrap border-b"
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
						{preview.map((row, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: preview rows have no stable id
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
				{/* missing values bar */}
				{cols.some((c) => (missing[c] ?? 0) > 0) && (
					<div className="p-3 border-t bg-muted/20 space-y-1">
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
											onClick={() => setWrangleDs(ds)}
										>
											<Wand2 className="w-4 h-4" /> Wrangle
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
									onClick={() => setWrangleDs(ds)}
								>
									<Wand2 className="w-4 h-4" /> Wrangle
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			)}

			{/* ── Dataset Explorer Sheet ───────────────────────────────── */}
			<Sheet
				open={!!explorerDs}
				onOpenChange={(o) => !o && setExplorerDs(null)}
			>
				<SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
					{explorerDs && (
						<>
							<SheetHeader className="mb-4">
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
									{ icon: Filter, label: "Columns", value: explorerDs.columns },
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

							{/* Tabs: Preview / Columns */}
							<Tabs defaultValue="preview">
								<TabsList className="mb-3">
									<TabsTrigger value="preview">Preview (5 rows)</TabsTrigger>
									<TabsTrigger value="columns">Column Types</TabsTrigger>
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
															Missing %
														</th>
													</tr>
												</thead>
												<tbody>
													{Object.entries(
														explorerDs.dataset_metadata.dtypes,
													).map(([col, dtype]) => (
														<tr
															key={col}
															className="border-b last:border-0 hover:bg-muted/30"
														>
															<td className="px-4 py-2 font-medium">{col}</td>
															<td className="px-4 py-2">
																<Badge variant="outline" className="text-xs">
																	{dtype}
																</Badge>
															</td>
															<td className="px-4 py-2 text-muted-foreground">
																{(
																	explorerDs.dataset_metadata
																		.missing_percentage?.[col] ?? 0
																).toFixed(1)}
																%
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									) : (
										<p className="text-sm text-muted-foreground">
											No column metadata available.
										</p>
									)}
								</TabsContent>
							</Tabs>

							<div className="mt-4">
								<Button
									className="gap-2 w-full"
									onClick={() => {
										setWrangleDs(explorerDs);
										setExplorerDs(null);
									}}
								>
									<Wand2 className="w-4 h-4" /> Open Wrangle Dialog
								</Button>
							</div>
						</>
					)}
				</SheetContent>
			</Sheet>

			{/* ── Wrangle Dialog (Clean & Transform) ──────────────────── */}
			<Dialog open={!!wrangleDs} onOpenChange={(o) => !o && setWrangleDs(null)}>
				<DialogContent className="sm:max-w-[480px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Wand2 className="w-5 h-5" /> Wrangle — {wrangleDs?.name}
						</DialogTitle>
						<DialogDescription>
							A new versioned dataset is created after each operation.
						</DialogDescription>
					</DialogHeader>
					<Tabs defaultValue="clean" className="mt-2">
						<TabsList className="w-full">
							<TabsTrigger value="clean" className="flex-1">
								Clean
							</TabsTrigger>
							<TabsTrigger value="transform" className="flex-1">
								Transform
							</TabsTrigger>
						</TabsList>

						<TabsContent value="clean" className="space-y-4 pt-4">
							<div className="space-y-2">
								<p className="text-sm font-medium">Strategy</p>
								<Select value={cleanStrategy} onValueChange={setCleanStrategy}>
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
								<p className="text-xs text-muted-foreground">
									Applied to all columns with missing values.
								</p>
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setWrangleDs(null)}
									disabled={isWrangling}
								>
									Cancel
								</Button>
								<Button onClick={handleClean} disabled={isWrangling}>
									{isWrangling ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
											Cleaning...
										</>
									) : (
										"Apply Clean"
									)}
								</Button>
							</DialogFooter>
						</TabsContent>

						<TabsContent value="transform" className="space-y-4 pt-4">
							<div className="space-y-2">
								<p className="text-sm font-medium">Strategy</p>
								<Select
									value={transformStrategy}
									onValueChange={setTransformStrategy}
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
									Applied to all numeric columns in the dataset.
								</p>
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setWrangleDs(null)}
									disabled={isWrangling}
								>
									Cancel
								</Button>
								<Button onClick={handleTransform} disabled={isWrangling}>
									{isWrangling ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
											Transforming...
										</>
									) : (
										"Apply Transform"
									)}
								</Button>
							</DialogFooter>
						</TabsContent>
					</Tabs>
				</DialogContent>
			</Dialog>
		</div>
	);
}
