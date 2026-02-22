import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useTheme } from "@/components/theme-provider";
import { api } from "@/lib/api";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	User,
	Server,
	Info,
	Shield,
	Sun,
	Moon,
	Monitor,
	LogOut,
	RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type HealthData = { status: string; version: string } | null;

export function SettingsPage() {
	const user = useAuthStore((s) => s.user);
	const clearAuth = useAuthStore((s) => s.clearAuth);
	const { theme, setTheme } = useTheme();

	const [health, setHealth] = useState<HealthData>(null);
	const [healthLoading, setHealthLoading] = useState(true);

	const checkHealth = async () => {
		setHealthLoading(true);
		try {
			const res = await api.get("/health");
			setHealth(res.data);
		} catch {
			setHealth(null);
		} finally {
			setHealthLoading(false);
		}
	};

	useEffect(() => {
		checkHealth();
	}, []);

	const handleLogout = async () => {
		try {
			await api.post("/auth/logout");
		} catch {
			// ignore — clear client state regardless
		}
		clearAuth();
		toast.success("Logged out");
		window.location.href = "/auth";
	};

	const isOnline = health?.status === "healthy";

	// API base: in production client is same-origin, in dev it's proxied
	const apiBase =
		window.location.port === "5173" || window.location.port === "5174"
			? `${window.location.protocol}//${window.location.hostname}:8000`
			: window.location.origin;

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
			<div>
				<h2 className="text-3xl font-bold tracking-tight">Settings</h2>
				<p className="text-muted-foreground mt-1">
					Platform configuration and account information.
				</p>
			</div>

			{/* ── Account ─────────────────────────────────────────────── */}
			<Card className="border-border/60">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<User className="w-4 h-4 text-primary" />
						<CardTitle className="text-sm">Account</CardTitle>
					</div>
					<CardDescription className="text-xs">
						Your profile information.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{[
						{ label: "Username", value: user?.username },
						{ label: "Email", value: user?.email },
					].map(({ label, value }) => (
						<div
							key={label}
							className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
						>
							<span className="text-sm text-muted-foreground">{label}</span>
							<span className="text-sm font-medium">{value ?? "—"}</span>
						</div>
					))}
					<Separator className="my-1" />
					<Button
						variant="outline"
						size="sm"
						className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
						onClick={handleLogout}
					>
						<LogOut className="w-3.5 h-3.5" />
						Sign out
					</Button>
				</CardContent>
			</Card>

			{/* ── Appearance ──────────────────────────────────────────── */}
			<Card className="border-border/60">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<Sun className="w-4 h-4 text-primary" />
						<CardTitle className="text-sm">Appearance</CardTitle>
					</div>
					<CardDescription className="text-xs">
						Choose your preferred colour scheme.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-3 gap-2">
						{(
							[
								{ value: "light", label: "Light", icon: Sun },
								{ value: "dark", label: "Dark", icon: Moon },
								{ value: "system", label: "System", icon: Monitor },
							] as const
						).map(({ value, label, icon: Icon }) => (
							<button
								key={value}
								type="button"
								onClick={() => setTheme(value)}
								className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors ${
									theme === value
										? "border-primary bg-primary/10 text-primary"
										: "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/40"
								}`}
							>
								<Icon className="w-4 h-4" />
								{label}
							</button>
						))}
					</div>
				</CardContent>
			</Card>

			{/* ── Server connection ────────────────────────────────────── */}
			<Card className="border-border/60">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Server className="w-4 h-4 text-primary" />
							<CardTitle className="text-sm">Server</CardTitle>
						</div>
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							onClick={checkHealth}
							disabled={healthLoading}
						>
							<RefreshCw
								className={`w-3.5 h-3.5 ${healthLoading ? "animate-spin" : ""}`}
							/>
						</Button>
					</div>
					<CardDescription className="text-xs">
						Backend API connection details.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{[
						{ label: "API URL", value: apiBase },
						{ label: "API Prefix", value: "/api" },
						{
							label: "Version",
							value: healthLoading ? (
								<span className="text-xs text-muted-foreground">checking…</span>
							) : health?.version ? (
								<code className="text-xs font-mono text-primary/80 bg-primary/10 px-2 py-0.5 rounded">
									v{health.version}
								</code>
							) : (
								"—"
							),
						},
						{
							label: "Status",
							value: healthLoading ? (
								<span className="text-xs text-muted-foreground">checking…</span>
							) : isOnline ? (
								<Badge
									variant="outline"
									className="text-xs gap-1 text-emerald-400 border-emerald-500/40"
								>
									<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
									Online
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="text-xs gap-1 text-red-400 border-red-500/40"
								>
									<span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
									Offline
								</Badge>
							),
						},
					].map(({ label, value }) => (
						<div
							key={label}
							className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
						>
							<span className="text-sm text-muted-foreground">{label}</span>
							<span className="text-sm font-medium">{value}</span>
						</div>
					))}
				</CardContent>
			</Card>

			{/* ── Storage ──────────────────────────────────────────────── */}
			<Card className="border-border/60">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<Info className="w-4 h-4 text-primary" />
						<CardTitle className="text-sm">Storage Layout</CardTitle>
					</div>
					<CardDescription className="text-xs">
						Where files are stored on the server.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2">
					{[
						{ path: "uploads/datasets/", desc: "Uploaded CSV / Excel files" },
						{ path: "uploads/models/", desc: "Trained .joblib model files" },
						{ path: "static/", desc: "Built client (production only)" },
					].map(({ path, desc }) => (
						<div
							key={path}
							className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
						>
							<code className="text-xs font-mono text-primary/80 bg-primary/10 px-2 py-0.5 rounded">
								{path}
							</code>
							<span className="text-xs text-muted-foreground">{desc}</span>
						</div>
					))}
				</CardContent>
			</Card>

			{/* ── About ────────────────────────────────────────────────── */}
			<Card className="border-border/60">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<Shield className="w-4 h-4 text-primary" />
						<CardTitle className="text-sm">About ML Core</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="space-y-3">
					{[
						{
							label: "Version",
							value: health?.version ? `v${health.version}` : "—",
						},
						{ label: "Backend", value: "FastAPI + SQLite + SQLAlchemy" },
						{ label: "Frontend", value: "React 19 + Vite + Tailwind + shadcn" },
						{ label: "ML Engine", value: "scikit-learn + joblib" },
						{ label: "Container", value: "Docker (single image)" },
					].map(({ label, value }) => (
						<div
							key={label}
							className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
						>
							<span className="text-sm text-muted-foreground">{label}</span>
							<span className="text-sm font-medium">{value}</span>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
