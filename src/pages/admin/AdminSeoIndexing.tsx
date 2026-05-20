import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, RefreshCw, Send, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

type LogRow = {
  id: string;
  url: string;
  action: string;
  source: string | null;
  status: string;
  http_status: number | null;
  error: string | null;
  pinged_at: string;
};

export default function AdminSeoIndexing() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [needsReconnect, setNeedsReconnect] = useState(false);

  async function loadLogs() {
    setLoading(true);
    const { data, error } = await supabase
      .from("seo_indexing_log")
      .select("*")
      .order("pinged_at", { ascending: false })
      .limit(50);
    if (error) toast.error(error.message);
    const logs = (data ?? []) as LogRow[];
    setRows(logs);
    const latestPermissionSignal = logs.find(
      (r) => r.status === "success" || r.error === "missing_indexing_scope",
    );
    setNeedsReconnect(latestPermissionSignal?.error === "missing_indexing_scope");
    setLoading(false);
  }

  useEffect(() => { loadLogs(); }, []);

  async function pingUrl(url: string) {
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Enter a full URL starting with https://");
      return;
    }
    setPinging(true);
    const { data, error } = await supabase.functions.invoke("seo-indexing-ping", {
      body: { url, action: "URL_UPDATED", source: "manual" },
    });
    setPinging(false);
    if (error) {
      toast.error(error.message);
    } else if ((data as { error?: string })?.error === "missing_indexing_scope") {
      setNeedsReconnect(true);
      toast.error("Reconnect Google to grant Indexing scope");
    } else if ((data as { ok?: boolean })?.ok) {
      setNeedsReconnect(false);
      toast.success("Pinged Google");
    } else {
      toast.error((data as { error?: string })?.error ?? "Ping failed");
    }
    await loadLogs();
  }

  async function reconnect() {
    setReconnecting(true);
    const { data, error } = await supabase.functions.invoke("seo-google-oauth-start", {
      body: { returnTo: window.location.origin + "/admin/seo" },
    });
    setReconnecting(false);
    if (error || !(data as { url?: string })?.url) {
      toast.error(error?.message ?? "Failed to start reconnect");
      return;
    }
    window.location.href = (data as { url: string }).url;
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Send className="h-4 w-4" /> Google Indexing API
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            New blogs and page updates are auto-pinged to Google when published.
            Pings happen in the background and never block your saves.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      {needsReconnect && (
        <div className="flex items-start gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <div className="font-medium">Reconnect Google to enable indexing</div>
            <div className="text-muted-foreground">
              Your existing connection doesn't include the indexing permission. Click reconnect and approve it once.
            </div>
          </div>
          <Button size="sm" onClick={reconnect} disabled={reconnecting}>
            {reconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reconnect Google"}
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="https://www.precisedm.com/blog/your-slug"
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
        />
        <Button onClick={() => pingUrl(manualUrl)} disabled={pinging || !manualUrl}>
          {pinging ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ping URL"}
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="grid grid-cols-[1fr_90px_140px_160px] text-xs font-medium bg-muted/40 px-3 py-2">
          <div>URL</div><div>Status</div><div>Source</div><div>When</div>
        </div>
        <div className="max-h-[420px] overflow-auto divide-y">
          {rows.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">No pings yet.</div>
          )}
          {rows.map((r) => (
            <div key={r.id} className="grid grid-cols-[1fr_90px_140px_160px] px-3 py-2 text-xs items-center">
              <div className="truncate" title={r.url}>{r.url}</div>
              <div>
                {r.status === "success" ? (
                  <Badge variant="outline" className="border-green-500/40 text-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> ok
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-red-500/40 text-red-600" title={r.error ?? ""}>
                    <XCircle className="h-3 w-3 mr-1" /> {r.status}
                  </Badge>
                )}
              </div>
              <div className="truncate text-muted-foreground" title={r.source ?? ""}>{r.source ?? "—"}</div>
              <div className="text-muted-foreground">{new Date(r.pinged_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
