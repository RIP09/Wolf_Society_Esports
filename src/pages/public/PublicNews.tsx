import { api } from "@/convex/_generated/api";
import { EmptyState, NeoCard, PageHeader } from "@/components/neo";
import { CONTENT_CATEGORIES } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { Newspaper } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

export default function PublicNews() {
  const [category, setCategory] = useState<string>("All");
  const articles = useQuery(api.content.publicList, {
    category: category === "All" ? undefined : category,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports"
        title="News & Media"
        description="Articles, match reports and interviews published straight from The Den — every word here is managed live from the organization database."
      />

      {/* Category filter */}
      <div className="mt-8 flex flex-wrap gap-2">
        {["All", ...CONTENT_CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "border-2 border-foreground px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors",
              category === c
                ? "bg-neo-yellow text-white shadow-[2px_2px_0_0_var(--neo-ink)]"
                : "bg-card hover:bg-neo-cream",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {!articles ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse border-2 border-foreground bg-card" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <EmptyState
            title="No articles in this category yet"
            description="The organization publishes news, reports and interviews here."
          />
        ) : (
          articles.map((a) => (
            <Link key={a._id} to={`/news/${a.slug}`} className="neo-press group block">
              <NeoCard className="gap-4 p-0 transition-shadow">
                {a.imageUrl ? (
                  <div className="h-44 w-full overflow-hidden border-b-2 border-foreground bg-neo-cream">
                    <img
                      src={a.imageUrl}
                      alt={a.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                ) : null}
                <div className="flex flex-col gap-3 p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-block h-3 w-3 border-2 border-foreground ${a.coverColor ?? "bg-neo-yellow"}`} />
                    <span className="border-2 border-foreground bg-neo-cream px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                      {a.category}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {fmtDate(a.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-start gap-4">
                    <Newspaper className="mt-1 size-5 shrink-0 text-neo-blue" />
                    <div>
                      <p className="text-xl font-bold leading-snug group-hover:underline">{a.title}</p>
                      {a.excerpt ? (
                        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{a.excerpt}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </NeoCard>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
