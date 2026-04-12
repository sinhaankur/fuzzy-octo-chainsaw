'use client'

import { Area, AreaChart, ResponsiveContainer } from 'recharts'

interface MiniChartProps {
  data: { date: string; price: number }[]
  isPositive: boolean
}

export function MiniChart({ data, isPositive }: MiniChartProps) {
  const color = isPositive ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`gradient-${isPositive}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#gradient-${isPositive})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
