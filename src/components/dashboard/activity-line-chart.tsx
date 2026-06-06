"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DailyCount } from "@/lib/dashboard-data";

type ActivityLineChartProps = {
  data: DailyCount[];
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0B1220] px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-white">
        {payload[0]?.value ?? 0} eventos
      </p>
    </div>
  );
}

export function ActivityLineChart({ data }: ActivityLineChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    shortLabel: item.label.replace(".", ""),
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <h2 className="text-lg font-semibold text-white">
          Eventos recebidos nos últimos 30 dias
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Atividade real via webhooks enquanto o login ainda não está ativo.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#34d399"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: "#34d399" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
