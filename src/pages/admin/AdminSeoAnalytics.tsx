// Analytics tab — Google Search Console + GA4 metrics with OAuth.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, LinkIcon, AlertCircle, TrendingUp, TrendingDown, Smartphone, Monitor, Tablet, Globe, Search, Users, Eye, Activity } from "lucide-react";
import { toast } from "sonner";

type Range = { startDate: string; endDate: string; compareStart: string | null; compareEnd: string | null; label: string };

function ymd(d: Date) { return d.toISOString().slice(0, 10); }
function daysAgo(n: number) { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d; }

const RANGE_PRESETS: Record<string, () => Range> = {
  today_vs_yesterday: () => {
    const today = new Date(); const y = daysAgo(1); const dby = daysAgo(2);
    return { startDate: ymd(today), endDate: ymd(today), compareStart: ymd(y), compareEnd: ymd(y), label: "Today vs Yesterday" };
  },
  yesterday_vs_prior: () => {
    return { startDate: ymd(daysAgo(1)), endDate: ymd(daysAgo(1)), compareStart: ymd(daysAgo(2)), compareEnd: ymd(daysAgo(2)), label: "Yesterday vs day before" };
  },
  last_7_vs_prior: () => ({
    startDate: ymd(daysAgo(7)), endDate: ymd(daysAgo(1)),
    compareStart: ymd(daysAgo(14)), compareEnd: ymd(daysAgo(8)),
    label: "Last 7 days vs prior 7",
  }),
  last_28_vs_prior: () => ({
    startDate: ymd(daysAgo(28)), endDate: ymd(daysAgo(1)),
    compareStart: ymd(daysAgo(56)), compareEnd: ymd(daysAgo(29)),
    label: "Last 28 days vs prior 28",
  }),
  last_90: () => ({
    startDate: ymd(daysAgo(90)), endDate: ymd(daysAgo(1)),
    compareStart: null, compareEnd: null,
    label: "Last 90 days",
  }),
};

type Integration = {
  id: string; provider: string; property_url: string | null;
  connected_at: string; last_refreshed_at: string | null; last_error: string | null;
  connected_by_user_id: string | null;
};

export default function AdminSeoAnalytics() {
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [loadingInteg, setLoadingInteg] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [rangeKey, setRangeKey] = useState("last_28_vs_prior");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const range = useMemo(() => RANGE_PRESETS[rangeKey](), [rangeKey]);

  async function loadIntegration() {
    setLoadingInteg(true);
    const { data: row } = await supabase
      .from("seo_integrations")
      .select("id,provider,property_url,connected_at,last_refreshed_at,last_error,connected_by_user_id")
      .eq("provider", "google")
      .maybeSingle();
    setIntegration(row as Integration | null);
    setLoadingInteg(false);
  }

  useEffect(() => {
    loadIntegration();
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "connected") {
      toast.success("Google connected");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("google") === "error") {
      toast.error(`Google connect failed: ${params.get("reason") ?? "unknown"}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function fetchData() {
    if (!integration) return;
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("seo-google-analytics-fetch", {
        body: {
          startDate: range.startDate, endDate: range.endDate,
          compareStart: range.compareStart, compareEnd: range.compareEnd,
        },
      });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((res as any)?.error) throw new Error((res as any).error);
      setData(res);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (integration) fetchData(); /* eslint-disable-next-line */ }, [integration?.id, rangeKey]);

  async function connect() {
    setConnecting(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("seo-google-oauth-start", {
        body: { returnTo: window.location.origin + "/admin/seo" },
      });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const url = (res as any)?.url;
      if (!url) throw new Error("No URL");
      window.location.href = url;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to start OAuth");
      setConnecting(false);
    }
  }

  async function disconnect() {
    if (!integration) return;
    if (!confirm("Disconnect Google? You will lose access to GSC and GA4 data until you reconnect.")) return;
    const { error } = await supabase.from("seo_integrations").delete().eq("id", integration.id);
    if (error) { toast.error(error.message); return; }
    setIntegration(null); setData(null); toast.success("Disconnected");
  }

  if (loadingInteg) return <Card className="p-10 text-center"><Loader2 className="h-5 w-5 mx-auto animate-spin" /></Card>;

  if (!integration) {
    return (
      <Card className="p-10 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <LinkIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Connect Google to see live analytics</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            One sign-in grants read access to Search Console and GA4. Refresh tokens don't expire so you only do this once.
          </p>
        </div>
        <Button onClick={connect} disabled={connecting} size="lg">
          {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LinkIcon className="h-4 w-4 mr-2" />}
          Connect Google account
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap items-center gap-3 text-sm">
        <Badge variant="outline" className="bg-emerald-50">Connected</Badge>
        <span className="text-muted-foreground">
          Site: <span className="font-medium text-foreground">{integration.property_url ?? "—"}</span>
        </span>
        {integration.last_error && (
          <span className="text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{integration.last_error}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Select value={rangeKey} onValueChange={setRangeKey}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today_vs_yesterday">Today vs Yesterday</SelectItem>
              <SelectItem value="yesterday_vs_prior">Yesterday vs day before</SelectItem>
              <SelectItem value="last_7_vs_prior">Last 7d vs prior 7</SelectItem>
              <SelectItem value="last_28_vs_prior">Last 28d vs prior 28</SelectItem>
              <SelectItem value="last_90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={connect}>Reconnect</Button>
          <Button size="sm" variant="ghost" onClick={disconnect}>Disconnect</Button>
        </div>
      </Card>

      <div className="text-xs text-muted-foreground">
        Range: <span className="font-medium">{range.startDate}</span> → <span className="font-medium">{range.endDate}</span>
        {range.compareStart && <> · vs <span className="font-medium">{range.compareStart}</span> → <span className="font-medium">{range.compareEnd}</span></>}
      </div>

      {loading && <Card className="p-10 text-center"><Loader2 className="h-5 w-5 mx-auto animate-spin" /></Card>}

      {!loading && data && (
        <>
          {data.ga4 ? (
            <Section icon={<Users className="h-4 w-4" />} title="Audience (GA4)">
              <Ga4Kpis ga4={data.ga4} />
            </Section>
          ) : (
            <Card className="p-4 text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              GA4 not configured (missing GA4_PROPERTY_ID).
            </Card>
          )}

          <Section icon={<Search className="h-4 w-4" />} title="Search Console">
            <GscKpis totals={data.gsc.totals} prev={data.gsc.totalsPrev} />
          </Section>

          <div className="grid md:grid-cols-2 gap-4">
            {data.ga4 && (
              <Section icon={<Smartphone className="h-4 w-4" />} title="Device (GA4 users)">
                <DeviceBars rows={data.ga4.device} keyName="Users" valueIdx={0} />
              </Section>
            )}
            <Section icon={<Smartphone className="h-4 w-4" />} title="Device (GSC clicks)">
              <GscDeviceBars rows={data.gsc.device} />
            </Section>
          </div>

          {data.ga4 && (
            <div className="grid md:grid-cols-2 gap-4">
              <Section icon={<Activity className="h-4 w-4" />} title="Top traffic sources (GA4)">
                <SimpleTable
                  headers={["Channel", "Sessions", "Users"]}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  rows={(data.ga4.sources ?? []).map((r: any) => [
                    r.dimensionValues?.[0]?.value ?? "—",
                    r.metricValues?.[0]?.value ?? "0",
                    r.metricValues?.[1]?.value ?? "0",
                  ])}
                />
              </Section>
              <Section icon={<Eye className="h-4 w-4" />} title="Top landing pages (GA4)">
                <SimpleTable
                  headers={["Path", "Views", "Users"]}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  rows={(data.ga4.pages ?? []).map((r: any) => [
                    r.dimensionValues?.[0]?.value ?? "—",
                    r.metricValues?.[0]?.value ?? "0",
                    r.metricValues?.[1]?.value ?? "0",
                  ])}
                />
              </Section>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Section icon={<Search className="h-4 w-4" />} title="Top search queries (GSC)">
              <SimpleTable
                headers={["Query", "Clicks", "Impr.", "CTR", "Pos."]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                rows={(data.gsc.queries ?? []).map((r: any) => [
                  r.keys?.[0] ?? "—",
                  String(r.clicks ?? 0),
                  String(r.impressions ?? 0),
                  `${((r.ctr ?? 0) * 100).toFixed(1)}%`,
                  (r.position ?? 0).toFixed(1),
                ])}
              />
            </Section>
            <Section icon={<Globe className="h-4 w-4" />} title="Top landing URLs (GSC)">
              <SimpleTable
                headers={["URL", "Clicks", "Impr.", "CTR", "Pos."]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                rows={(data.gsc.pages ?? []).map((r: any) => [
                  shortUrl(r.keys?.[0] ?? ""),
                  String(r.clicks ?? 0),
                  String(r.impressions ?? 0),
                  `${((r.ctr ?? 0) * 100).toFixed(1)}%`,
                  (r.position ?? 0).toFixed(1),
                ])}
              />
            </Section>
          </div>

          <Section icon={<Globe className="h-4 w-4" />} title="Top countries (GSC)">
            <SimpleTable
              headers={["Country", "Clicks", "Impr.", "CTR", "Pos."]}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              rows={(data.gsc.country ?? []).map((r: any) => [
                (r.keys?.[0] ?? "—").toUpperCase(),
                String(r.clicks ?? 0),
                String(r.impressions ?? 0),
                `${((r.ctr ?? 0) * 100).toFixed(1)}%`,
                (r.position ?? 0).toFixed(1),
              ])}
            />
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</div>
      {children}
    </Card>
  );
}

function Delta({ now, prev, invert = false }: { now: number; prev: number | null | undefined; invert?: boolean }) {
  if (prev == null || prev === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const pct = ((now - prev) / prev) * 100;
  const positive = invert ? pct < 0 : pct > 0;
  return (
    <span className={`text-xs flex items-center gap-0.5 ${positive ? "text-emerald-600" : "text-red-600"}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

function Kpi({ label, value, prev, fmt, invert }: { label: string; value: number; prev?: number | null; fmt?: (n: number) => string; invert?: boolean }) {
  const f = fmt ?? ((n: number) => n.toLocaleString());
  return (
    <div className="rounded-lg border p-3 space-y-1 bg-card">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{f(value)}</div>
      {prev != null && <Delta now={value} prev={prev} invert={invert} />}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Ga4Kpis({ ga4 }: { ga4: any }) {
  const t = ga4.totals?.metricValues ?? [];
  const p = ga4.totalsPrev?.metricValues;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const num = (i: number, src: any[]) => Number(src?.[i]?.value ?? 0);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Kpi label="Total users" value={num(0, t)} prev={p ? num(0, p) : null} />
      <Kpi label="New users" value={num(1, t)} prev={p ? num(1, p) : null} />
      <Kpi label="Sessions" value={num(2, t)} prev={p ? num(2, p) : null} />
      <Kpi label="Page views" value={num(3, t)} prev={p ? num(3, p) : null} />
      <Kpi label="Avg session (s)" value={Math.round(num(4, t))} prev={p ? Math.round(num(4, p)) : null} />
      <Kpi label="Engagement rate" value={num(5, t) * 100} prev={p ? num(5, p) * 100 : null} fmt={(n) => `${n.toFixed(1)}%`} />
      <Kpi label="Bounce rate" value={num(6, t) * 100} prev={p ? num(6, p) * 100 : null} fmt={(n) => `${n.toFixed(1)}%`} invert />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GscKpis({ totals, prev }: { totals: any; prev: any }) {
  const clicks = totals?.clicks ?? 0;
  const impr = totals?.impressions ?? 0;
  const ctr = (totals?.ctr ?? 0) * 100;
  const pos = totals?.position ?? 0;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Kpi label="Clicks" value={clicks} prev={prev?.clicks} />
      <Kpi label="Impressions" value={impr} prev={prev?.impressions} />
      <Kpi label="CTR" value={ctr} prev={prev ? (prev.ctr ?? 0) * 100 : null} fmt={(n) => `${n.toFixed(2)}%`} />
      <Kpi label="Avg position" value={pos} prev={prev?.position} fmt={(n) => n.toFixed(1)} invert />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DeviceBars({ rows, keyName, valueIdx }: { rows: any[]; keyName: string; valueIdx: number }) {
  const total = rows.reduce((s, r) => s + Number(r.metricValues?.[valueIdx]?.value ?? 0), 0) || 1;
  if (!rows.length) return <div className="text-sm text-muted-foreground">No data.</div>;
  return (
    <div className="space-y-2">
      {rows.map((r, i) => {
        const name = r.dimensionValues?.[0]?.value ?? "—";
        const val = Number(r.metricValues?.[valueIdx]?.value ?? 0);
        const pct = (val / total) * 100;
        return (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="capitalize flex items-center gap-1">{deviceIcon(name)}{name}</span>
              <span className="text-muted-foreground">{val.toLocaleString()} {keyName} · {pct.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GscDeviceBars({ rows }: { rows: any[] }) {
  const total = rows.reduce((s, r) => s + (r.clicks ?? 0), 0) || 1;
  if (!rows.length) return <div className="text-sm text-muted-foreground">No data.</div>;
  return (
    <div className="space-y-2">
      {rows.map((r, i) => {
        const name = (r.keys?.[0] ?? "—").toLowerCase();
        const val = r.clicks ?? 0;
        const pct = (val / total) * 100;
        return (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="capitalize flex items-center gap-1">{deviceIcon(name)}{name}</span>
              <span className="text-muted-foreground">{val} clicks · {pct.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function deviceIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("mobile")) return <Smartphone className="h-3 w-3" />;
  if (n.includes("tablet")) return <Tablet className="h-3 w-3" />;
  return <Monitor className="h-3 w-3" />;
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (!rows.length) return <div className="text-sm text-muted-foreground">No data.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-left text-muted-foreground">
          <tr>{headers.map((h, i) => <th key={i} className="px-2 py-1 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.slice(0, 15).map((r, i) => (
            <tr key={i} className="border-t">
              {r.map((c, j) => <td key={j} className="px-2 py-1 truncate max-w-[20rem]" title={c}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function shortUrl(u: string) {
  try { return new URL(u).pathname || "/"; } catch { return u; }
}
