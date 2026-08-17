 import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, NeoCard, NeoField, PageHeader, StatusBadge } from "@/components/neo";
import { btnGhost, btnYellow, input } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useAction, useMutation, useQuery } from "convex/react";
import { fmtRelative } from "@/lib/format";
import {
  Ban,
  CheckCircle2,
  Fingerprint,
  FlaskConical,
  Globe2,
  Loader2,
  Lock,
  MapPin,
  PlugZap,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function RiskBadge({ score }: { score?: number }) {
  if (score === undefined) {
    return <StatusBadge status="pending">No score</StatusBadge>;
  }
  if (score >= 85) return <StatusBadge status="urgent">{score} — High risk</StatusBadge>;
  if (score >= 60) return <StatusBadge status="pending">{score} — Elevated</StatusBadge>;
  return <StatusBadge status="approved">{score} — Low</StatusBadge>;
}

export default function AdminSecurity() {
  const data = useQuery(api.security.getSecurityEvents);
  const integrations = useQuery(api.admin.getIntegrationStatus);
  const verify = useAction(api.security.verifySecurityApi);
  const blockIp = useMutation(api.security.blockIp);
  const unblockIp = useMutation(api.security.unblockIp);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testOk, setTestOk] = useState<boolean | null>(null);

  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newHours, setNewHours] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await verify();
      setTestOk(res.ok);
      setTestResult(res.message);
    } catch (e) {
      setTestOk(false);
      setTestResult(e instanceof Error ? e.message : "Test failed.");
    } finally {
      setTesting(false);
    }
  };

  const handleBlock = async () => {
    if (!newIp.trim()) return;
    setBlocking(true);
    try {
      const hours = newHours.trim() ? Number(newHours) : undefined;
      await blockIp({
        ip: newIp.trim(),
        reason: newReason.trim(),
        durationHours: hours && hours > 0 ? hours : undefined,
      });
      toast.success(`IP ${newIp.trim()} blocked${hours ? ` for ${hours}h` : " permanently"}.`);
      setNewIp("");
      setNewReason("");
      setNewHours("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not block the IP.");
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblock = async (ip: string) => {
    setUnblocking(ip);
    try {
      await unblockIp({ ip });
      toast.success(`IP ${ip} unblocked — access restored.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not unblock the IP.");
    } finally {
      setUnblocking(null);
    }
  };

  if (!data || !integrations) {
    return (
      <div className="flex flex-col gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse border-2 border-foreground bg-card" />
        ))}
      </div>
    );
  }

  const securityApi = integrations.security;
  const { attempts, blockedIps, counts } = data;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="The Den · Website security"
        title="Security command center"
        description="Every blocked attempt is logged with the attacker's IP, location and fraud-risk score — and high-risk addresses are blocked automatically. Manage blocks and verify the security API here."
      />

      {/* ── Security API connection ────────────────────────────────────── */}
      <NeoCard className="gap-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
              <PlugZap className="size-5" />
            </span>
            <div>
              <p className="text-lg font-bold">Security API — IPQualityScore</p>
              <p className="text-sm text-muted-foreground">
                Free forever (5,000 lookups/month). Fraud-scans every blocked attempt and
                returns the attacker's location, VPN/proxy flags and a 0–100 risk score.
              </p>
            </div>
          </div>
          {securityApi.configured ? (
            <StatusBadge status="approved">
              <CheckCircle2 className="size-3" /> Connected
            </StatusBadge>
          ) : (
            <StatusBadge status="pending">
              <XCircle className="size-3" /> Not connected
            </StatusBadge>
          )}
        </div>
        <p className="break-all border-2 border-foreground bg-neo-cream px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Key: IPQUALITYSCORE_API_KEY — paste your free key in the Convex dashboard → Keys tab
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button className={btnYellow} onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
            {testing ? "Testing…" : "Test connection"}
          </Button>
          {testResult ? (
            <p
              className={cn(
                "border-2 border-foreground px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider",
                testOk ? "bg-neo-green text-white" : "bg-neo-red text-white",
              )}
            >
              {testResult}
            </p>
          ) : null}
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Globe2 className="size-3.5" />
          No key? The system still records every blocked attempt with IP + country via the
          free GeoIP fallback — only the fraud score and auto-block need the key.
        </p>
      </NeoCard>

      {/* ── Live numbers ───────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NeoCard className="gap-1 p-5">
          <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <ShieldAlert className="size-3.5" /> Recent attempts
          </p>
          <p className="text-3xl font-bold leading-none tabular-nums">{counts.totalAttempts}</p>
          <p className="text-xs text-muted-foreground">last 60 · logged in realtime</p>
        </NeoCard>
        <NeoCard className="gap-1 p-5">
          <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Ban className="size-3.5" /> Blocked IPs
          </p>
          <p className="text-3xl font-bold leading-none tabular-nums">{counts.blockedIps}</p>
          <p className="text-xs text-muted-foreground">active blocks right now</p>
        </NeoCard>
        <NeoCard className="gap-1 p-5">
          <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Lock className="size-3.5" /> Auto-blocked
          </p>
          <p className="text-3xl font-bold leading-none tabular-nums">{counts.autoBlocked}</p>
          <p className="text-xs text-muted-foreground">risk score 85+ · by the API</p>
        </NeoCard>
        <NeoCard className="gap-1 p-5">
          <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Fingerprint className="size-3.5" /> Manual blocks
          </p>
          <p className="text-3xl font-bold leading-none tabular-nums">{counts.manualBlocks}</p>
          <p className="text-xs text-muted-foreground">set by management</p>
        </NeoCard>
      </div>

      {/* ── Block an IP ────────────────────────────────────────────────── */}
      <NeoCard className="gap-5 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-neo-red text-white">
            <Ban className="size-5" />
          </span>
          <div>
            <p className="text-lg font-bold">Block an IP address</p>
            <p className="text-sm text-muted-foreground">
              Permanently or for a set number of hours. Blocked addresses are flagged on every
              future attempt and shown across the Den.
            </p>
          </div>
        </div>
        <div className="grid items-end gap-4 sm:grid-cols-[1fr_1.2fr_8rem_auto]">
          <NeoField label="IP address" hint="IPv4 or IPv6">
            <Input className={input} value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="203.0.113.7" />
          </NeoField>
          <NeoField label="Reason" hint="Why this address is blocked">
            <Input className={input} value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="Brute-force sign-in attempts" />
          </NeoField>
          <NeoField label="Duration (hours)" hint="Empty = permanent">
            <Input className={input} type="number" min={1} value={newHours} onChange={(e) => setNewHours(e.target.value)} placeholder="24" />
          </NeoField>
          <Button className={cn(btnGhost, "border-neo-red text-neo-red hover:bg-neo-red hover:text-white")} onClick={handleBlock} disabled={blocking || !newIp.trim()}>
            {blocking ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
            Block
          </Button>
        </div>
      </NeoCard>

      {/* ── Blocked IPs ────────────────────────────────────────────────── */}
      <NeoCard className="gap-0 p-0">
        <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold">
            <ShieldCheck className="size-4" />
            Blocked IPs
          </h2>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {blockedIps.length} active
          </span>
        </div>
        {blockedIps.length === 0 ? (
          <EmptyState
            title="No blocked IPs"
            description="Blocked addresses appear here — either auto-blocked by the fraud API or added by management."
          />
        ) : (
          <div className="flex flex-col divide-y-2 divide-foreground/10">
            {blockedIps.map((b) => (
              <div key={b._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-mono text-sm font-bold">
                    {b.ip}
                    <StatusBadge status={b.source === "auto" ? "urgent" : "pending"}>
                      {b.source === "auto" ? "Auto" : "Manual"}
                    </StatusBadge>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {b.reason}
                    {b.riskScore !== undefined ? ` · risk ${b.riskScore}` : ""} · blocked{" "}
                    {fmtRelative(b.blockedAt)}
                    {b.expiresAt ? ` · expires ${fmtRelative(b.expiresAt)}` : " · permanent"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className={cn(btnGhost, "shrink-0 border-neo-green text-neo-green hover:bg-neo-green hover:text-white")}
                  onClick={() => void handleUnblock(b.ip)}
                  disabled={unblocking === b.ip}
                >
                  {unblocking === b.ip ? <Loader2 className="size-4 animate-spin" /> : <Unlock className="size-4" />}
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        )}
      </NeoCard>

      {/* ── Recent blocked attempts ────────────────────────────────────── */}
      <NeoCard className="gap-0 p-0">
        <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold">
            <ShieldAlert className="size-4" />
            Blocked access attempts
          </h2>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            IP · location · risk · live
          </span>
        </div>
        {attempts.length === 0 ? (
          <EmptyState
            title="No blocked attempts yet"
            description="The moment someone unauthorized tries the management portal or an admin-only action, it appears here with their IP and location."
          />
        ) : (
          <div className="neo-shadow-none overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">Time</th>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">Reason</th>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">Account</th>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">IP</th>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">Location</th>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">Risk</th>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">Action</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((log) => (
                  <tr key={log._id} className="bg-card hover:bg-neo-yellow/10">
                    <td className="border-2 border-foreground/20 px-3 py-2.5 font-mono text-[10px] whitespace-nowrap text-muted-foreground">
                      {fmtRelative(log.createdAt)}
                    </td>
                    <td className="border-2 border-foreground/20 px-3 py-2.5">
                      <p className="max-w-[16rem] truncate text-xs font-bold">{log.reason}</p>
                      {log.path ? (
                        <p className="font-mono text-[10px] text-muted-foreground">{log.path}</p>
                      ) : null}
                    </td>
                    <td className="border-2 border-foreground/20 px-3 py-2.5 font-mono text-[10px] text-muted-foreground">
                      {log.email ?? "Not signed in"}
                    </td>
                    <td className="border-2 border-foreground/20 px-3 py-2.5 font-mono text-xs font-bold">
                      {log.ip ?? "—"}
                    </td>
                    <td className="border-2 border-foreground/20 px-3 py-2.5 text-xs text-muted-foreground">
                      {log.country || log.city ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 shrink-0" />
                          {[log.city, log.country].filter(Boolean).join(", ")}
                        </span>
                      ) : (
                        "Looking up…"
                      )}
                    </td>
                    <td className="border-2 border-foreground/20 px-3 py-2.5">
                      <RiskBadge score={log.riskScore} />
                      {log.flags && log.flags.length > 0 ? (
                        <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-wider text-neo-red">
                          {log.flags.join(" · ")}
                        </p>
                      ) : null}
                    </td>
                    <td className="border-2 border-foreground/20 px-3 py-2.5">
                      {log.ip ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(btnGhost, "h-8 border-neo-red px-2 text-[10px] font-bold uppercase tracking-wider text-neo-red hover:bg-neo-red hover:text-white")}
                          onClick={async () => {
                            try {
                              await blockIp({ ip: log.ip!, reason: `Blocked from a flagged attempt: ${log.reason.slice(0, 80)}` });
                              toast.success(`IP ${log.ip} blocked.`);
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Could not block the IP.");
                            }
                          }}
                        >
                          <Ban className="size-3" /> Block
                        </Button>
                      ) : (
                        <span className="font-mono text-[10px] text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NeoCard>
    </div>
  );
}
