"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ProcedureBreakdownItem {
  name: string;
  value: number; // revenue amount
}

interface ProcedureBreakdownChartProps {
  data: ProcedureBreakdownItem[];
  title?: string;
  height?: number;
}

const LUXURY_PALETTE = [
  "#AA8273", // Clinic Rose Gold
  "#CCA938", // Gold Accent
  "#10B981", // Emerald
  "#38BDF8", // Sky Blue
  "#818CF8", // Indigo
  "#F43F5E", // Rose
  "#F59E0B", // Amber
];

export function ProcedureBreakdownChart({
  data,
  title = "Income by Procedure Category",
  height = 300,
}: ProcedureBreakdownChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="rounded-xl bg-slate-900/95 border border-slate-700 p-3 shadow-2xl backdrop-blur-md text-xs space-y-1">
          <p className="font-bold text-white">{item.name}</p>
          <p className="text-emerald-400 font-mono font-semibold">
            {formatCurrency(item.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-dark-card/90 border border-slate-700/60 p-5 backdrop-blur-xl shadow-glass-dark space-y-4">
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          {title}
        </h4>
        <p className="text-xs text-slate-400 font-light mt-0.5">
          Distribution of clinic revenue by procedure type
        </p>
      </div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={LUXURY_PALETTE[index % LUXURY_PALETTE.length]}
                  stroke="#111827"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              iconType="circle"
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
