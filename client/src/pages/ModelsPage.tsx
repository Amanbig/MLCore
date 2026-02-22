import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
	CardHeader,
	CardTitle,
	CardDescription,
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
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
	Library,
	MoreVertical,
	Plus,
	Trash2,
	RefreshCw,
	Loader2,
	FlaskConical,
	GitBranch,
	TrendingUp,
	TrendingDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Dataset {
	id: string;
	name: string;
}

interface MLModel {
	id: string;
	name: string;
	version: string;
	model_type: string;
	accuracy: number;
	error: number;
	description: string;
	parent_id: string | null;
	created_at?: string;
}

// ── Classifiers ────────────────────────────────────────────────────────────
const CLASSIFIER_ALGOS = [
	{ value: "random_forest_classifier", label: "Random Forest Classifier" },
	{ value: "logistic_regression", label: "Logistic Regression" },
	{ value: "svm", label: "Support Vector Machine (SVC)" },
	{ value: "decision_tree", label: "Decision Tree Classifier" },
	{ value: "gradient_boosting", label: "Gradient Boosting Classifier" },
	{ value: "knn", label: "K-Nearest Neighbors" },
	{ value: "naive_bayes", label: "Naive Bayes (Gaussian)" },
];

// ── Regressors ─────────────────────────────────────────────────────────────
const REGRESSOR_ALGOS = [
	{ value: "linear_regression", label: "Linear Regression" },
	{ value: "random_forest_regressor", label: "Random Forest Regressor" },
	{ value: "ridge", label: "Ridge Regression" },
	{ value: "lasso", label: "Lasso Regression" },
	{ value: "svr", label: "Support Vector Regressor (SVR)" },
	{ value: "decision_tree_regressor", label: "Decision Tree Regressor" },
	{
		value: "gradient_boosting_regressor",
		label: "Gradient Boosting Regressor",
	},
];

const EMPTY_FORM = {
	dataset_id: "",
	model_algorithm: "",
	target_column: "",
	features: "",
	hyperparameters: "{}",
};

export function ModelsPage() {
	const [models, setModels] = useState<MLModel[]>([]);
	const [datasets, setDatasets] = useState<Dataset[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Train dialog
	const [isTrainOpen, setIsTrainOpen] = useState(false);
	const [isTraining, setIsTraining] = useState(false);
	const [trainForm, setTrainForm] = useState(EMPTY_FORM);

	// Retrain dialog
	const [retrainModel, setRetrainModel] = useState<MLModel | null>(null);
	const [isRetraining, setIsRetraining] = useState(false);
	const [retrainForm, setRetrainForm] = useState(EMPTY_FORM);

	// Lineage sheet
	const [lineageModel, setLineageModel] = useState<MLModel | null>(null);
	const [lineageVersions, setLineageVersions] = useState<MLModel[]>([]);
	const [isLoadingLineage, setIsLoadingLineage] = useState(false);

	const fetchData = async () => {
		try {
			setIsLoading(true);
			const [modelsRes, datasetsRes] = await Promise.all([
				api.get("/ml_models"),
				api.get("/datasets"),
			]);
			setModels(modelsRes.data || []);
			setDatasets(datasetsRes.data || []);
		} catch (error: any) {
			if (error.response?.status !== 401) {
				toast.error("Failed to load models");
			}
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const buildPayload = (form: typeof EMPTY_FORM) => {
		let hyperparameters = {};
		try {
			hyperparameters = JSON.parse(form.hyperparameters);
		} catch {
			/* ignore */
		}
		return {
			dataset_id: form.dataset_id,
			model_algorithm: form.model_algorithm,
			target_column: form.target_column,
			features: form.features
				? form.features
						.split(",")
						.map((f) => f.trim())
						.filter(Boolean)
				: null,
			hyperparameters,
		};
	};

	const handleTrain = async () => {
		if (
			!trainForm.dataset_id ||
			!trainForm.model_algorithm ||
			!trainForm.target_column
		) {
			toast.error("Please fill in all required fields");
			return;
		}
		try {
			setIsTraining(true);
			await api.post("/ml_model/train", buildPayload(trainForm));
			toast.success("Model trained successfully!");
			setIsTrainOpen(false);
			setTrainForm(EMPTY_FORM);
			await fetchData();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Training failed");
		} finally {
			setIsTraining(false);
		}
	};

	const handleRetrain = async () => {
		if (!retrainModel) return;
		if (
			!retrainForm.dataset_id ||
			!retrainForm.model_algorithm ||
			!retrainForm.target_column
		) {
			toast.error("Please fill in all required fields");
			return;
		}
		try {
			setIsRetraining(true);
			await api.post(
				`/ml_model/${retrainModel.id}/retrain`,
				buildPayload(retrainForm),
			);
			toast.success("Model retrained — new version created!");
			setRetrainModel(null);
			setRetrainForm(EMPTY_FORM);
			await fetchData();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Retrain failed");
		} finally {
			setIsRetraining(false);
		}
	};

	const openRetrain = (model: MLModel) => {
		setRetrainModel(model);
		setRetrainForm({
			...EMPTY_FORM,
			model_algorithm: model.model_type,
		});
	};

	const openLineage = async (model: MLModel) => {
		setLineageModel(model);
		setLineageVersions([]);
		try {
			setIsLoadingLineage(true);
			const res = await api.get(`/ml_model/${model.id}/versions`);
			setLineageVersions(res.data || []);
		} catch (_error: any) {
			toast.error("Failed to load version history");
		} finally {
			setIsLoadingLineage(false);
		}
	};

	const handleDelete = async (id: string, name: string) => {
		try {
			await api.delete(`/ml_model/${id}`);
			toast.success(`"${name}" deleted`);
			setModels((prev) => prev.filter((m) => m.id !== id));
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Delete failed");
		}
	};

	// Reusable train form fields
	const TrainFormFields = ({
		form,
		setForm,
	}: {
		form: typeof EMPTY_FORM;
		setForm: (f: typeof EMPTY_FORM) => void;
	}) => (
		<div className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label>
					Dataset <span className="text-destructive">*</span>
				</Label>
				<Select
					value={form.dataset_id}
					onValueChange={(v) => setForm({ ...form, dataset_id: v })}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select a dataset..." />
					</SelectTrigger>
					<SelectContent>
						{datasets.map((d) => (
							<SelectItem key={d.id} value={d.id}>
								{d.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<Label>
					Algorithm <span className="text-destructive">*</span>
				</Label>
				<Select
					value={form.model_algorithm}
					onValueChange={(v) => setForm({ ...form, model_algorithm: v })}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select an algorithm..." />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Classifiers</SelectLabel>
							{CLASSIFIER_ALGOS.map((a) => (
								<SelectItem key={a.value} value={a.value}>
									{a.label}
								</SelectItem>
							))}
						</SelectGroup>
						<SelectGroup>
							<SelectLabel>Regressors</SelectLabel>
							{REGRESSOR_ALGOS.map((a) => (
								<SelectItem key={a.value} value={a.value}>
									{a.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<Label htmlFor="target">
					Target Column <span className="text-destructive">*</span>
				</Label>
				<Input
					id="target"
					placeholder="e.g. price, label, species"
					value={form.target_column}
					onChange={(e) => setForm({ ...form, target_column: e.target.value })}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="features">
					Feature Columns{" "}
					<span className="text-muted-foreground text-xs">
						(optional, comma-separated)
					</span>
				</Label>
				<Input
					id="features"
					placeholder="e.g. col1, col2 — leave blank to use all"
					value={form.features}
					onChange={(e) => setForm({ ...form, features: e.target.value })}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="hyperparams">
					Hyperparameters{" "}
					<span className="text-muted-foreground text-xs">(JSON)</span>
				</Label>
				<Input
					id="hyperparams"
					placeholder='e.g. {"n_estimators": 100}'
					value={form.hyperparameters}
					onChange={(e) =>
						setForm({ ...form, hyperparameters: e.target.value })
					}
				/>
			</div>
		</div>
	);

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">ML Models</h2>
					<p className="text-muted-foreground mt-1">
						Train, retrain, and track lineage of your models.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={fetchData}
						disabled={isLoading}
					>
						<RefreshCw
							className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
						/>
					</Button>
					<Dialog open={isTrainOpen} onOpenChange={setIsTrainOpen}>
						<DialogTrigger asChild>
							<Button className="gap-2">
								<Plus className="w-4 h-4" /> Train Model
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[500px]">
							<DialogHeader>
								<DialogTitle>Train a New Model</DialogTitle>
								<DialogDescription>
									Select a dataset and algorithm to start training.
								</DialogDescription>
							</DialogHeader>
							<TrainFormFields form={trainForm} setForm={setTrainForm} />
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setIsTrainOpen(false)}
									disabled={isTraining}
								>
									Cancel
								</Button>
								<Button onClick={handleTrain} disabled={isTraining}>
									{isTraining ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
											Training...
										</>
									) : (
										<>
											<FlaskConical className="w-4 h-4 mr-2" /> Start Training
										</>
									)}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Model cards */}
			{isLoading ? (
				<div className="flex items-center justify-center min-h-[400px]">
					<Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
				</div>
			) : models.length === 0 ? (
				<div className="border rounded-xl p-8 bg-card/30 backdrop-blur-sm border-dashed border-primary/20 flex flex-col items-center justify-center text-center min-h-[400px]">
					<div className="max-w-[420px] space-y-4">
						<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
							<Library className="w-8 h-8" />
						</div>
						<h3 className="text-xl font-semibold">No models trained yet</h3>
						<p className="text-sm text-muted-foreground">
							Upload a dataset first, then click "Train Model" to get started.
						</p>
						<Button variant="outline" onClick={() => setIsTrainOpen(true)}>
							Train your first model
						</Button>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{models.map((model) => (
						<Card
							key={model.id}
							className="group hover:shadow-md transition-all hover:border-primary/30"
						>
							<CardHeader className="flex flex-row items-start justify-between pb-2">
								<div className="space-y-1 pr-2 min-w-0">
									<CardTitle className="text-base truncate" title={model.name}>
										{model.name}
									</CardTitle>
									<CardDescription className="flex items-center gap-2 flex-wrap">
										<Badge variant="secondary" className="text-xs font-mono">
											v{model.version}
										</Badge>
										<Badge variant="outline" className="text-xs">
											{model.model_type?.replace(/_/g, " ")}
										</Badge>
										{model.parent_id && (
											<Badge
												variant="outline"
												className="text-xs gap-1 text-blue-500 border-blue-500/30"
											>
												<GitBranch className="w-3 h-3" /> Retrained
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
											onClick={() => openRetrain(model)}
										>
											<FlaskConical className="w-4 h-4" /> Retrain
										</DropdownMenuItem>
										<DropdownMenuItem
											className="gap-2"
											onClick={() => openLineage(model)}
										>
											<GitBranch className="w-4 h-4" /> View Lineage
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="gap-2 text-destructive focus:text-destructive"
											onClick={() => handleDelete(model.id, model.name)}
										>
											<Trash2 className="w-4 h-4" /> Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-2 mt-1">
									<div className="rounded-lg bg-muted/50 p-2 text-center">
										<p className="text-xs text-muted-foreground">Accuracy</p>
										<p className="text-lg font-bold text-green-500">
											{(model.accuracy * 100).toFixed(1)}%
										</p>
									</div>
									<div className="rounded-lg bg-muted/50 p-2 text-center">
										<p className="text-xs text-muted-foreground">Error</p>
										<p className="text-lg font-bold text-orange-500">
											{(model.error * 100).toFixed(1)}%
										</p>
									</div>
								</div>
							</CardContent>
							<CardFooter className="border-t pt-3 gap-2">
								<Button
									variant="ghost"
									size="sm"
									className="flex-1 gap-2 text-muted-foreground hover:text-primary"
									onClick={() => openRetrain(model)}
								>
									<FlaskConical className="w-4 h-4" /> Retrain
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="flex-1 gap-2 text-muted-foreground hover:text-primary"
									onClick={() => openLineage(model)}
								>
									<GitBranch className="w-4 h-4" /> Lineage
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			)}

			{/* ── Retrain Dialog ───────────────────────────────────────── */}
			<Dialog
				open={!!retrainModel}
				onOpenChange={(o) => !o && setRetrainModel(null)}
			>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<FlaskConical className="w-5 h-5" /> Retrain —{" "}
							{retrainModel?.name}
						</DialogTitle>
						<DialogDescription>
							Creates a new version of this model. Current: v
							{retrainModel?.version}
						</DialogDescription>
					</DialogHeader>
					<TrainFormFields form={retrainForm} setForm={setRetrainForm} />
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setRetrainModel(null)}
							disabled={isRetraining}
						>
							Cancel
						</Button>
						<Button onClick={handleRetrain} disabled={isRetraining}>
							{isRetraining ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
									Retraining...
								</>
							) : (
								<>
									<FlaskConical className="w-4 h-4 mr-2" /> Retrain
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Lineage Sheet ────────────────────────────────────────── */}
			<Sheet
				open={!!lineageModel}
				onOpenChange={(o) => !o && setLineageModel(null)}
			>
				<SheetContent className="w-full sm:max-w-lg overflow-y-auto">
					{lineageModel && (
						<>
							<SheetHeader className="mb-6">
								<SheetTitle className="flex items-center gap-2">
									<GitBranch className="w-5 h-5" /> Version Lineage
								</SheetTitle>
								<SheetDescription>
									{lineageModel.name} — full version history
								</SheetDescription>
							</SheetHeader>

							{isLoadingLineage ? (
								<div className="flex items-center justify-center py-12">
									<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
								</div>
							) : lineageVersions.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-8">
									No version history found.
								</p>
							) : (
								<div className="relative">
									{/* vertical line */}
									<div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
									<div className="space-y-4">
										{[...lineageVersions]
											.sort((a, b) =>
												a.version.localeCompare(b.version, undefined, {
													numeric: true,
												}),
											)
											.map((v, i) => (
												<div key={v.id} className="flex gap-4 relative">
													<div
														className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${i === 0 ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border"}`}
													>
														<span className="text-xs font-bold">{i + 1}</span>
													</div>
													<div className="flex-1 bg-muted/40 rounded-lg p-3 border">
														<div className="flex items-center justify-between mb-1">
															<div className="flex items-center gap-2">
																<Badge
																	variant="secondary"
																	className="font-mono text-xs"
																>
																	v{v.version}
																</Badge>
																{v.parent_id && (
																	<Badge
																		variant="outline"
																		className="text-xs gap-1 text-blue-500 border-blue-500/30"
																	>
																		<GitBranch className="w-3 h-3" /> Retrained
																	</Badge>
																)}
															</div>
															{v.created_at && (
																<span className="text-xs text-muted-foreground">
																	{new Date(v.created_at).toLocaleDateString()}
																</span>
															)}
														</div>
														<div className="grid grid-cols-2 gap-2 mt-2">
															<div className="flex items-center gap-1.5 text-sm">
																<TrendingUp className="w-4 h-4 text-green-500" />
																<span className="font-medium">
																	{(v.accuracy * 100).toFixed(1)}%
																</span>
																<span className="text-muted-foreground text-xs">
																	acc
																</span>
															</div>
															<div className="flex items-center gap-1.5 text-sm">
																<TrendingDown className="w-4 h-4 text-orange-500" />
																<span className="font-medium">
																	{(v.error * 100).toFixed(1)}%
																</span>
																<span className="text-muted-foreground text-xs">
																	err
																</span>
															</div>
														</div>
														<p className="text-xs text-muted-foreground mt-1">
															{v.model_type?.replace(/_/g, " ")}
														</p>
													</div>
												</div>
											))}
									</div>
								</div>
							)}
						</>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}
