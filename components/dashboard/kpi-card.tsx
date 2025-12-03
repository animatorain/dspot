import type React from "react"
import { TrendingUp } from "lucide-react"

interface KpiCardProps {
  title: string
  mainValue: string
  subValue?: string
  icon: React.ReactNode
  trend?: string
}

export function KpiCard({ title, mainValue, subValue, icon, trend }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className="p-2 bg-[#005EB8]/10 rounded-lg">{icon}</div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-gray-900">{mainValue}</p>
        {subValue && <p className="text-sm text-gray-500">{subValue}</p>}
        {trend && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {trend}
          </p>
        )}
      </div>
    </div>
  )
}
