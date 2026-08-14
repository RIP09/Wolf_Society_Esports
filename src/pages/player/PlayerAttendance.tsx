import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, NeoCard, PageHeader, StatCard, StatusBadge } from "@/components/neo";
import { LoadingScreen } from "@/components/Loading";
import { fmtDate } from "@/lib/format";
import { btnGhost, btnYellow, input, label, select } from "@/lib/neo";
import { useMutation, useQuery } from "convex/react";
import { CalendarCheck, CheckCircle2, Clock, History, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PlayerAttendance() {
  const status = useQuery(api.attendance.myStatus);
  const history = useQuery(api.attendance.myHistory);

  const [type, setType] = useState<"practice" | "match" | "other">("practice");
  const [attendanceStatus, setAttendanceStatus] = useState<"present" | "late">("present");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  const checkIn = useMutation(api.attendance.checkIn);
  const requestLeave = useMutation(api.attendance.requestLeave);

  if (!status || history === undefined) return <LoadingScreen label="Loading attendance…" />;

  const handleCheckIn = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await checkIn({ type, status: attendanceStatus, remarks: remarks || undefined });
      toast.success(attendanceStatus === "present" ? "Checked in — see you in the lobby!" : "Checked in as late — noted by management.");
      setRemarks("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Check-in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeave = async () => {
    if (leaveSubmitting) return;
    if (!leaveDate) {
      toast.error("Pick the date you need leave for.");
      return;
    }
    if (leaveReason.trim().length < 2) {
      toast.error("Add a short reason for your leave.");
      return;
    }
    setLeaveSubmitting(true);
    try {
      await requestLeave({ date: leaveDate, reason: leaveReason.trim() });
      toast.success("Leave requested — management can adjust it in The Den.");
      setLeaveDate("");
      setLeaveReason("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Leave request failed.");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const today = status.today;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Wolf Society Esports · The Pack"
        title="Daily Attendance"
        description="Check in every time you practice or play a match. The AI attendance system auto-marks you absent if you don't check in within 24 hours — management sees everything in real time."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today" value={today ? today.status : "—"} sub={today ? `Checked in at ${fmtDate(today.checkedInAt ?? 0)}` : "Not checked in yet"} accent={today && today.status !== "absent" ? "green" : "red"} />
        <StatCard label="Current streak" value={`${status.streaks.currentStreak}d`} sub={`${status.streaks.currentStreak === 0 ? "check in today to start a new one" : "days in a row attended"}`} accent="yellow" />
        <StatCard label="Best streak" value={`${status.streaks.bestStreak}d`} sub="your record run" accent="blue" />
        <StatCard label="Auto-misses" value={status.streaks.missedDays} sub="days AI marked you absent" accent="orange" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Check-in card */}
        <NeoCard className="gap-5 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center border-2 border-foreground bg-neo-green text-white">
              <CalendarCheck className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">{today ? "Update today's check-in" : "Check in for today"}</h2>
              <p className="text-xs text-muted-foreground">
                One check-in per day — you can update your remarks until midnight.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className={label}>What did you attend?</span>
              <Select value={type} onValueChange={(val) => setType(val as typeof type)}>
                <SelectTrigger className={select}>
                  <SelectValue placeholder="Practice / Match / Other" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="practice">Practice session</SelectItem>
                  <SelectItem value="match">Match / scrim</SelectItem>
                  <SelectItem value="other">Other (stream, VOD, event)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>On time?</span>
              <Select value={attendanceStatus} onValueChange={(val) => setAttendanceStatus(val as typeof attendanceStatus)}>
                <SelectTrigger className={select}>
                  <SelectValue placeholder="Present / Late" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present — on time</SelectItem>
                  <SelectItem value="late">Present — running late</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={label}>Remarks (optional)</span>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="What did you work on today? Any notes for your coach…"
              rows={4}
            />
          </div>

          <Button className={`${btnYellow} w-full`} onClick={handleCheckIn} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            {submitting ? "Submitting…" : today ? "Update my check-in" : "Check in now"}
          </Button>

          {today && today.source === "auto" ? (
            <p className="border-2 border-foreground bg-neo-cream px-3 py-2 text-xs font-bold text-foreground">
              This day was auto-marked absent by the AI attendance system.
            </p>
          ) : null}
        </NeoCard>

        {/* Leave request card */}
        <NeoCard className="gap-5 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center border-2 border-foreground bg-neo-blue text-white">
              <Clock className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Request a leave day</h2>
              <p className="text-xs text-muted-foreground">
                Sick, exams or an emergency? Mark the day as leave so it isn't counted as absent.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={label}>Date</span>
            <Input type="date" className={input} value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={label}>Reason</span>
            <Textarea
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="e.g. University exams, medical appointment…"
              rows={4}
            />
          </div>
          <Button className={`${btnGhost} w-full`} onClick={handleLeave} disabled={leaveSubmitting}>
            {leaveSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {leaveSubmitting ? "Submitting…" : "Request leave"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Management can approve, adjust or reject leave records from The Den → Attendance.
          </p>
        </NeoCard>
      </div>

      {/* History */}
      <NeoCard className="gap-0 p-0">
        <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold">
            <History className="size-4" />
            My attendance history
          </h2>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            last {history.length} days
          </span>
        </div>
        {history.length === 0 ? (
          <EmptyState
            title="No attendance yet"
            description="Check in for today's practice or match to start building your attendance record."
          />
        ) : (
          <div className="flex flex-col divide-y-2 divide-foreground/10">
            {history.map((record) => (
              <div key={record._id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{fmtDate(Date.parse(`${record.dateKey}T00:00:00Z`))}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {record.type} · {record.remarks ?? (record.source === "auto" ? "Auto-marked by AI attendance" : "No remarks")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={record.status}>{record.status}</StatusBadge>
                  <StatusBadge status={record.source}>{record.source === "auto" ? "AI" : "manual"}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </NeoCard>
    </div>
  );
}
