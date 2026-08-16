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
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  Crosshair,
  Gamepad2,
  Loader2,
  Mail,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";

type Path = "player" | "fan";
type Step = "choose" | { path: Path; email: string };

function Register() {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pre = searchParams.get("path") === "fan" ? "fan" : "player";

  const [path, setPath] = useState<Path>(pre);
  const [step, setStep] = useState<Step>("choose");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in? Go straight to the destination for the chosen path.
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(path === "fan" ? "/fan-zone" : "/player/register", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, navigate]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ path, email: formData.get("email") as string });
      setIsLoading(false);
    } catch (err) {
      console.error("Register email error:", err);
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
      navigate(path === "fan" ? "/fan-zone" : "/player/register", { replace: true });
    } catch (err) {
      console.error("Register OTP error:", err);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  return (
    <div className="neo-grid-bg flex min-h-screen flex-col bg-background">
      {/* Brand bar */}
      <div className="flex items-center justify-center gap-2 border-b-2 border-foreground bg-neo-yellow px-4 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-widest text-white">
        <Crosshair className="size-3.5" />
        Wolf Society Esports · Registration
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
          >
            <Card className="w-full rounded-none border-2 border-foreground bg-card pb-0 shadow-[6px_6px_0_0_var(--neo-ink)]">
              {step === "choose" ? (
                <>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center border-2 border-foreground bg-neo-yellow text-white shadow-[3px_3px_0_0_var(--neo-ink)]">
                      <Gamepad2 className="size-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                      Join the Pack
                    </CardTitle>
                    <CardDescription>
                      One account for the Fan Zone and the player portal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Choose how you want to register
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPath("player");
                        setStep({ path: "player", email: "" });
                      }}
                      className={cn(
                        "neo-press group flex items-center justify-between gap-4 border-2 border-foreground bg-background p-5 text-left shadow-[3px_3px_0_0_var(--neo-ink)] transition-colors",
                        path === "player" && "bg-neo-cream",
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-foreground bg-neo-blue text-white">
                          <Crosshair className="size-5" />
                        </span>
                        <div>
                          <p className="text-lg font-bold leading-tight">I want to compete</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Player registration — management approves every profile
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPath("fan");
                        setStep({ path: "fan", email: "" });
                      }}
                      className={cn(
                        "neo-press group flex items-center justify-between gap-4 border-2 border-foreground bg-background p-5 text-left shadow-[3px_3px_0_0_var(--neo-ink)] transition-colors",
                        path === "fan" && "bg-neo-cream",
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
                          <BarChart3 className="size-5" />
                        </span>
                        <div>
                          <p className="text-lg font-bold leading-tight">I'm here for the Fan Zone</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Polls, trivia, predictions — earn XP and climb the rankings
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </CardContent>
                </>
              ) : step.path === "player" && step.email === "" ? (
                <>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center border-2 border-foreground bg-neo-blue text-white shadow-[3px_3px_0_0_var(--neo-ink)]">
                      <Crosshair className="size-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                      Player registration
                    </CardTitle>
                    <CardDescription>
                      Start with your email — we'll send a one-time code to verify it.
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
                    </CardContent>
                  </form>
                </>
              ) : step.path === "fan" && step.email === "" ? (
                <>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center border-2 border-foreground bg-neo-yellow text-white shadow-[3px_3px_0_0_var(--neo-ink)]">
                      <BarChart3 className="size-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                      Fan Zone signup
                    </CardTitle>
                    <CardDescription>
                      One-time code to your email — then you can vote, predict and earn XP.
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleEmailSubmit}>
                    <CardContent>
                      <div className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            name="email"
                            placeholder="you@example.com"
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
                          onClick={() => setStep({ path: step.path, email: "" })}
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
                            Verify & continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep("choose")}
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
                {step === "choose"
                  ? "Player portal & Fan Zone · Wolf Society Esports"
                  : step.path === "player"
                    ? "Player portal · The Pack"
                    : "Fan Zone · Wolf Society Esports"}
              </div>
            </Card>
          </motion.div>

          <p className="mt-5 max-w-sm text-center text-xs leading-5 text-muted-foreground">
            {step === "choose" ? (
              <>
                Players register once and management approves the profile. Fans get
                XP for every poll, trivia answer and prediction. Already have an
                account?{" "}
                <Link to="/signin" className="font-bold underline">
                  Sign in
                </Link>
                .
              </>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <Check className="size-3.5 text-neo-green" />
                Your registration data lives in the Society's shared system.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <Register />
    </Suspense>
  );
}
