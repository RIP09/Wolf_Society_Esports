import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { EmptyState, NeoCard } from "@/components/neo";
import { fmtDate } from "@/lib/format";
import { btnGhost } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { ArrowLeft, CalendarDays, Newspaper, User } from "lucide-react";
import { Link, useParams } from "react-router";

export default function PublicArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = useQuery(api.content.getBySlug, { slug: slug ?? "" });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link to="/news" className="mb-8 inline-flex">
        <Button variant="outline" className={cn(btnGhost, "h-9")}>
          <ArrowLeft className="size-4" />
          Back to news
        </Button>
      </Link>

      {!article ? (
        <div className="h-64 animate-pulse border-2 border-foreground bg-card" />
      ) : article === null ? (
        <EmptyState
          title="Article not found"
          description="This story may have been unpublished by the organization."
        />
      ) : (
        <NeoCard className="gap-6 p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-block h-4 w-4 border-2 border-foreground ${article.coverColor ?? "bg-neo-yellow"}`} />
            <span className="border-2 border-foreground bg-neo-cream px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
              {article.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {article.title}
          </h1>
          {article.imageUrl ? (
            <div className="overflow-hidden border-2 border-foreground bg-neo-cream shadow-[4px_4px_0_0_var(--neo-ink)]">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="max-h-96 w-full object-cover"
              />
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-4 border-y-2 border-foreground/20 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="size-3.5" />
              {article.authorName}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {fmtDate(article.createdAt)}
            </span>
          </div>
          {article.excerpt ? (
            <p className="border-2 border-foreground bg-neo-cream px-4 py-3 text-sm font-medium leading-6">
              {article.excerpt}
            </p>
          ) : null}
          <div className="flex flex-col gap-4 text-[15px] leading-7">
            {article.body.split(/\n{2,}/).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          <div className="flex items-center gap-3 border-t-2 border-foreground/20 pt-6 text-sm text-muted-foreground">
            <Newspaper className="size-4" />
            Published by Wolf Society Esports — content is managed live from The Den.
          </div>
        </NeoCard>
      )}
    </div>
  );
}
