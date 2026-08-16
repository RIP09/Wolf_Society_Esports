import { api } from "@/convex/_generated/api";
import { WolfMark } from "@/components/WolfLogo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { PasswordInput } from "@/components/PasswordInput";
import { useAuth } from "@/hooks/use-auth";
import { MANAGEMENT_ROLES } from "@/lib/constants";
import { btnGhost, btnYellow, input, label, select } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useAction, useMutation } from "convex/react";
import {
  ArrowRight,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

interface DenAuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/admin",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

/** Staff credentials sign-in (generated User ID + password, or the WSE super admin). */
function StaffSignIn({ redirect }: { redirect: string }) {
  const { signIn } = useAuth();
  const ensureSuperAdmin = useAction(api.access.ensureSuperAdmin);
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // Idempotent bootstrap so the built-in WSE fallback account always exists.
      await ensureSuperAdmin();
      await signIn("password", {
        flow: "signIn",
        email: userId.trim(),
        password,
      });
      navigate(redirect);
    } catch (error) {
      console.error("Staff sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message.includes("Invalid credentials")
            ? "Invalid User ID or password. Use the credentials sent to you, or the super admin fallback (WSE / WSE@123)."
            : error.message
          : "Sign-in failed. Please try again.",
      );
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="flex flex-col gap-1.5">
        <span className={label}>User ID</span>
        <Input
          className={input}
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="WSE-042 or WSE"
          autoCapitalize="characters"
          disabled={isLoading}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className={label}>Password</span>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          required
        />
      </div>
      {error && (
        <p className="border-2 border-foreground bg-neo-red px-3 py-2 text-xs font-bold text-white">
          {error}
        </p>
      )}
      <Button type="submit" className={btnYellow} disabled={isLoading || !userId.trim() || !password}>
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        {isLoading ? "Signing in…" : "Sign in to The Den"}
      </Button>
      <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Super Admin Page Login
      </p>
    </form>
  );
}

/** Management access request form — notifies the org, which grants from the secret page. */
function RequestAccessForm() {
  const requestAccess = useMutation(api.access.requestAccess);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requestedRole, setRequestedRole] = useState<string>("Manager");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await requestAccess({
        name,
        email,
        phone,
        requestedRole,
        reason: reason.trim() || undefined,
      });
      setSent(true);
      toast.success("Request submitted — the organization has been notified!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your request.");
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-neo-green text-white">
          <UserPlus className="size-6" />
        </span>
        <div>
          <p className="text-lg font-bold">Request received</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The organization has been notified by email. If your access is granted, your
            User ID and password will be sent to <span className="font-bold text-foreground">{email}</span> and
            to <span className="font-bold text-foreground">{phone}</span> by SMS automatically.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="rounded-none border-2 border-foreground bg-card px-4 py-2 shadow-[2px_2px_0_0_var(--neo-ink)]"
          onClick={() => {
            setSent(false);
            setName("");
            setEmail("");
            setPhone("");
            setReason("");
          }}
        >
          Submit another request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <p className="text-xs leading-5 text-muted-foreground">
        Need access to manage the organization? Submit a request — management reviews it
        from a private page and your login credentials are delivered to you automatically.
      </p>
      {error && (
        <p className="border-2 border-foreground bg-neo-red px-3 py-2 text-xs font-bold text-white">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className={label}>Full name *</span>
          <Input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" disabled={submitting} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={label}>Role needed *</span>
          <Select value={requestedRole} onValueChange={setRequestedRole}>
            <SelectTrigger className={cn(select, "w-full")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none border-2 border-foreground">
              {MANAGEMENT_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className={label}>Email *</span>
          <Input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={submitting} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={label}>Contact number *</span>
          <Input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" disabled={submitting} required />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className={label}>Why do you need access?</span>
        <Textarea
          className="min-h-20 rounded-none border-2 border-foreground bg-background"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Role, responsibilities, or who you work with…"
          disabled={submitting}
        />
      </div>
      <div className="flex flex-col gap-3 border-t-2 border-foreground pt-4">
        <Button type="submit" className={btnYellow} disabled={submitting || !name.trim() || !email.trim() || !phone.trim()}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          {submitting ? "Submitting…" : "Request management access"}
        </Button>
      </div>
    </form>
  );
}

function DenAuth({ redirectAfterAuth }: DenAuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [mode, setMode] = useState<"credentials" | "request" | "otp">("credentials");
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  return (
    <div className="neo-grid-bg flex min-h-screen flex-col bg-background">
      {/* Management portal badge */}
      <div className="flex items-center justify-center gap-2 border-b-2 border-foreground bg-neo-yellow px-4 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-widest text-white">
        <ShieldCheck className="size-3.5" />
        Management portal · The Den
      </div>

      {/* Auth Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-md flex-col items-center">
          <Card className="w-full rounded-none border-2 border-foreground bg-card pb-0 shadow-[6px_6px_0_0_var(--neo-ink)]">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex justify-center">
                <WolfMark size={48} />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                The Den · Management
              </CardTitle>
              <CardDescription>
                Sign in with your staff credentials, or request management access
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-5">
              {/* Den mode switcher */}
              <div className="grid w-full grid-cols-3 border-2 border-foreground bg-card">
                {(
                  [
                    ["credentials", "Staff sign-in"],
                    ["request", "Request access"],
                    ["otp", "Email code"],
                  ] as const
                ).map(([m, labelStr]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "px-2 py-2.5 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors",
                      m === "otp" ? "" : "border-r-2 border-foreground",
                      mode === m ? "bg-neo-yellow text-white" : "bg-card hover:bg-neo-cream",
                    )}
                  >
                    {labelStr}
                  </button>
                ))}
              </div>

              {mode === "credentials" ? (
                <StaffSignIn redirect={redirect} />
              ) : mode === "request" ? (
                <RequestAccessForm />
              ) : (
                <>
                  {step === "signIn" ? (
                    <>
                      <form onSubmit={handleEmailSubmit}>
                        <div className="relative flex items-center gap-2">
                          <div className="relative flex-1">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              name="email"
                              placeholder="name@example.com"
                              type="email"
                              className={cn(input, "pl-9")}
                              disabled={isLoading}
                              required
                            />
                          </div>
                          <Button
                            type="submit"
                            variant="outline"
                            size="icon"
                            className={cn(btnGhost, "size-9 shrink-0")}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ArrowRight className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {error && (
                          <p className="mt-2 border-2 border-foreground bg-neo-red px-3 py-1.5 text-xs font-bold text-white">
                            {error}
                          </p>
                        )}
                      </form>
                      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>Don't have a code login?</span>
                        <Button
                          variant="link"
                          className="h-auto p-0 font-bold"
                          onClick={() => setMode("credentials")}
                        >
                          Use staff credentials
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <CardHeader className="mt-2 px-0 text-center">
                        <CardTitle className="text-lg">Check your email</CardTitle>
                        <CardDescription>
                          We've sent a code to {step.email}
                        </CardDescription>
                      </CardHeader>
                      <form onSubmit={handleOtpSubmit}>
                        <input type="hidden" name="email" value={step.email} />
                        <input type="hidden" name="code" value={otp} />
                        <div className="flex justify-center">
                          <InputOTP
                            value={otp}
                            onChange={setOtp}
                            maxLength={6}
                            disabled={isLoading}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                                const form = (e.target as HTMLElement).closest("form");
                                if (form) form.requestSubmit();
                              }
                            }}
                          >
                            <InputOTPGroup>
                              {Array.from({ length: 6 }).map((_, index) => (
                                <InputOTPSlot key={index} index={index} />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                        {error && (
                          <p className="mt-2 text-center text-sm font-bold text-destructive">
                            {error}
                          </p>
                        )}
                        <p className="mt-4 text-center text-sm text-muted-foreground">
                          Didn't receive a code?{" "}
                          <Button
                            variant="link"
                            className="h-auto p-0 font-bold"
                            onClick={() => setStep("signIn")}
                          >
                            Try again
                          </Button>
                        </p>
                        <Button
                          type="submit"
                          className={cn(btnYellow, "mt-3 w-full")}
                          disabled={isLoading || otp.length !== 6}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              Verify code
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </form>
                    </>
                  )}
                </>
              )}
            </CardContent>

            <div className="border-t-2 border-foreground bg-neo-cream px-6 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Management portal · Wolf Society Esports
            </div>
          </Card>

          <p className="mt-5 max-w-sm text-center text-xs leading-5 text-muted-foreground">
            Management access is granted by the organization. Request access above —
            granted users receive their User ID and password by email and SMS.
          </p>
          <Link
            to="/auth"
            className="mt-3 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Player? Sign in at The Pack →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DenAuthPage(props: DenAuthProps) {
  return (
    <Suspense>
      <DenAuth {...props} />
    </Suspense>
  );
}
