import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import type { Metrics } from '../../types'

export default function MetricsChart({ data }: { data: Metrics[] }) {
  // 表示を軽くする：1秒刻み → 2秒ごとに間引き
  const sampled = data.filter((_, i) => i % 2 === 0).map(d => ({
    ...d,
    time: Math.round(d.t),
    occupancyPct: Math.round(d.occupancy * 100),
  }))

  return (
    <div className="h-48 w-full border rounded-lg bg-white">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sampled} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="occupancyPct" name="稼働率(%)" dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="inStore" name="店内人数" dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="toiletQueue" name="トイレ待ち" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
