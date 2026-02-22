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
	SelectItem,
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

const ALGORITHMS = [
	{ value: "random_forest_classifier", label: "Random Forest Classifier" },
	{ value: "logistic_regression", label: "Logistic Regression" },
	{ value: "svm", label: "Support Vector Machine" },
	{ value: "decision_tree", label: "Decision Tree" },
	{ value: "gradient_boosting", label: "Gradient Boosting" },
];

export function ModelsPage() {
	const [models, setModels] = useState<MLModel[]>([]);
	const [datasets, setDatasets] = useState<Dataset[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isTrainOpen, setIsTrainOpen] = useState(false);
	const [isTraining, setIsTraining] = useState(false);

	const [trainForm, setTrainForm] = useState({
		dataset_id: "",
		model_algorithm: "",
		target_column: "",
		features: "",
		hyperparameters: "{}",
	});

	const fetchData = async () => {
		try {
			setIsLoading(true);
			const [modelsRes, datasetsRes] = await Promise.all([
				api.get("/ml_model"),
				api.get("/dataset"),
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
			let hyperparameters = {};
			try {
				hyperparameters = JSON.parse(trainForm.hyperparameters);
			} catch {
				/* ignore */
			}

			await api.post("/ml_model/train", {
				dataset_id: trainForm.dataset_id,
				model_algorithm: trainForm.model_algorithm,
				target_column: trainForm.target_column,
				features: trainForm.features
					? trainForm.features
							.split(",")
							.map((f) => f.trim())
							.filter(Boolean)
					: null,
				hyperparameters,
			});
			toast.success("Model trained successfully!");
			setIsTrainOpen(false);
			setTrainForm({
				dataset_id: "",
				model_algorithm: "",
				target_column: "",
				features: "",
				hyperparameters: "{}",
			});
			await fetchData();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Training failed");
		} finally {
			setIsTraining(false);
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

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

							<div className="grid gap-4 py-4">
								<div className="space-y-2">
									<Label>
										Dataset <span className="text-destructive">*</span>
									</Label>
									<Select
										value={trainForm.dataset_id}
										onValueChange={(v) =>
											setTrainForm((f) => ({ ...f, dataset_id: v }))
										}
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
										value={trainForm.model_algorithm}
										onValueChange={(v) =>
											setTrainForm((f) => ({ ...f, model_algorithm: v }))
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select an algorithm..." />
										</SelectTrigger>
										<SelectContent>
											{ALGORITHMS.map((a) => (
												<SelectItem key={a.value} value={a.value}>
													{a.label}
												</SelectItem>
											))}
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
										value={trainForm.target_column}
										onChange={(e) =>
											setTrainForm((f) => ({
												...f,
												target_column: e.target.value,
											}))
										}
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
										placeholder="e.g. col1, col2, col3 — or leave blank for all"
										value={trainForm.features}
										onChange={(e) =>
											setTrainForm((f) => ({ ...f, features: e.target.value }))
										}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="hyperparams">
										Hyperparameters{" "}
										<span className="text-muted-foreground text-xs">
											(JSON)
										</span>
									</Label>
									<Input
										id="hyperparams"
										placeholder='e.g. {"n_estimators": 100, "max_depth": 5}'
										value={trainForm.hyperparameters}
										onChange={(e) =>
											setTrainForm((f) => ({
												...f,
												hyperparameters: e.target.value,
											}))
										}
									/>
								</div>
							</div>

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
										<DropdownMenuItem className="gap-2">
											<FlaskConical className="w-4 h-4" /> Retrain
										</DropdownMenuItem>
										<DropdownMenuItem className="gap-2">
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
							<CardFooter className="border-t pt-3">
								<p
									className="text-xs text-muted-foreground truncate"
									title={model.description}
								>
									{model.description || "No description"}
								</p>
							</CardFooter>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
