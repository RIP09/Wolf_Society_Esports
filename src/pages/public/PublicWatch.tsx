import { api } from "@/convex/_generated/api";
import { EmptyState, NeoCard, PageHeader } from "@/components/neo";
import { fmtRelative } from "@/lib/format";
import { useQuery } from "convex/react";
import { CalendarClock, MessageCircle, Twitch, Youtube } from "lucide-react";
import { Link } from "react-router";

export default function PublicWatch() {
  const settings = useQuery(api.public.getSettings);
  const home = useQuery(api.public.getHome);

  const twitchChannel = settings?.twitchChannel?.trim();
  const youtubeChannel = settings?.youtubeChannel?.trim();
  const discordInvite = settings?.discordInvite?.trim();
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports"
        title="Watch live"
        description="Scrims, show matches and tournament runs — streamed straight from the Society's channels. Configure the channels from The Den → Settings."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {twitchChannel ? (
            <NeoCard className="gap-0 overflow-hidden p-0">
              <div className="flex items-center gap-2 border-b-2 border-foreground bg-neo-purple px-5 py-3 text-white">
                <Twitch className="size-4" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
                  Live on Twitch — {twitchChannel}
                </span>
              </div>
              <div className="aspect-video w-full">
                <iframe
                  src={`https://player.twitch.tv/?channel=${encodeURIComponent(twitchChannel)}&parent=${hostname}&autoplay=false`}
                  title={`${twitchChannel} on Twitch`}
                  className="h-full w-full border-0"
                  allowFullScreen
                />
              </div>
            </NeoCard>
          ) : (
            <NeoCard className="gap-3 p-8 text-center">
              <Twitch className="mx-auto size-8 text-neo-purple" />
              <p className="font-bold">No Twitch channel configured yet</p>
              <p className="text-sm text-muted-foreground">
                The organization sets its streaming channel from The Den — embeds appear
                here automatically.
              </p>
            </NeoCard>
          )}

          {youtubeChannel ? (
            <NeoCard className="gap-4 p-6">
              <div className="flex items-center gap-2">
                <Youtube className="size-4 text-neo-red" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
                  YouTube channel
                </span>
              </div>
              <a
                href={youtubeChannel}
                target="_blank"
                rel="noreferrer"
                className="neo-press inline-flex w-fit items-center gap-2 border-2 border-foreground bg-neo-red px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_0_var(--neo-ink)]"
              >
                <Youtube className="size-4" />
                Watch on YouTube
              </a>
            </NeoCard>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <NeoCard className="gap-0 p-0">
            <div className="flex items-center gap-2 border-b-2 border-foreground px-5 py-4">
              <CalendarClock className="size-4" />
              <h2 className="font-bold">Upcoming broadcasts</h2>
            </div>
            <div className="flex flex-col divide-y-2 divide-foreground/10">
              {!home ? (
                <div className="h-40 animate-pulse" />
              ) : home.upcomingMatches.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted-foreground">
                  No matches scheduled yet — check back soon.
                </p>
              ) : (
                home.upcomingMatches.map((m) => (
                  <div key={m._id} className="px-5 py-3.5">
                    <p className="text-sm font-bold leading-snug">
                      {m.teamAName} <span className="text-muted-foreground">vs</span> {m.teamBName}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {m.tournamentName ?? "Friendly"} · {fmtRelative(m.scheduledAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </NeoCard>

          <NeoCard className="gap-4 p-6">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-4" />
              <h2 className="font-bold">Talk with the pack</h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Join the community Discord for live match discussion, roster news and
              behind-the-scenes from the Society.
            </p>
            {discordInvite ? (
              <a
                href={discordInvite}
                target="_blank"
                rel="noreferrer"
                className="neo-press inline-flex w-fit items-center gap-2 border-2 border-foreground bg-neo-blue px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_0_var(--neo-ink)]"
              >
                <MessageCircle className="size-4" />
                Join the Discord
              </a>
            ) : (
              <Link
                to="/contact"
                className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Ask for the invite via contact →
              </Link>
            )}
          </NeoCard>
        </div>
      </div>

      {!twitchChannel && !youtubeChannel ? (
        <div className="mt-10">
          <EmptyState
            title="Streaming not configured"
            description="Channels and the Discord invite are set by management in The Den."
          />
        </div>
      ) : null}
    </div>
  );
}
