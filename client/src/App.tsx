import "./App.css";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./layout/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { DatasetsPage } from "./pages/DatasetsPage";
import { ModelsPage } from "./pages/ModelsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AuthPage } from "./pages/AuthPage";
import { useAuthStore } from "./store/auth";

function App({ children }: { children?: React.ReactNode }) {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	return (
		<BrowserRouter>
			<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
				{children}
				<Routes>
					{!isAuthenticated ? (
						<>
							<Route path="/auth" element={<AuthPage />} />
							<Route path="*" element={<Navigate to="/auth" replace />} />
						</>
					) : (
						<Route path="/" element={<Layout />}>
							<Route index element={<Navigate to="/dashboard" replace />} />
							<Route path="dashboard" element={<DashboardPage />} />
							<Route path="datasets" element={<DatasetsPage />} />
							<Route path="models" element={<ModelsPage />} />
							<Route path="settings" element={<SettingsPage />} />
							<Route path="*" element={<Navigate to="/dashboard" replace />} />
						</Route>
					)}
				</Routes>
				<Toaster />
			</ThemeProvider>
		</BrowserRouter>
	);
}

export default App;
