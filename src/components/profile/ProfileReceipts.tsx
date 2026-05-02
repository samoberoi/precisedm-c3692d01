import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Receipt, Download, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ReceiptRow {
  id: string;
  receipt_number: string;
  plan_type: string;
  amount: number;
  currency: string;
  payment_date: string;
  email_sent_at: string | null;
}

interface Props {
  userId?: string;
}

const ProfileReceipts = ({ userId }: Props) => {
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select("id, receipt_number, plan_type, amount, currency, payment_date, email_sent_at")
        .eq("user_id", userId)
        .order("payment_date", { ascending: false });
      if (!error && data) setReceipts(data as ReceiptRow[]);
      setLoading(false);
    })();
  }, [userId]);

  const handleDownload = async (id: string, number: string) => {
    setDownloadingId(id);
    try {
      const { data, error } = await supabase
        .from("receipts")
        .select("pdf_base64")
        .eq("id", id)
        .single();
      if (error || !data?.pdf_base64) throw error || new Error("No PDF found");

      const binary = atob(data.pdf_base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PreciseDM-Receipt-${number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: "Download failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="mt-4 rounded-2xl bg-card border border-border shadow-sm p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Receipt className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">Payment Receipts</h2>
      </div>

      {receipts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No receipts yet. They'll appear here after your first payment.
        </p>
      ) : (
        <div className="space-y-2">
          {receipts.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/50 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-foreground">#{r.receipt_number}</p>
                  {r.email_sent_at && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 font-semibold">
                      <Mail className="h-3 w-3" /> Emailed
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                  {r.plan_type} • {new Date(r.payment_date).toLocaleDateString()} • {r.currency}{" "}
                  {Number(r.amount).toFixed(2)}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl gap-1.5 h-9"
                onClick={() => handleDownload(r.id, r.receipt_number)}
                disabled={downloadingId === r.id}
              >
                <Download className="h-3.5 w-3.5" />
                {downloadingId === r.id ? "..." : "PDF"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ProfileReceipts;
