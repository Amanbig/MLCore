import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Database,
  Library,
  Settings,
  Menu,
  LogOut,
  LayoutDashboard,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
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

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="space-y-0.5">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            className={`group flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm ${
              isActive
                ? "bg-primary/15 text-primary font-medium border border-primary/20"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <item.icon
              className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-primary" : "group-hover:text-foreground"}`}
            />
            <span>{item.name}</span>
            {isActive && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border/60 bg-card/40 backdrop-blur-sm px-3 py-5 shrink-0 sticky top-0 h-screen">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-6 px-1">
          <div className="bg-primary/20 border border-primary/30 p-1.5 rounded-lg">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight leading-none">
              ML Core
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              ML Platform
            </p>
          </div>
        </div>

        {/* Nav */}
        <NavLinks />

        {/* Bottom */}
        <div className="mt-auto pt-4 border-t border-border/60 space-y-1">
          <div className="px-3 py-2 rounded-md bg-muted/30 mb-2">
            <p className="text-xs font-medium truncate">{user?.username}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-3 h-8"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile + breadcrumb) */}
        <header className="flex h-12 items-center border-b border-border/60 bg-card/30 backdrop-blur-sm px-4 justify-between shrink-0">
          {/* Mobile toggle */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-56 p-0 pt-5 px-3">
              <div className="flex items-center gap-2.5 mb-6 px-1">
                <div className="bg-primary/20 border border-primary/30 p-1.5 rounded-lg">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-tight leading-none">
                    ML Core
                  </h1>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    ML Platform
                  </p>
                </div>
              </div>
              <NavLinks onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Page title from route */}
          <div className="flex items-center gap-2 md:ml-0">
            <span className="text-sm text-muted-foreground hidden md:block">
              {navItems.find((n) => location.pathname.startsWith(n.href))
                ?.name ?? "ML Core"}
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] font-mono hidden sm:flex gap-1 h-5 px-1.5 border-emerald-500/40 text-emerald-400"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              live
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user?.username}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
