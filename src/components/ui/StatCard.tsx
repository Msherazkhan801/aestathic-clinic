import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number; // e.g. +14% or -5%
  changeLabel?: string;
  icon: LucideIcon;
  variant?: "rose" | "gold" | "emerald" | "slate" | "blue";
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  changeLabel = "vs last month",
  icon: Icon,
  variant = "rose",
  onClick,
  className,
}: StatCardProps) {
  const variantStyles = {
    rose: {
      border: "border-clinic-500/20 hover:border-clinic-500/40",
      iconBg: "bg-clinic-500/10 text-clinic-400 border-clinic-500/20",
      glow: "hover:shadow-glow",
      accent: "from-clinic-500/5 to-transparent",
    },
    gold: {
      border: "border-gold-500/20 hover:border-gold-500/40",
      iconBg: "bg-gold-500/10 text-gold-400 border-gold-500/20",
      glow: "hover:shadow-glow-gold",
      accent: "from-gold-500/5 to-transparent",
    },
    emerald: {
      border: "border-emerald-500/20 hover:border-emerald-500/40",
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      glow: "hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.3)]",
      accent: "from-emerald-500/5 to-transparent",
    },
    slate: {
      border: "border-slate-700/60 hover:border-slate-600",
      iconBg: "bg-slate-800 text-slate-300 border-slate-700",
      glow: "hover:shadow-glass-dark",
      accent: "from-slate-800/20 to-transparent",
    },
    blue: {
      border: "border-sky-500/20 hover:border-sky-500/40",
      iconBg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      glow: "hover:shadow-[0_0_25px_-5px_rgba(56,189,248,0.3)]",
      accent: "from-sky-500/5 to-transparent",
    },
  }[variant];

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-dark-card/90 border p-5 backdrop-blur-xl transition-all duration-300 group",
        variantStyles.border,
        variantStyles.glow,
        onClick && "cursor-pointer hover:-translate-y-0.5",
        className
      )}
    >
      {/* Subtle Gradient Backlight */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity group-hover:opacity-100 pointer-events-none",
          variantStyles.accent
        )}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-wider uppercase text-slate-400">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white font-sans">
            {value}
          </h3>
        </div>
        <div
          className={cn(
            "p-3 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105",
            variantStyles.iconBg
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || change !== undefined) && (
        <div className="relative z-10 mt-4 flex items-center gap-2 text-xs">
          {change !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded",
                change >= 0
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-rose-400 bg-rose-500/10"
              )}
            >
              {change >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {change >= 0 ? `+${change}%` : `${change}%`}
            </span>
          )}
          {subtitle && (
            <span className="text-slate-400 font-light truncate">{subtitle}</span>
          )}
          {change !== undefined && !subtitle && (
            <span className="text-slate-400 font-light truncate">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
