import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	AreaChart,
	Area,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
} from "recharts";
import {
	Database,
	Library,
	TrendingUp,
	HardDrive,
	Activity,
	Cpu,
	Clock,
	ArrowUpRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface Stats {
	summary: {
		total_datasets: number;
		total_models: number;
		avg_accuracy: number;
		best_accuracy: number;
		worst_accuracy: number;
		total_storage_bytes: number;
	};
	model_type_distribution: { type: string; count: number }[];
	models_over_time: { date: string; models: number; avg_accuracy: number }[];
	datasets_over_time: { date: string; datasets: number }[];
	recent_models: {
		id: string;
		name: string;
		model_type: string;
		accuracy: number;
		version: string;
		created_at: string;
	}[];
	recent_datasets: {
		id: string;
		name: string;
		rows: number;
		columns: number;
		version: string;
		created_at: string;
	}[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const PIE_COLORS = [
	"var(--color-chart-1)",
	"var(--color-chart-2)",
	"var(--color-chart-3)",
	"var(--color-chart-4)",
	"var(--color-chart-5)",
];

// ── Metric Card ────────────────────────────────────────────────────────────
function MetricCard({
	icon: Icon,
	label,
	value,
	sub,
	color = "text-primary",
	loading,
}: {
	icon: React.ElementType;
	label: string;
	value: string | number;
	sub?: string;
	color?: string;
	loading?: boolean;
}) {
	return (
		<Card className="relative overflow-hidden border-border/60">
			<CardContent className="p-5">
				<div className="flex items-start justify-between">
					<div className="space-y-1 min-w-0">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
						{loading ? (
							<Skeleton className="h-8 w-24" />
						) : (
							<p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
						)}
						{sub && !loading && (
							<p className="text-xs text-muted-foreground">{sub}</p>
						)}
					</div>
					<div className={`p-2 rounded-lg bg-primary/10`}>
						<Icon className={`w-5 h-5 ${color}`} />
					</div>
				</div>
			</CardContent>
			{/* subtle bottom gradient accent */}
			<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
		</Card>
	);
}

// ── Custom tooltip ─────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
	if (!active || !payload?.length) return null;
	return (
		<div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
			<p className="font-semibold text-muted-foreground mb-1">{label}</p>
			{payload.map((p: any) => (
				<div key={p.name} className="flex items-center gap-2">
					<div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
					<span className="text-muted-foreground">{p.name}:</span>
					<span className="font-semibold">{p.value}{p.name === "Avg Accuracy" ? "%" : ""}</span>
				</div>
			))}
		</div>
	);
}

// ── Main ───────────────────────────────────────────────────────────────────
export function DashboardPage() {
	const user = useAuthStore((s) => s.user);
	const [stats, setStats] = useState<Stats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api.get("/stats")
			.then((r) => setStats(r.data))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	const s = stats?.summary;

	// Combine over-time data
	const timelineData = (() => {
		if (!stats) return [];
		const map: Record<string, any> = {};
		stats.models_over_time.forEach((d) => {
			map[d.date] = { ...map[d.date], date: d.date, models: d.models, avg_accuracy: d.avg_accuracy };
		});
		stats.datasets_over_time.forEach((d) => {
			map[d.date] = { ...map[d.date], date: d.date, datasets: d.datasets };
		});
		return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
	})();

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			{/* Header */}
			<div>
				<h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
				<p className="text-muted-foreground mt-1">
					Welcome back, <span className="font-medium text-foreground">{user?.username}</span> — here's your ML platform overview.
				</p>
			</div>

			{/* KPI cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<MetricCard icon={Database} label="Datasets" value={s?.total_datasets ?? 0} sub="total uploaded" loading={loading} color="text-blue-400" />
				<MetricCard icon={Library} label="Models" value={s?.total_models ?? 0} sub="trained & stored" loading={loading} color="text-violet-400" />
				<MetricCard
					icon={TrendingUp}
					label="Avg Accuracy"
					value={s ? `${s.avg_accuracy}%` : "—"}
					sub={s ? `Best: ${s.best_accuracy}%` : undefined}
					loading={loading}
					color="text-emerald-400"
				/>
				<MetricCard
					icon={HardDrive}
					label="Storage Used"
					value={s ? formatBytes(s.total_storage_bytes) : "—"}
					sub="across all files"
					loading={loading}
					color="text-amber-400"
				/>
			</div>

			{/* Charts row 1 */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				{/* Activity timeline */}
				<Card className="lg:col-span-2 border-border/60">
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-sm font-semibold">Activity Timeline</CardTitle>
								<CardDescription className="text-xs">Models trained & datasets added over time</CardDescription>
							</div>
							<Activity className="w-4 h-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-48 w-full" />
						) : timelineData.length === 0 ? (
							<div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
								No data yet — train a model or upload a dataset
							</div>
						) : (
							<ResponsiveContainer width="100%" height={180}>
								<AreaChart data={timelineData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
									<defs>
										<linearGradient id="gradModels" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
											<stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
										</linearGradient>
										<linearGradient id="gradDatasets" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
											<stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
									<XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
									<YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
									<Tooltip content={<ChartTooltip />} />
									<Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
									<Area type="monotone" dataKey="models" name="Models" stroke="var(--color-chart-1)" fill="url(#gradModels)" strokeWidth={2} dot={false} />
									<Area type="monotone" dataKey="datasets" name="Datasets" stroke="var(--color-chart-2)" fill="url(#gradDatasets)" strokeWidth={2} dot={false} />
								</AreaChart>
							</ResponsiveContainer>
						)}
					</CardContent>
				</Card>

				{/* Model type distribution */}
				<Card className="border-border/60">
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-sm font-semibold">Model Types</CardTitle>
								<CardDescription className="text-xs">Distribution by algorithm</CardDescription>
							</div>
							<Cpu className="w-4 h-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-48 w-full" />
						) : !stats?.model_type_distribution.length ? (
							<div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
								No models yet
							</div>
						) : (
							<>
								<ResponsiveContainer width="100%" height={140}>
									<PieChart>
										<Pie
											data={stats.model_type_distribution}
											dataKey="count"
											nameKey="type"
											cx="50%"
											cy="50%"
											outerRadius={55}
											innerRadius={30}
											paddingAngle={3}
										>
											{stats.model_type_distribution.map((_, i) => (
												<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
											))}
										</Pie>
										<Tooltip content={<ChartTooltip />} />
									</PieChart>
								</ResponsiveContainer>
								<div className="space-y-1 mt-1">
									{stats.model_type_distribution.map((d, i) => (
										<div key={d.type} className="flex items-center justify-between text-xs">
											<div className="flex items-center gap-1.5">
												<div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
												<span className="text-muted-foreground truncate max-w-[110px]">{d.type.replace(/_/g, " ")}</span>
											</div>
											<span className="font-medium">{d.count}</span>
										</div>
									))}
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Charts row 2 */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Accuracy over time */}
				<Card className="border-border/60">
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-sm font-semibold">Model Accuracy Trend</CardTitle>
								<CardDescription className="text-xs">Average accuracy per training session</CardDescription>
							</div>
							<TrendingUp className="w-4 h-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-44 w-full" />
						) : stats?.models_over_time.length === 0 ? (
							<div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
						) : (
							<ResponsiveContainer width="100%" height={160}>
								<BarChart data={stats?.models_over_time} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
									<XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
									<YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} unit="%" />
									<Tooltip content={<ChartTooltip />} />
									<Bar dataKey="avg_accuracy" name="Avg Accuracy" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
								</BarChart>
							</ResponsiveContainer>
						)}
					</CardContent>
				</Card>

				{/* Recent models table */}
				<Card className="border-border/60">
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-sm font-semibold">Recent Models</CardTitle>
								<CardDescription className="text-xs">Last 10 trained models</CardDescription>
							</div>
							<Clock className="w-4 h-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent className="p-0">
						{loading ? (
							<div className="p-4 space-y-2">
								{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
							</div>
						) : !stats?.recent_models.length ? (
							<div className="h-44 flex items-center justify-center text-sm text-muted-foreground px-4">
								No models trained yet
							</div>
						) : (
							<div className="divide-y divide-border/50">
								{stats.recent_models.map((m) => (
									<div key={m.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
										<div className="min-w-0">
											<p className="text-sm font-medium truncate">{m.name}</p>
											<p className="text-xs text-muted-foreground">{m.model_type?.replace(/_/g, " ")}</p>
										</div>
										<div className="flex items-center gap-2 shrink-0 ml-2">
											<span className={`text-sm font-bold ${m.accuracy >= 80 ? "text-emerald-400" : m.accuracy >= 60 ? "text-amber-400" : "text-red-400"}`}>
												{m.accuracy}%
											</span>
											<Badge variant="secondary" className="text-xs font-mono hidden sm:flex">v{m.version}</Badge>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Recent datasets */}
			<Card className="border-border/60">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-sm font-semibold">Recent Datasets</CardTitle>
							<CardDescription className="text-xs">Last 5 uploaded datasets</CardDescription>
						</div>
						<ArrowUpRight className="w-4 h-4 text-muted-foreground" />
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{loading ? (
						<div className="p-4 space-y-2">
							{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
						</div>
					) : !stats?.recent_datasets.length ? (
						<div className="px-4 py-6 text-sm text-muted-foreground text-center">No datasets uploaded yet</div>
					) : (
						<div className="divide-y divide-border/50">
							{stats.recent_datasets.map((d) => (
								<div key={d.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
									<div className="min-w-0">
										<p className="text-sm font-medium truncate">{d.name}</p>
										<p className="text-xs text-muted-foreground">{d.rows.toLocaleString()} rows · {d.columns} cols</p>
									</div>
									<Badge variant="secondary" className="text-xs font-mono shrink-0 ml-2">v{d.version}</Badge>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
