import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  const getStyle = () => {
    switch (normalized) {
      case "present":
      case "completed":
      case "paid":
      case "confirmed":
      case "active":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";

      case "in-progress":
      case "scheduled":
      case "pending":
      case "approved":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";

      case "absent":
      case "cancelled":
      case "inactive":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";

      case "leave":
      case "half-day":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";

      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/30";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize tracking-wide",
        getStyle(),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status.replace("-", " ")}
    </span>
  );
}
