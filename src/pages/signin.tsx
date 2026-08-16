import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { btnGhost, btnYellow, input } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Crosshair,
  Loader2,
  LogIn,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/portal",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

/**
 * After sign-in, send each person where they belong:
 *  - managers → The Den (/admin)
 *  - registered players → The Pack (/player)
 *  - fans → Fan Zone (/fan-zone)
 */
function useSignInDestination(profile: { status: string } | null | undefined) {
  const { user } = useAuth();
  const role = user?.role;
  if (role === "admin" || role === "superadmin") return "/admin";
  if (profile) return "/player";
  return "/fan-zone";
}

function SignIn() {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const profile = useQuery(api.players.getMyProfile);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    useSignInDestination(profile),
  );

  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wait for the profile query to resolve too, so players land in the player
  // portal and fans land in the Fan Zone — never the wrong side.
  useEffect(() => {
    if (!authLoading && isAuthenticated && profile !== undefined) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect, profile]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (err) {
      console.error("Sign-in email error:", err);
      setError(
        err instanceof Error
          ? err.message
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
      // Navigation happens in the effect above once the profile resolves.
    } catch (err) {
      console.error("Sign-in OTP error:", err);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  return (
    <div className="neo-grid-bg flex min-h-screen flex-col bg-background">
      {/* Brand bar */}
      <div className="flex items-center justify-center gap-2 border-b-2 border-foreground bg-neo-blue px-4 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-widest text-white">
        <LogIn className="size-3.5" />
        Sign in · Wolf Society Esports
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
          >
            <Card className="w-full rounded-none border-2 border-foreground bg-card pb-0 shadow-[6px_6px_0_0_var(--neo-ink)]">
              {step === "signIn" ? (
                <>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center border-2 border-foreground bg-neo-yellow text-white shadow-[3px_3px_0_0_var(--neo-ink)]">
                      <LogIn className="size-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                      Welcome back
                    </CardTitle>
                    <CardDescription>
                      Sign in with the email you used at registration — we'll send a
                      one-time code to verify it's you.
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleEmailSubmit}>
                    <CardContent>
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

                      <div className="mt-4">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t-2 border-foreground" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 font-mono text-[10px] font-bold tracking-widest text-muted-foreground">
                              What you can do
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                          <div className="border-2 border-foreground bg-neo-cream px-2 py-3">
                            <BarChart3 className="mx-auto size-4" />
                            <p className="mt-1.5 font-mono text-[9px] font-bold uppercase tracking-wider">
                              Fan XP &amp; rankings
                            </p>
                          </div>
                          <div className="border-2 border-foreground bg-neo-cream px-2 py-3">
                            <Crosshair className="mx-auto size-4" />
                            <p className="mt-1.5 font-mono text-[9px] font-bold uppercase tracking-wider">
                              Player portal
                            </p>
                          </div>
                          <div className="border-2 border-foreground bg-neo-cream px-2 py-3">
                            <ShieldCheck className="mx-auto size-4" />
                            <p className="mt-1.5 font-mono text-[9px] font-bold uppercase tracking-wider">
                              Management (staff)
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </form>
                </>
              ) : (
                <>
                  <CardHeader className="mt-4 text-center">
                    <CardTitle>Check your email</CardTitle>
                    <CardDescription>
                      We've sent a code to {step.email}
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleOtpSubmit}>
                    <CardContent className="pb-4">
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
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                      <Button
                        type="submit"
                        className={cn(btnYellow, "w-full")}
                        disabled={isLoading || otp.length !== 6}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            Sign in
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep("signIn")}
                        disabled={isLoading}
                        className="w-full hover:bg-neo-cream"
                      >
                        Use different email
                      </Button>
                    </CardFooter>
                  </form>
                </>
              )}

              <div className="border-t-2 border-foreground bg-neo-cream px-6 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Wolf Society Esports · Player portal &amp; Fan Zone
              </div>
            </Card>
          </motion.div>

          <p className="mt-5 max-w-sm text-center text-xs leading-5 text-muted-foreground">
            Don't have an account yet?{" "}
            <Link to="/register" className="font-bold underline">
              Register here
            </Link>
            {" "}— players and fans are both welcome.
          </p>
          <Link
            to="/auth/den"
            className="mt-3 block text-center font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Management staff? Sign in at The Den →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}
