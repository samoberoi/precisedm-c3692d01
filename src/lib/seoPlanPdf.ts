// Generate a downloadable SEO/AEO/GEO plan PDF for PreciseDM.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AutoTable = any;

export type PdfTask = {
  scheduled_date: string | null;
  section: string;
  category: string;
  deliverable_type: string | null;
  priority: string;
  title: string;
  description: string | null;
  target_url: string | null;
  target_keyword: string | null;
  status: string;
};

export type PdfBlog = {
  scheduled_date: string | null;
  slug: string;
  title: string;
  primary_keyword: string | null;
  secondary_keywords: string[] | null;
  meta_description: string | null;
  status: string;
};

const STATUS_LABEL: Record<string, string> = {
  todo: "Not started",
  in_progress: "In progress",
  done: "Completed",
  blocked: "Blocked",
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  deployed: "Deployed",
};

function fmtDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });
}

export async function generateSeoPlanPdf(opts: {
  tasks: PdfTask[];
  blogs: PdfBlog[];
  blogApprovalRequired: boolean;
  clientName?: string;
}): Promise<Blob> {
  const at: AutoTable = autoTable;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const TOP = 80;
  const BOTTOM = 60;
  const LEFT = 48;
  const RIGHT = 48;
  const contentW = pageW - LEFT - RIGHT;

  // Header band
  const drawHeader = () => {
    doc.setFillColor(88, 80, 160);
    doc.rect(0, 0, pageW, 48, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("PreciseDM — SEO / AEO / GEO Implementation Plan", LEFT, 30);
  };
  drawHeader();

  let y = TOP;
  doc.setTextColor(30, 30, 50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("30-Day Execution Plan", LEFT, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 110);
  doc.text(
    `Prepared for ${opts.clientName ?? "PreciseDM"}    Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`,
    LEFT, y,
  );
  y += 20;
  doc.setDrawColor(180, 180, 200);
  doc.line(LEFT, y, pageW - RIGHT, y);
  y += 16;

  const totalTasks = opts.tasks.length;
  const doneTasks = opts.tasks.filter((t) => t.status === "done").length;
  const totalBlogs = opts.blogs.length;
  const deployedBlogs = opts.blogs.filter((b) => b.status === "deployed").length;
  const dates = opts.tasks.map((t) => t.scheduled_date).filter(Boolean) as string[];
  const minD = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null;
  const maxD = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;

  doc.setFontSize(11);
  doc.setTextColor(40, 40, 60);
  doc.setFont("helvetica", "bold");
  doc.text("Engagement summary", LEFT, y); y += 14;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 80);
  const summaryLines = [
    `Plan window: ${minD ? fmtDate(minD) : "-"}  to  ${maxD ? fmtDate(maxD) : "-"}`,
    `Total scheduled tasks: ${totalTasks}    Completed: ${doneTasks}`,
    `Editorial pieces: ${totalBlogs}    Deployed: ${deployedBlogs}`,
    `Client approval gate for blogs: ${opts.blogApprovalRequired ? "ON (publish only after approval)" : "OFF (autonomous publishing)"}`,
  ];
  summaryLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, contentW);
    doc.text(wrapped, LEFT, y);
    y += wrapped.length * 13;
  });

  const byMonth = new Map<string, PdfTask[]>();
  for (const t of opts.tasks) {
    if (!t.scheduled_date) continue;
    const m = t.scheduled_date.slice(0, 7);
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m)!.push(t);
  }
  const months = Array.from(byMonth.keys()).sort();

  for (const m of months) {
    y += 16;
    const monthLabel = new Date(`${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    if (y + 40 > pageH - BOTTOM) { doc.addPage(); drawHeader(); y = TOP; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 50);
    doc.text(monthLabel, LEFT, y);
    y += 6;
    doc.setDrawColor(120, 120, 160);
    doc.line(LEFT, y, pageW - RIGHT, y);
    y += 10;

    const rows = byMonth.get(m)!.map((t) => [
      fmtDate(t.scheduled_date),
      t.section,
      t.title + (t.target_keyword ? `\nKeyword: ${t.target_keyword}` : "") + (t.target_url ? `\nPage: ${t.target_url}` : ""),
      (t.deliverable_type || t.category || "-"),
      STATUS_LABEL[t.status] ?? t.status,
    ]);

    at(doc, {
      startY: y,
      head: [["Date", "Channel", "Task", "Type", "Status"]],
      body: rows,
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 5, textColor: [40, 40, 60], lineColor: [220, 220, 230], lineWidth: 0.4 },
      headStyles: { fillColor: [88, 80, 160], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 248, 252] },
      columnStyles: {
        0: { cellWidth: 80 }, 1: { cellWidth: 50 },
        2: { cellWidth: contentW - 80 - 50 - 70 - 70 },
        3: { cellWidth: 70 }, 4: { cellWidth: 70 },
      },
      margin: { left: LEFT, right: RIGHT, top: TOP, bottom: BOTTOM },
      didDrawPage: () => { drawHeader(); },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  if (opts.blogs.length) {
    if (y + 80 > pageH - BOTTOM) { doc.addPage(); drawHeader(); y = TOP; }
    y += 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 50);
    doc.text("Editorial calendar", LEFT, y);
    y += 6;
    doc.setDrawColor(120, 120, 160);
    doc.line(LEFT, y, pageW - RIGHT, y);
    y += 10;

    const rows = opts.blogs.map((b) => [
      fmtDate(b.scheduled_date),
      b.title,
      b.primary_keyword ?? "-",
      STATUS_LABEL[b.status] ?? b.status,
    ]);
    at(doc, {
      startY: y,
      head: [["Publish date", "Article", "Primary keyword", "Status"]],
      body: rows,
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 5, textColor: [40, 40, 60], lineColor: [220, 220, 230], lineWidth: 0.4 },
      headStyles: { fillColor: [200, 90, 110], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [252, 248, 250] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: contentW - 100 - 140 - 80 },
        2: { cellWidth: 140 }, 3: { cellWidth: 80 },
      },
      margin: { left: LEFT, right: RIGHT, top: TOP, bottom: BOTTOM },
      didDrawPage: () => { drawHeader(); },
    });
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 160);
    doc.text(`Page ${i} of ${total}`, pageW - RIGHT, pageH - 30, { align: "right" });
    doc.text("PreciseDM — Confidential", LEFT, pageH - 30);
  }

  return doc.output("blob");
}
