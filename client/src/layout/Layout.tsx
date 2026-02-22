import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Database, Library, Settings, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";

const navItems = [
	{ name: "Datasets", href: "/datasets", icon: Database },
	{ name: "Models", href: "/models", icon: Library },
	{ name: "Settings", href: "/settings", icon: Settings },
];

export function Layout() {
	const location = useLocation();
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const { user, clearAuth } = useAuthStore();

	const handleLogout = async () => {
		try {
			await api.post("/auth/logout");
		} finally {
			clearAuth();
			navigate("/auth");
			toast.success("Logged out");
		}
	};

	const NavLinks = () => (
		<nav className="space-y-2">
			{navItems.map((item) => {
				const isActive = location.pathname.startsWith(item.href);
				return (
					<Link
						key={item.href}
						to={item.href}
						onClick={() => setOpen(false)}
						className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
							isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
						}`}
					>
						<item.icon className="w-5 h-5" />
						<span className="font-medium">{item.name}</span>
					</Link>
				);
			})}
		</nav>
	);

	return (
		<div className="flex min-h-screen w-full bg-background relative overflow-hidden">
			{/* Desktop Sidebar */}
			<aside className="hidden md:flex w-64 flex-col border-r bg-card/50 px-4 py-6 z-10 shrink-0">
				<div className="flex items-center gap-2 mb-8 px-2">
					<div className="bg-primary p-1.5 rounded-md">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="w-5 h-5 text-primary-foreground"
						>
							<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
						</svg>
					</div>
					<h1 className="text-xl font-bold tracking-tight">ML Core</h1>
				</div>
				<NavLinks />
				<div className="mt-auto pt-4 border-t">
					<div className="px-2 py-2 mb-2">
						<p className="text-xs text-muted-foreground">Logged in as</p>
						<p className="text-sm font-semibold truncate">{user?.username}</p>
						<p className="text-xs text-muted-foreground truncate">
							{user?.email}
						</p>
					</div>
					<Button
						variant="ghost"
						className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive px-3"
						onClick={handleLogout}
					>
						<LogOut className="w-5 h-5" />
						<span className="font-medium">Logout</span>
					</Button>
				</div>
			</aside>

			{/* Main Content Area */}
			<div className="flex flex-1 flex-col z-10 overflow-hidden min-w-0">
				<header className="flex h-16 items-center border-b bg-card/50 px-4 md:px-6 justify-between md:justify-end shrink-0">
					{/* Mobile Menu */}
					<Sheet open={open} onOpenChange={setOpen}>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon" className="md:hidden">
								<Menu className="w-6 h-6" />
								<span className="sr-only">Toggle navigation menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-64 sm:w-72">
							<div className="flex items-center gap-2 mb-8 mt-4">
								<div className="bg-primary p-1.5 rounded-md">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="w-5 h-5 text-primary-foreground"
									>
										<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
									</svg>
								</div>
								<h1 className="text-xl font-bold tracking-tight">ML Core</h1>
							</div>
							<NavLinks />
						</SheetContent>
					</Sheet>

					<div className="flex items-center gap-3">
						<span className="text-sm font-medium text-muted-foreground hidden sm:block">
							{user?.username}
						</span>
						<Button
							variant="ghost"
							size="icon"
							className="text-muted-foreground hover:text-destructive"
							onClick={handleLogout}
						>
							<LogOut className="w-5 h-5" />
						</Button>
					</div>
				</header>

				<main className="flex-1 overflow-auto p-4 md:p-8 relative">
					{/* Background decorative gradients */}
					<div className="absolute top-0 left-0 right-0 h-[500px] w-full max-w-7xl mx-auto rounded-full bg-primary/5 blur-[120px] -z-10 pointer-events-none" />
					<div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] -z-10 pointer-events-none" />
					<Outlet />
				</main>
			</div>
		</div>
	);
}
