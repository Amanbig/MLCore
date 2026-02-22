import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Activity, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

/** Safely extract a human-readable string from any FastAPI error response. */
function getErrorMessage(error: any, fallback: string): string {
  const detail = error?.response?.data?.detail;
  if (!detail) return fallback;
  if (Array.isArray(detail)) {
    return detail.map((d: any) => d?.msg ?? String(d)).join(", ");
  }
  if (typeof detail === "string") return detail;
  return fallback;
}

// ── Validation rules ──────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s\-()]{7,15}$/;

function validateEmail(v: string) {
  if (!v) return "Email is required";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address";
  return "";
}
function validatePhone(v: string) {
  if (!v) return "Phone is required";
  if (!PHONE_RE.test(v)) return "Enter a valid phone number (7–15 digits)";
  return "";
}
function validatePassword(v: string, isSignup = false) {
  if (!v) return "Password is required";
  if (isSignup) {
    if (v.length < 8) return "At least 8 characters";
    if (!/[A-Z]/.test(v)) return "At least one uppercase letter";
    if (!/[0-9]/.test(v)) return "At least one number";
  }
  return "";
}
function validateUsername(v: string) {
  if (!v) return "Username is required";
  if (v.length < 3) return "At least 3 characters";
  if (!/^[a-zA-Z0-9_]+$/.test(v))
    return "Letters, numbers and underscores only";
  return "";
}

// ── Password strength indicator ───────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
    { label: "Special char", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const bar =
    ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"][
      score - 1
    ] ?? "bg-muted";
  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex gap-1 h-1">
        {checks.map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors ${i < score ? bar : "bg-muted"}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {checks.map((c) => (
          <span
            key={c.label}
            className={`flex items-center gap-1 text-xs ${c.ok ? "text-emerald-500" : "text-muted-foreground"}`}
          >
            {c.ok ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Field error helper ────────────────────────────────────────────────────
function FieldError({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

export function AuthPage() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState({ email: "", password: "" });

  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [signupErrors, setSignupErrors] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });

  // ── Login ───────────────────────────────────────────────────────────
  const validateLogin = () => {
    const errs = {
      email: validateEmail(loginData.email),
      password: validatePassword(loginData.password),
    };
    setLoginErrors(errs);
    return !errs.email && !errs.password;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    try {
      setIsLoading(true);
      const res = await api.post("/auth/login", loginData);
      setAuth({
        username: res.data.username,
        email: res.data.email,
        phone: res.data.phone,
      });
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Login failed"));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Signup ──────────────────────────────────────────────────────────
  const validateSignup = () => {
    const errs = {
      username: validateUsername(signupData.username),
      email: validateEmail(signupData.email),
      phone: validatePhone(signupData.phone),
      password: validatePassword(signupData.password, true),
    };
    setSignupErrors(errs);
    return !errs.username && !errs.email && !errs.phone && !errs.password;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;
    try {
      setIsLoading(true);
      const res = await api.post("/auth/signup", signupData);
      setAuth({
        username: res.data.username,
        email: res.data.email,
        phone: res.data.phone,
      });
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Signup failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center p-8 sm:p-12 md:p-16 relative">
        <div className="absolute top-8 left-8 flex items-center gap-2">
          <div className="bg-primary/20 border border-primary/30 p-1.5 rounded-lg">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-sm">ML Core</span>
        </div>

        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome to ML Core
            </h1>
            <p className="text-muted-foreground">
              Manage datasets and train models with ease.
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* ── Login ── */}
            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleLogin} noValidate>
                <Card>
                  <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>
                      Enter your email and password to sign in.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Email */}
                    <div className="space-y-1">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                        onBlur={() =>
                          setLoginErrors((p) => ({
                            ...p,
                            email: validateEmail(loginData.email),
                          }))
                        }
                        className={
                          loginErrors.email
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />
                      <FieldError msg={loginErrors.email} />
                    </div>
                    {/* Password */}
                    <div className="space-y-1">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showLoginPw ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) =>
                            setLoginData({
                              ...loginData,
                              password: e.target.value,
                            })
                          }
                          onBlur={() =>
                            setLoginErrors((p) => ({
                              ...p,
                              password: validatePassword(loginData.password),
                            }))
                          }
                          className={`pr-10 ${loginErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowLoginPw((v) => !v)}
                        >
                          {showLoginPw ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <FieldError msg={loginErrors.password} />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </TabsContent>

            {/* ── Signup ── */}
            <TabsContent value="signup" className="mt-4">
              <form onSubmit={handleSignup} noValidate>
                <Card>
                  <CardHeader>
                    <CardTitle>Create an account</CardTitle>
                    <CardDescription>
                      Enter your details below to get started.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Username */}
                    <div className="space-y-1">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        placeholder="john_doe"
                        value={signupData.username}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            username: e.target.value,
                          })
                        }
                        onBlur={() =>
                          setSignupErrors((p) => ({
                            ...p,
                            username: validateUsername(signupData.username),
                          }))
                        }
                        className={
                          signupErrors.username
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />
                      <FieldError msg={signupErrors.username} />
                    </div>
                    {/* Email */}
                    <div className="space-y-1">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupData.email}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            email: e.target.value,
                          })
                        }
                        onBlur={() =>
                          setSignupErrors((p) => ({
                            ...p,
                            email: validateEmail(signupData.email),
                          }))
                        }
                        className={
                          signupErrors.email
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />
                      <FieldError msg={signupErrors.email} />
                    </div>
                    {/* Phone */}
                    <div className="space-y-1">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={signupData.phone}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            phone: e.target.value,
                          })
                        }
                        onBlur={() =>
                          setSignupErrors((p) => ({
                            ...p,
                            phone: validatePhone(signupData.phone),
                          }))
                        }
                        className={
                          signupErrors.phone
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />
                      <FieldError msg={signupErrors.phone} />
                    </div>
                    {/* Password */}
                    <div className="space-y-1">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showSignupPw ? "text" : "password"}
                          placeholder="••••••••"
                          value={signupData.password}
                          onChange={(e) =>
                            setSignupData({
                              ...signupData,
                              password: e.target.value,
                            })
                          }
                          onBlur={() =>
                            setSignupErrors((p) => ({
                              ...p,
                              password: validatePassword(
                                signupData.password,
                                true,
                              ),
                            }))
                          }
                          className={`pr-10 ${signupErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowSignupPw((v) => !v)}
                        >
                          {showSignupPw ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <PasswordStrength password={signupData.password} />
                      <FieldError msg={signupErrors.password} />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Create account"}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="hidden lg:block relative bg-muted h-full overflow-hidden">
        <img
          src="/front_image.png"
          alt="ML Core preview"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/60 to-transparent z-10" />
      </div>
    </div>
  );
}
