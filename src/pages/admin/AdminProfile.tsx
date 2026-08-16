import { api } from "@/convex/_generated/api";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingScreen } from "@/components/Loading";
import { NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { btnGhost, btnYellow, input, label } from "@/lib/neo";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  BadgeCheck,
  Copy,
  KeyRound,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminProfile() {
  const data = useQuery(api.staffProfile.myStaffProfile);
  const saveProfile = useMutation(api.staffProfile.updateMyStaffProfile);
  const changePassword = useAction(api.staffProfile.changeMyPassword);

  // Identity / mandatory + recommended fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  // Optional fields
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("");
  const [discord, setDiscord] = useState("");
  const [gameFocus, setGameFocus] = useState("");
  const [bio, setBio] = useState("");
  const [socials, setSocials] = useState("");

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  // Sync form state once the profile arrives.
  useEffect(() => {
    if (!data) return;
    setName(data.name);
    setEmail(data.email);
    setPhone(data.profile?.phone ?? "");
    setTitle(data.profile?.title ?? "");
    setLocation(data.profile?.location ?? "");
    setTimezone(data.profile?.timezone ?? "");
    setDiscord(data.profile?.discord ?? "");
    setGameFocus(data.profile?.gameFocus ?? "");
    setBio(data.profile?.bio ?? "");
    setSocials(data.profile?.socials ?? "");
  }, [data]);

  if (data === undefined) {
    return <LoadingScreen label="Loading your profile…" />;
  }

  const handleSave = async () => {
    if (saving) return;
    if (!name.trim()) {
      toast.error("Full name is required.");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    setSaving(true);
    try {
      await saveProfile({
        name,
        email,
        phone,
        title,
        location,
        timezone,
        discord,
        gameFocus,
        bio,
        socials,
      });
      toast.success("Profile saved — only you and the Super Admin can see these details.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwBusy) return;
    if (!currentPw) {
      toast.error("Enter your current password.");
      return;
    }
    if (newPw.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    setPwBusy(true);
    try {
      await changePassword({ currentPassword: currentPw, newPassword: newPw });
      toast.success("Password updated. Your new password is active now and is never recorded in any log.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change the password.");
    } finally {
      setPwBusy(false);
    }
  };

  const copyUserId = async () => {
    if (!data.loginId) return;
    try {
      await navigator.clipboard.writeText(data.loginId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy — copy it manually.");
    }
  };

  const field = (key: string, value: string, setter: (v: string) => void, placeholder: string, type = "text") => (
    <div key={key} className="flex flex-col gap-1.5">
      <span className={label}>{key}</span>
      <Input
        type={type}
        className={input}
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Wolf Society Esports · The Den"
        title="My Profile"
        description="Your identity and login details. The User ID is assigned by the organization and cannot be changed — your email and everything else is fully editable. Edited details are private: only you and the Super Admin can see them."
      />

      {/* Identity card */}
      <NeoCard className="gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
              <UserRound className="size-6" />
            </span>
            <div>
              <p className="text-lg font-bold">{data.name || "Staff member"}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {data.role === "superadmin" ? "Super Admin" : "Management"} · The Den
              </p>
            </div>
          </div>
          {data.role === "superadmin" ? (
            <StatusBadge status="superadmin">
              <ShieldCheck className="size-3" />
              Super Admin
            </StatusBadge>
          ) : (
            <StatusBadge status="admin">Manager</StatusBadge>
          )}
        </div>

        <div className="grid gap-4 border-t-2 border-foreground/20 pt-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className={label}>User ID (organisation-given — cannot be changed)</span>
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center justify-between border-2 border-foreground bg-neo-cream px-3 py-2">
                <span className="font-mono text-sm font-bold">{data.loginId ?? "—"}</span>
                {data.loginId ? (
                  <button
                    type="button"
                    onClick={copyUserId}
                    className="ml-2 flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    title="Copy User ID"
                  >
                    {copied ? <BadgeCheck className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={label}>Login role</span>
            <div className="border-2 border-foreground bg-background px-3 py-2">
              <span className="font-mono text-sm font-bold">
                {data.role === "superadmin" ? "Super Admin (full control)" : "Manager (granted role)"}
              </span>
            </div>
          </div>
        </div>
      </NeoCard>

      {/* Editable details */}
      <NeoCard className="gap-4 p-6">
        <div className="flex items-center gap-2">
          <Save className="size-5" />
          <h2 className="font-bold">Your details</h2>
        </div>

        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Mandatory · required for your record
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("Full name", name, setName, "Alex Rivera")}
          {field("Email (can be changed)", email, setEmail, "you@example.com", "email")}
        </div>

        <p className="border-t-2 border-foreground/20 pt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Recommended · helps the organization reach you
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("Phone / WhatsApp", phone, setPhone, "+91 98765 43210")}
          {field("Title / designation (optional)", title, setTitle, "Team Manager, Analyst…")}
        </div>

        <p className="border-t-2 border-foreground/20 pt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Optional · the rest of your profile
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("Location / country", location, setLocation, "India, Mumbai…")}
          {field("Timezone", timezone, setTimezone, "IST (UTC+5:30)…")}
          {field("Discord username", discord, setDiscord, "wolf_river#0001")}
          {field("Game focus", gameFocus, setGameFocus, "Valorant, CS2…")}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={label}>Bio / about you</span>
          <Textarea
            className="min-h-20 rounded-none border-2 border-foreground bg-background"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short line about your role and responsibilities…"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={label}>Socials / links</span>
          <Textarea
            className="min-h-16 rounded-none border-2 border-foreground bg-background"
            value={socials}
            onChange={(e) => setSocials(e.target.value)}
            placeholder="Twitter / X, LinkedIn, Twitch, YouTube…"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-foreground/20 pt-4">
          <p className="text-xs text-muted-foreground">
            🔒 These details are visible only to <strong className="text-foreground">you</strong> and the{" "}
            <strong className="text-foreground">Super Admin</strong> — other staff members never see them.
          </p>
          <Button className={btnYellow} onClick={handleSave} disabled={saving || !name.trim() || !email.trim()}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? "Saving…" : "Save details"}
          </Button>
        </div>
      </NeoCard>

      {/* Password */}
      <NeoCard className="gap-4 p-6">
        <div className="flex items-center gap-2">
          <Lock className="size-5" />
          <h2 className="font-bold">Change password</h2>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Your User ID stays the same — only the password changes. Enter your current password to confirm,
          then set a new one (at least 8 characters). Passwords are hashed and{" "}
          <strong className="text-foreground">never appear in any log, email or notification</strong>.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <span className={label}>Current password</span>
            <PasswordInput value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={label}>New password</span>
            <PasswordInput value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={label}>Confirm new password</span>
            <PasswordInput value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-foreground/20 pt-4">
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <KeyRound className="size-3.5" />
            The security log only records that a password was changed — never the password itself.
          </p>
          <Button
            variant="outline"
            className={btnGhost}
            onClick={handleChangePassword}
            disabled={pwBusy || !currentPw || !newPw || !confirmPw}
          >
            {pwBusy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            {pwBusy ? "Updating…" : "Update password"}
          </Button>
        </div>
      </NeoCard>

      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <ShieldCheck className="size-3.5" />
        Management portal · Wolf Society Esports · Your details stay private
      </p>
    </div>
  );
}
