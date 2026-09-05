"use client";

import React from "react";
import { Calendar, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  className,
}: DateRangePickerProps) {
  const setPreset = (preset: "today" | "week" | "month" | "year" | "all") => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (preset === "today") {
      onRangeChange(todayStr, todayStr);
    } else if (preset === "week") {
      const past7 = new Date();
      past7.setDate(today.getDate() - 7);
      onRangeChange(past7.toISOString().split("T")[0], todayStr);
    } else if (preset === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      onRangeChange(firstDay.toISOString().split("T")[0], todayStr);
    } else if (preset === "year") {
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      onRangeChange(firstDayOfYear.toISOString().split("T")[0], todayStr);
    } else if (preset === "all") {
      onRangeChange("2024-01-01", todayStr);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2.5 p-2 bg-dark-card/90 border border-slate-700/60 rounded-2xl backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-2">
        <Filter className="w-3.5 h-3.5 text-clinic-400" />
        <span className="font-semibold uppercase tracking-wider">Period:</span>
      </div>

      {/* Quick Buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPreset("today")}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setPreset("week")}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          7 Days
        </button>
        <button
          type="button"
          onClick={() => setPreset("month")}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-clinic-500/20 border border-clinic-500/40 text-clinic-200 hover:bg-clinic-500/30 transition-colors"
        >
          This Month
        </button>
        <button
          type="button"
          onClick={() => setPreset("all")}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          All
        </button>
      </div>

      <div className="h-4 w-px bg-slate-700 hidden sm:block" />

      {/* Date Pickers */}
      <div className="flex items-center gap-2 text-xs">
        <div className="relative">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onRangeChange(e.target.value, endDate)}
            className="pl-3 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-clinic-500"
          />
        </div>
        <span className="text-slate-500 font-medium">to</span>
        <div className="relative">
          <input
            type="date"
            value={endDate}
            onChange={(e) => onRangeChange(startDate, e.target.value)}
            className="pl-3 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-clinic-500"
          />
        </div>
      </div>
    </div>
  );
}
