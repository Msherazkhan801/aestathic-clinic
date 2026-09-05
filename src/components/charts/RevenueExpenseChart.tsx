"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ChartDataPoint {
  name: string; // e.g. "Aug", "Sep", or "Day 1"
  income: number;
  expenses: number;
  netProfit: number;
}

interface RevenueExpenseChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
}

export function RevenueExpenseChart({
  data,
  title = "Cashflow Overview (Revenue vs Expenses)",
  height = 300,
}: RevenueExpenseChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl bg-slate-900/95 border border-slate-700 p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[170px]">
          <p className="font-bold text-white mb-2">{label}</p>
          <div className="flex justify-between items-center text-emerald-400">
            <span>Revenue:</span>
            <span className="font-semibold font-mono">
              {formatCurrency(payload[0]?.value || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center text-rose-400">
            <span>Expenses:</span>
            <span className="font-semibold font-mono">
              {formatCurrency(payload[1]?.value || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center text-clinic-300 pt-1.5 border-t border-slate-800">
            <span>Net Margin:</span>
            <span className="font-bold font-mono">
              {formatCurrency(
                (payload[0]?.value || 0) - (payload[1]?.value || 0)
              )}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-dark-card/90 border border-slate-700/60 p-5 backdrop-blur-xl shadow-glass-dark space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            {title}
          </h4>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Financial trend analysis with revenue vs operating costs
          </p>
        </div>
      </div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis
              dataKey="name"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              tickFormatter={(v) => `Rs. ${v >= 1000 ? `${v / 1000}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="income"
              name="Income / Revenue"
              stroke="#10B981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorIncome)"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#F43F5E"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorExpense)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
