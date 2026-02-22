import { useAuthStore } from "@/store/auth";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Server, Info, Shield } from "lucide-react";

export function SettingsPage() {
	const user = useAuthStore((s) => s.user);

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
			<div>
				<h2 className="text-3xl font-bold tracking-tight">Settings</h2>
				<p className="text-muted-foreground mt-1">
					Platform configuration and account information.
				</p>
			</div>

			{/* Account */}
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
				</CardContent>
			</Card>

			{/* Server connection */}
			<Card className="border-border/60">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<Server className="w-4 h-4 text-primary" />
						<CardTitle className="text-sm">Server</CardTitle>
					</div>
					<CardDescription className="text-xs">
						Backend API connection details.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{[
						{ label: "API URL", value: "http://127.0.0.1:8000" },
						{ label: "Proxy", value: "/api (via Vite)" },
						{
							label: "Status",
							value: (
								<Badge
									variant="outline"
									className="text-xs gap-1 text-emerald-400 border-emerald-500/40"
								>
									<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />{" "}
									Connected
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

			{/* Storage */}
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

			{/* About */}
			<Card className="border-border/60">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<Shield className="w-4 h-4 text-primary" />
						<CardTitle className="text-sm">About ML Core</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="space-y-3">
					{[
						{ label: "Version", value: "1.0.0" },
						{ label: "Backend", value: "FastAPI + SQLite + SQLAlchemy" },
						{ label: "Frontend", value: "React + Vite + Tailwind + shadcn" },
						{ label: "ML Engine", value: "scikit-learn + joblib" },
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
