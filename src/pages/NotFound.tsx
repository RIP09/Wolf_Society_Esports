import { WolfMark } from "@/components/WolfLogo";
import { Button } from "@/components/ui/button";
import { btnYellow } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { Compass } from "lucide-react";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="neo-grid-bg flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
        <WolfMark size={80} />
        <div>
          <h1 className="text-6xl font-bold tracking-tight">404</h1>
          <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Page not found
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            That page wandered off the map. Head back to the Society.
          </p>
        </div>
        <Link to="/">
          <Button className={cn(btnYellow, "gap-2")}>
            <Compass className="size-4" />
            Back to Wolf Society
          </Button>
        </Link>
      </div>
    </div>
  );
}
