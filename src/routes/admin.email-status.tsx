import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { getOtpEmailStatus } from "@/lib/email-status.functions";
import { getDomainStatus, type DnsCheck } from "@/lib/domain-status.functions";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, MailCheck, ShieldCheck, ShieldAlert, Globe } from "lucide-react";

export const Route = createFileRoute("/admin/email-status")({
  component: EmailStatusPage,
  head: () => ({ meta: [{ title: "Email Status · Admin · FastCredit" }] }),
});

function EmailStatusPage() {
  const fn = useServerFn(getOtpEmailStatus);
  const domainFn = useServerFn(getDomainStatus);
  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["otp-email-status"],
    queryFn: () => fn(),
    refetchInterval: 60_000,
  });
  const domain = useQuery({
    queryKey: ["otp-domain-status"],
    queryFn: () => domainFn(),
    refetchInterval: 60_000,
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold">OTP Email Status</h2>
            <p className="text-xs text-slate-500">Live health of the sender domain and OTP delivery.</p>
          </div>
          <button
            onClick={() => { refetch(); domain.refetch(); }}
            className="h-9 px-3 rounded-full bg-white/80 border border-white shadow-sm flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${(isFetching || domain.isFetching) ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <DomainVerificationCard
          loading={domain.isLoading}
          error={domain.error ? (domain.error as Error).message : undefined}
          data={domain.data}
        />

        {isLoading && <div className="rounded-2xl bg-white/70 border border-white p-6 text-sm text-slate-500">Checking…</div>}
        {error && <ErrorCard message={(error as Error).message} />}
        {data?.error && <ErrorCard message={data.error} />}

        {data && (
          <>
            <DomainCard verified={data.verified} domain={data.senderDomain} />
            <StatsGrid totals={data.totals} windowHours={data.windowHours} />
            <RecentList recent={data.recent} />
            <p className="text-[11px] text-slate-500 text-center">
              Last checked {new Date(data.checkedAt).toLocaleString()}
              {data.historyStartsAt && ` · retention since ${new Date(data.historyStartsAt).toLocaleDateString()}`}
            </p>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function DomainVerificationCard({
  loading,
  error,
  data,
}: {
  loading: boolean;
  error?: string;
  data?: Awaited<ReturnType<typeof getDomainStatus>>;
}) {
  if (loading) return <div className="rounded-2xl bg-white/70 border border-white p-6 text-sm text-slate-500">Checking DNS…</div>;
  if (error) return <ErrorCard message={error} />;
  if (!data) return null;

  const tone =
    data.overall === "active"
      ? { bg: "bg-emerald-500", label: "Active" }
      : data.overall === "failed"
      ? { bg: "bg-red-500", label: "Failed" }
      : { bg: "bg-amber-500", label: "Pending" };

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur border border-white p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className={`h-12 w-12 rounded-2xl ${tone.bg} flex items-center justify-center text-white shadow`}>
          <Globe className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold">Sender domain</div>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white ${tone.bg}`}>{tone.label}</span>
          </div>
          <div className="text-xs text-slate-500 truncate">{data.senderDomain}</div>
          <div className="text-xs text-slate-700 mt-1">{data.summary}</div>
        </div>
      </div>

      {data.failureReason && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-700 flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div><span className="font-semibold">Failure reason:</span> {data.failureReason}</div>
        </div>
      )}

      <div className="space-y-2">
        {data.checks.map((c) => <DnsCheckRow key={c.name} check={c} />)}
      </div>
      <p className="text-[11px] text-slate-400">DNS checked {new Date(data.checkedAt).toLocaleString()}</p>
    </div>
  );
}

function DnsCheckRow({ check }: { check: DnsCheck }) {
  const Icon = check.ok ? CheckCircle2 : XCircle;
  const tone = check.ok ? "text-emerald-600" : "text-red-600";
  return (
    <div className="rounded-xl border border-slate-100 bg-white/70 p-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${tone}`} />
        <div className="text-xs font-semibold text-slate-800 flex-1">{check.name}</div>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{check.type}</span>
      </div>
      <div className="mt-2 text-[11px] text-slate-500 font-mono break-all">Host: {check.host}</div>
      <div className="mt-1 text-[11px]">
        <div className="text-slate-500">Expected:</div>
        <ul className="font-mono break-all text-slate-700">
          {check.expected.map((v) => <li key={v}>• {v}</li>)}
        </ul>
      </div>
      <div className="mt-1 text-[11px]">
        <div className="text-slate-500">Found:</div>
        {check.found.length === 0 ? (
          <div className="font-mono text-red-600">— none —</div>
        ) : (
          <ul className="font-mono break-all text-slate-700">
            {check.found.map((v, i) => <li key={i}>• {v}</li>)}
          </ul>
        )}
      </div>
      {check.note && (
        <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">{check.note}</div>
      )}
    </div>
  );
}

function DomainCard({ verified, domain }: { verified: boolean | null; domain: string }) {
  const state =
    verified === true
      ? { Icon: ShieldCheck, tone: "bg-emerald-500", label: "Verified & delivering", sub: "Sender domain is active and OTP emails are being sent." }
      : verified === false
      ? { Icon: ShieldAlert, tone: "bg-amber-500", label: "No recent sends", sub: "No OTP emails have been sent recently. Domain may still be verifying DNS." }
      : { Icon: ShieldAlert, tone: "bg-slate-400", label: "Status unavailable", sub: "Could not read email logs." };

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur border border-white p-5 shadow-sm flex items-center gap-4">
      <div className={`h-12 w-12 rounded-2xl ${state.tone} flex items-center justify-center text-white shadow`}> 
        <state.Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-slate-900">{state.label}</div>
        <div className="text-xs text-slate-500 truncate">{state.sub}</div>
        <div className="text-[11px] text-slate-400 mt-0.5 truncate">Sender: {domain}</div>
      </div>
    </div>
  );
}

function StatsGrid({ totals, windowHours }: { totals: Record<string, number>; windowHours: number }) {
  const items = [
    { k: "sent", label: "Delivered", tone: "text-emerald-600 bg-emerald-50 border-emerald-100", Icon: CheckCircle2 },
    { k: "bounced", label: "Bounced", tone: "text-red-600 bg-red-50 border-red-100", Icon: XCircle },
    { k: "rejected", label: "Rejected", tone: "text-red-600 bg-red-50 border-red-100", Icon: XCircle },
    { k: "suppressed", label: "Suppressed", tone: "text-amber-700 bg-amber-50 border-amber-100", Icon: AlertTriangle },
    { k: "rate_limited", label: "Rate limited", tone: "text-amber-700 bg-amber-50 border-amber-100", Icon: AlertTriangle },
    { k: "complained", label: "Complaints", tone: "text-red-600 bg-red-50 border-red-100", Icon: AlertTriangle },
  ];
  return (
    <div>
      <div className="text-xs text-slate-500 mb-2 px-1">Last {windowHours}h · OTP-related events</div>
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ k, label, tone, Icon }) => (
          <div key={k} className={`rounded-2xl border ${tone} p-3`}>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
              <Icon className="h-3.5 w-3.5" /> {label}
            </div>
            <div className="text-xl font-extrabold mt-1">{totals[k] ?? 0}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentList({ recent }: { recent: Array<{ timestamp: string; recipient: string; event_type: string; status?: string; tag?: string }> }) {
  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur border border-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <MailCheck className="h-4 w-4 text-slate-600" />
        <div className="text-sm font-bold">Recent OTP emails</div>
      </div>
      {recent.length === 0 ? (
        <div className="text-xs text-slate-500 py-6 text-center">No OTP email events in the window yet.</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {recent.map((e, i) => (
            <li key={i} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">{e.recipient}</div>
                <div className="text-[11px] text-slate-500">
                  {new Date(e.timestamp).toLocaleString()} {e.tag && `· ${e.tag}`}
                </div>
              </div>
              <EventBadge type={e.event_type} status={e.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EventBadge({ type, status }: { type: string; status?: string }) {
  const tone =
    type === "sent"
      ? "bg-emerald-100 text-emerald-700"
      : type === "bounced" || type === "rejected" || type === "complained"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700";
  return (
    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${tone}`}>
      {type}
      {status ? ` · ${status}` : ""}
    </span>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700 flex gap-2">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
      <div>
        <div className="font-semibold">Could not read email status</div>
        <div className="text-xs mt-0.5">{message}</div>
      </div>
    </div>
  );
}
