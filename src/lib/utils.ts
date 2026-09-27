import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return "Rs. 0";
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return "-";
  try {
    const d = typeof dateString === "string" ? parseISO(dateString) : dateString;
    return format(d, "MMM dd, yyyy");
  } catch {
    return String(dateString);
  }
}

export function formatDateTime(dateString: string | Date | undefined): string {
  if (!dateString) return "-";
  try {
    const d = typeof dateString === "string" ? parseISO(dateString) : dateString;
    return format(d, "MMM dd, yyyy · hh:mm a");
  } catch {
    return String(dateString);
  }
}

export function getInitials(name: string): string {
  if (!name) return "EZ";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((field) => {
            const val = row[field] === null || row[field] === undefined ? "" : String(row[field]);
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
