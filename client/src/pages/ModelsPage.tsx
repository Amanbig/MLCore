import { useState, useEffect, useCallback } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Info,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────
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

interface HyperparamDef {
  name: string;
  type: "int" | "float" | "bool" | "select" | "str";
  default: string | number | boolean | null;
  description: string;
  min?: number;
  max?: number;
  options?: string[];
  nullable?: boolean;
}

// ── Algorithm lists ────────────────────────────────────────────────────────
const CLASSIFIER_ALGOS = [
  { value: "random_forest_classifier", label: "Random Forest Classifier" },
  { value: "logistic_regression", label: "Logistic Regression" },
  { value: "svm", label: "Support Vector Machine (SVC)" },
  { value: "decision_tree", label: "Decision Tree Classifier" },
  { value: "gradient_boosting", label: "Gradient Boosting Classifier" },
  { value: "knn", label: "K-Nearest Neighbors" },
  { value: "naive_bayes", label: "Naive Bayes (Gaussian)" },
];

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
};

// ── HyperparamField: renders one param ────────────────────────────────────
function HyperparamField({
  def: d,
  value,
  onChange,
}: {
  def: HyperparamDef;
  value: any;
  onChange: (v: any) => void;
}) {
  const displayVal = value === undefined ? d.default : value;

  const label = (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-medium font-mono">{d.name}</span>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[220px] text-xs">
            {d.description}
            {d.min !== undefined && d.max !== undefined && (
              <span className="block text-muted-foreground mt-1">
                Range: {d.min} – {d.max}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  if (d.type === "bool") {
    return (
      <div className="flex items-center justify-between py-1">
        {label}
        <Switch checked={displayVal ?? false} onCheckedChange={onChange} />
      </div>
    );
  }

  if (d.type === "select") {
    return (
      <div className="space-y-1">
        {label}
        <Select
          value={String(displayVal ?? d.options?.[0] ?? "")}
          onValueChange={(v) => onChange(v === "None" ? null : v)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {d.options?.map((o) => (
              <SelectItem key={o} value={o} className="text-sm">
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (d.type === "int" || d.type === "float") {
    return (
      <div className="space-y-1">
        {label}
        <Input
          type="number"
          className="h-8 text-sm"
          step={d.type === "float" ? "any" : "1"}
          min={d.min}
          max={d.max}
          value={displayVal ?? ""}
          placeholder={
            d.nullable ? "leave blank = None" : String(d.default ?? "")
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") {
              onChange(null);
              return;
            }
            onChange(d.type === "float" ? parseFloat(v) : parseInt(v, 10));
          }}
        />
      </div>
    );
  }

  // str fallback
  return (
    <div className="space-y-1">
      {label}
      <Input
        className="h-8 text-sm"
        value={displayVal ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export function ModelsPage() {
  const [models, setModels] = useState<MLModel[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Train dialog
  const [isTrainOpen, setIsTrainOpen] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainForm, setTrainForm] = useState(EMPTY_FORM);
  const [trainHyperparams, setTrainHyperparams] = useState<Record<string, any>>(
    {},
  );
  const [trainSchemas, setTrainSchemas] = useState<HyperparamDef[]>([]);
  const [isLoadingTrainSchemas, setIsLoadingTrainSchemas] = useState(false);

  // Retrain dialog
  const [retrainModel, setRetrainModel] = useState<MLModel | null>(null);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainForm, setRetrainForm] = useState(EMPTY_FORM);
  const [retrainHyperparams, setRetrainHyperparams] = useState<
    Record<string, any>
  >({});
  const [retrainSchemas, setRetrainSchemas] = useState<HyperparamDef[]>([]);
  const [isLoadingRetrainSchemas, setIsLoadingRetrainSchemas] = useState(false);

  // Lineage sheet
  const [lineageModel, setLineageModel] = useState<MLModel | null>(null);
  const [lineageVersions, setLineageVersions] = useState<MLModel[]>([]);
  const [isLoadingLineage, setIsLoadingLineage] = useState(false);

  // Delete confirm
  const [deleteModel, setDeleteModel] = useState<MLModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── fetch helpers ────────────────────────────────────────────────────
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
      if (error.response?.status !== 401) toast.error("Failed to load models");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchSchemas = useCallback(
    async (
      algorithm: string,
      setSchemas: (s: HyperparamDef[]) => void,
      setHyperparams: (h: Record<string, any>) => void,
      setLoading: (v: boolean) => void,
    ) => {
      if (!algorithm) {
        setSchemas([]);
        return;
      }
      try {
        setLoading(true);
        const res = await api.get(`/ml_model/hyperparameters/${algorithm}`);
        const schemas: HyperparamDef[] = res.data.hyperparameters || [];
        setSchemas(schemas);
        // Pre-fill defaults
        const defaults: Record<string, any> = {};
        schemas.forEach((s) => {
          defaults[s.name] = s.default;
        });
        setHyperparams(defaults);
      } catch {
        setSchemas([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Watch algorithm changes for train
  useEffect(() => {
    fetchSchemas(
      trainForm.model_algorithm,
      setTrainSchemas,
      setTrainHyperparams,
      setIsLoadingTrainSchemas,
    );
  }, [trainForm.model_algorithm]);

  // Watch algorithm changes for retrain
  useEffect(() => {
    fetchSchemas(
      retrainForm.model_algorithm,
      setRetrainSchemas,
      setRetrainHyperparams,
      setIsLoadingRetrainSchemas,
    );
  }, [retrainForm.model_algorithm]);

  // ── payload builder ──────────────────────────────────────────────────
  const buildPayload = (
    form: typeof EMPTY_FORM,
    hyperparams: Record<string, any>,
  ) => {
    // Strip null values for cleaner payload (sklearn ignores None = use default)
    const cleanParams: Record<string, any> = {};
    Object.entries(hyperparams).forEach(([k, v]) => {
      if (v !== null && v !== undefined) cleanParams[k] = v;
    });
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
      hyperparameters: cleanParams,
    };
  };

  // ── handlers ─────────────────────────────────────────────────────────
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
      await api.post(
        "/ml_model/train",
        buildPayload(trainForm, trainHyperparams),
      );
      toast.success("Model trained successfully!");
      setIsTrainOpen(false);
      setTrainForm(EMPTY_FORM);
      setTrainHyperparams({});
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
        buildPayload(retrainForm, retrainHyperparams),
      );
      toast.success("Model retrained — new version created!");
      setRetrainModel(null);
      setRetrainForm(EMPTY_FORM);
      setRetrainHyperparams({});
      await fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Retrain failed");
    } finally {
      setIsRetraining(false);
    }
  };

  const openRetrain = (model: MLModel) => {
    setRetrainModel(model);
    setRetrainForm({ ...EMPTY_FORM, model_algorithm: model.model_type });
    setRetrainHyperparams({});
  };

  const openLineage = async (model: MLModel) => {
    setLineageModel(model);
    setLineageVersions([]);
    try {
      setIsLoadingLineage(true);
      const res = await api.get(`/ml_model/${model.id}/versions`);
      setLineageVersions(res.data || []);
    } catch {
      toast.error("Failed to load version history");
    } finally {
      setIsLoadingLineage(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModel) return;
    try {
      setIsDeleting(true);
      await api.delete(`/ml_model/${deleteModel.id}`);
      toast.success(`"${deleteModel.name}" deleted`);
      setModels((prev) => prev.filter((m) => m.id !== deleteModel.id));
      setDeleteModel(null);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Reusable form ─────────────────────────────────────────────────────
  const TrainFormFields = ({
    form,
    setForm,
    schemas,
    hyperparams,
    setHyperparams,
    isLoadingSchemas,
  }: {
    form: typeof EMPTY_FORM;
    setForm: (f: typeof EMPTY_FORM) => void;
    schemas: HyperparamDef[];
    hyperparams: Record<string, any>;
    setHyperparams: (h: Record<string, any>) => void;
    isLoadingSchemas: boolean;
  }) => (
    <div className="grid gap-4 py-2">
      {/* Dataset */}
      <div className="space-y-1.5">
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

      {/* Algorithm */}
      <div className="space-y-1.5">
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

      {/* Target column */}
      <div className="space-y-1.5">
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

      {/* Features */}
      <div className="space-y-1.5">
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

      {/* Hyperparameters */}
      {form.model_algorithm && (
        <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Hyperparameters</Label>
            {isLoadingSchemas && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
          {!isLoadingSchemas && schemas.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No configurable hyperparameters.
            </p>
          )}
          {!isLoadingSchemas && schemas.length > 0 && (
            <ScrollArea className="max-h-52 pr-2">
              <div className="space-y-3">
                {schemas.map((s) => (
                  <HyperparamField
                    key={s.name}
                    def={s}
                    value={hyperparams[s.name]}
                    onChange={(v) =>
                      setHyperparams({ ...hyperparams, [s.name]: v })
                    }
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────
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
            <DialogContent className="sm:max-w-[520px] !grid-none flex flex-col max-h-[85vh] p-0 overflow-hidden">
              <DialogHeader className="shrink-0 p-6 pb-3">
                <DialogTitle>Train a New Model</DialogTitle>
                <DialogDescription>
                  Select a dataset, algorithm, and tune hyperparameters.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6">
                <TrainFormFields
                  form={trainForm}
                  setForm={setTrainForm}
                  schemas={trainSchemas}
                  hyperparams={trainHyperparams}
                  setHyperparams={setTrainHyperparams}
                  isLoadingSchemas={isLoadingTrainSchemas}
                />
              </div>
              <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-4 mt-0">
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
                      onClick={() => setDeleteModel(model)}
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mt-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Accuracy</span>
                    <span
                      className={`font-bold text-sm ${
                        model.accuracy >= 0.9
                          ? "text-emerald-400"
                          : model.accuracy >= 0.7
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}
                    >
                      {(model.accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={model.accuracy * 100}
                    className={`h-1.5 ${
                      model.accuracy >= 0.9
                        ? "[&>div]:bg-emerald-400"
                        : model.accuracy >= 0.7
                          ? "[&>div]:bg-amber-400"
                          : "[&>div]:bg-red-400"
                    }`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>
                      Error:{" "}
                      <span className="text-foreground font-medium">
                        {(model.error * 100).toFixed(1)}%
                      </span>
                    </span>
                    {model.created_at && (
                      <span>
                        {new Date(model.created_at).toLocaleDateString()}
                      </span>
                    )}
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

      {/* ── Delete Confirmation Dialog ─────────────────────────── */}
      <Dialog
        open={!!deleteModel}
        onOpenChange={(o) => !o && setDeleteModel(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" /> Delete Model
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deleteModel?.name}
              </span>
              ? This will permanently remove the model and its saved file.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModel(null)}
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

      {/* ── Retrain Dialog ─────────────────────────────────────── */}
      <Dialog
        open={!!retrainModel}
        onOpenChange={(o) => !o && setRetrainModel(null)}
      >
        <DialogContent className="sm:max-w-[520px] flex flex-col max-h-[85vh]">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5" /> Retrain —{" "}
              {retrainModel?.name}
            </DialogTitle>
            <DialogDescription>
              Creates a new version. Current: v{retrainModel?.version}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1 -mr-1">
            <TrainFormFields
              form={retrainForm}
              setForm={setRetrainForm}
              schemas={retrainSchemas}
              hyperparams={retrainHyperparams}
              setHyperparams={setRetrainHyperparams}
              isLoadingSchemas={isLoadingRetrainSchemas}
            />
          </div>
          <DialogFooter className="shrink-0 border-t border-border/60 pt-3 mt-2">
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

      {/* ── Lineage Sheet ──────────────────────────────────────── */}
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
