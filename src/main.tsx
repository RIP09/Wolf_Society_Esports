import '@vly-ai/integrations';
import { api } from "@/convex/_generated/api";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { RequireAuth } from "@/components/RequireAuth";
import { PortalRedirect, RequireAdmin, RequirePlayer } from "@/components/RequireAdmin";
import { AdminLayout, PlayerLayout } from "@/components/layout/Portals";
import PublicLayout from "@/components/layout/PublicLayout";
import { getVisitorId } from "@/lib/visitor";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient, useMutation } from "convex/react";
import React, { StrictMode, useEffect, useRef, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const DenAuthPage = lazy(() => import("./pages/DenAuth.tsx"));
const GrantAccess = lazy(() => import("./pages/GrantAccess.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview.tsx"));
const AdminPlayers = lazy(() => import("./pages/admin/AdminPlayers.tsx"));
const AdminTeams = lazy(() => import("./pages/admin/AdminTeams.tsx"));
const AdminTournaments = lazy(() => import("./pages/admin/AdminTournaments.tsx"));
const AdminMatches = lazy(() => import("./pages/admin/AdminMatches.tsx"));
const AdminSchedule = lazy(() => import("./pages/admin/AdminSchedule.tsx"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements.tsx"));
const PlayerRegister = lazy(() => import("./pages/player/PlayerRegister.tsx"));
const PlayerDashboard = lazy(() => import("./pages/player/PlayerDashboard.tsx"));
const PlayerPerformance = lazy(() => import("./pages/player/PlayerPerformance.tsx"));
const PlayerProfile = lazy(() => import("./pages/player/PlayerProfile.tsx"));
const PlayerAnnouncements = lazy(() => import("./pages/player/PlayerAnnouncements.tsx"));
const PlayerSchedule = lazy(() => import("./pages/player/PlayerSchedule.tsx"));
const AdminInquiries = lazy(() => import("./pages/admin/AdminInquiries.tsx"));
const PublicTeams = lazy(() => import("./pages/public/PublicTeams.tsx"));
const PublicTeamDetail = lazy(() => import("./pages/public/PublicTeamDetail.tsx"));
const PublicTournaments = lazy(() => import("./pages/public/PublicTournaments.tsx"));
const PublicBracket = lazy(() => import("./pages/public/PublicBracket.tsx"));
const PublicMatches = lazy(() => import("./pages/public/PublicMatches.tsx"));
const PublicSchedule = lazy(() => import("./pages/public/PublicSchedule.tsx"));
const PublicPlayers = lazy(() => import("./pages/public/PublicPlayers.tsx"));
const PublicNews = lazy(() => import("./pages/public/PublicNews.tsx"));
const AccountPage = lazy(() => import("./pages/Account.tsx"));
const PublicContact = lazy(() => import("./pages/public/PublicContact.tsx"));
const PublicAbout = lazy(() => import("./pages/public/PublicAbout.tsx"));
const PublicAchievements = lazy(() => import("./pages/public/PublicAchievements.tsx"));
const PublicGallery = lazy(() => import("./pages/public/PublicGallery.tsx"));
const PublicFaq = lazy(() => import("./pages/public/PublicFaq.tsx"));
const PublicPrivacy = lazy(() => import("./pages/public/PublicPrivacy.tsx"));
const PublicTerms = lazy(() => import("./pages/public/PublicTerms.tsx"));
const PublicArticle = lazy(() => import("./pages/public/PublicArticle.tsx"));
const PublicWatch = lazy(() => import("./pages/public/PublicWatch.tsx"));
const PublicDonate = lazy(() => import("./pages/public/PublicDonate.tsx"));
const PublicDonateSuccess = lazy(() => import("./pages/public/PublicDonateSuccess.tsx"));
const PublicTryouts = lazy(() => import("./pages/public/PublicTryouts.tsx"));
const PublicSponsors = lazy(() => import("./pages/public/PublicSponsors.tsx"));
const PublicLeadership = lazy(() => import("./pages/public/PublicLeadership.tsx"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent.tsx"));
const AdminSponsors = lazy(() => import("./pages/admin/AdminSponsors.tsx"));
const AdminDonations = lazy(() => import("./pages/admin/AdminDonations.tsx"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics.tsx"));
const AdminAutomations = lazy(() => import("./pages/admin/AdminAutomations.tsx"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings.tsx"));
const AdminStaff = lazy(() => import("./pages/admin/AdminStaff.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const GEO_KEY = "wse_geo";
let geoPromise: Promise<{ country: string; code: string } | null> | null = null;

/**
 * Auto-detects the visitor's country via the free ipwho.is GeoIP API
 * (no key, no payment). Runs once per visitor and caches the result for a
 * week so every pageview is tagged with the same country. Falls back to
 * "Unknown" silently if the lookup fails or times out.
 */
function detectCountry(): Promise<{ country: string; code: string } | null> {
  try {
    const cached = localStorage.getItem(GEO_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as { country: string; code: string; at: number };
      if (parsed.country && Date.now() - parsed.at < 7 * 24 * 60 * 60 * 1000) {
        return Promise.resolve({ country: parsed.country, code: parsed.code });
      }
    }
  } catch {
    // ignore corrupt cache
  }
  if (!geoPromise) {
    geoPromise = (async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const res = await fetch("https://ipwho.is/", { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) return null;
        const data = (await res.json()) as {
          success?: boolean;
          country?: string;
          country_code?: string;
        };
        if (!data.success || !data.country) return null;
        const geo = {
          country: String(data.country).slice(0, 80),
          code: String(data.country_code ?? "").slice(0, 8),
        };
        try {
          localStorage.setItem(GEO_KEY, JSON.stringify({ ...geo, at: Date.now() }));
        } catch {
          // storage unavailable — keep going
        }
        return geo;
      } catch {
        return null;
      }
    })();
  }
  return geoPromise;
}

/** Realtime privacy-friendly pageview analytics for the public portal. */
function PageviewTracker() {
  const location = useLocation();
  const track = useMutation(api.analytics.trackPageview);
  const setCountry = useMutation(api.analytics.setVisitorCountry);
  const first = useRef(true);
  const visitorId = useRef<string | null>(null);
  const geoRef = useRef<{ country: string; code: string } | null>(null);

  // Resolve the anonymous visitor id + auto-detected country once per session.
  useEffect(() => {
    if (!visitorId.current) visitorId.current = getVisitorId();
    void detectCountry().then((geo) => {
      if (geo) {
        geoRef.current = geo;
        // Tag the visitor row even if the lookup landed after the first pageview.
        if (visitorId.current) {
          void setCountry({
            visitorId: visitorId.current,
            country: geo.country,
            countryCode: geo.code,
          });
        }
      }
    });
  }, [setCountry]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const geo = geoRef.current;
    void track({
      path: location.pathname,
      referrer: document.referrer || undefined,
      visitorId: visitorId.current ?? undefined,
      country: geo?.country,
      countryCode: geo?.code,
    });
  }, [location.pathname, track]);

  return null;
}

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      {/* sessionStorage keeps each visitor's session tied to their tab —
          closing the site clears the token, so everyone signs in again on return. */}
      <ConvexAuthProvider client={convex} storage={sessionStorage}>
        <BrowserRouter>
          <RouteSyncer />
          <PageviewTracker />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              {/* Public portal — showcases the organization to the world */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/about" element={<PublicAbout />} />
                <Route path="/teams" element={<PublicTeams />} />
                <Route path="/teams/:teamId" element={<PublicTeamDetail />} />
                <Route path="/tournaments" element={<PublicTournaments />} />
                <Route path="/bracket" element={<PublicBracket />} />
                <Route path="/matches" element={<PublicMatches />} />
                <Route path="/schedule" element={<PublicSchedule />} />
                <Route path="/players" element={<PublicPlayers />} />
                <Route path="/achievements" element={<PublicAchievements />} />
                <Route path="/news" element={<PublicNews />} />
                <Route path="/news/:slug" element={<PublicArticle />} />
                <Route path="/watch" element={<PublicWatch />} />
                <Route path="/donate" element={<PublicDonate />} />
                <Route path="/donate/success" element={<PublicDonateSuccess />} />
                <Route path="/tryouts" element={<PublicTryouts />} />
                <Route path="/sponsors" element={<PublicSponsors />} />
                <Route path="/leadership" element={<PublicLeadership />} />
                <Route path="/gallery" element={<PublicGallery />} />
                <Route path="/faq" element={<PublicFaq />} />
                <Route path="/privacy" element={<PublicPrivacy />} />
                <Route path="/terms" element={<PublicTerms />} />
                <Route path="/contact" element={<PublicContact />} />
                <Route
                  path="/account"
                  element={
                    <RequireAuth>
                      <AccountPage />
                    </RequireAuth>
                  }
                />
              </Route>

              {/* Secret access-granting page — linked from notification emails */}
              <Route path="/grant" element={<GrantAccess />} />

              <Route path="/auth" element={<AuthPage redirectAfterAuth="/portal" />} />
              <Route path="/auth/den" element={<DenAuthPage redirectAfterAuth="/portal" />} />
              <Route
                path="/portal"
                element={
                  <RequireAuth>
                    <PortalRedirect />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireAuth>
                    <RequireAdmin>
                      <AdminLayout />
                    </RequireAdmin>
                  </RequireAuth>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="players" element={<AdminPlayers />} />
                <Route path="teams" element={<AdminTeams />} />
                <Route path="tournaments" element={<AdminTournaments />} />
                <Route path="matches" element={<AdminMatches />} />
                <Route path="schedule" element={<AdminSchedule />} />
                <Route path="announcements" element={<AdminAnnouncements />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="sponsors" element={<AdminSponsors />} />
                <Route path="donations" element={<AdminDonations />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="automations" element={<AdminAutomations />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="inquiries" element={<AdminInquiries />} />
                <Route path="staff" element={<AdminStaff />} />
              </Route>
              <Route
                path="/player"
                element={
                  <RequireAuth>
                    <RequirePlayer>
                      <PlayerLayout />
                    </RequirePlayer>
                  </RequireAuth>
                }
              >
                <Route index element={<PlayerDashboard />} />
                <Route path="schedule" element={<PlayerSchedule />} />
                <Route path="register" element={<PlayerRegister />} />
                <Route path="performance" element={<PlayerPerformance />} />
                <Route path="profile" element={<PlayerProfile />} />
                <Route path="announcements" element={<PlayerAnnouncements />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
        <SpeedInsights />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
