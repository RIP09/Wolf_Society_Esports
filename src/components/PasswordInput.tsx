import { Input } from "@/components/ui/input";
import { input } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface PasswordInputProps
  extends Omit<React.ComponentProps<typeof Input>, "type"> {
  containerClassName?: string;
}

/**
 * Password field with a show/hide eye toggle so users can verify what they
 * typed (eye = see the password, crossed-out eye = hide it again).
 */
export function PasswordInput({
  className,
  containerClassName,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={cn("relative", containerClassName)}>
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(input, "pr-10", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center border-2 border-foreground bg-background text-foreground hover:bg-neo-cream"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
