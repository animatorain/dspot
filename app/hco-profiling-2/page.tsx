"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  LabelList,
} from "recharts"
import { DollarSign, Activity, Building2, Calculator, CalendarDays, TrendingUp, Users } from "lucide-react"
import { MultiSelect } from "@/components/ui/multi-select"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { SectionCard } from "@/components/dashboard/section-card"
import { TabNavigation } from "@/components/dashboard/tab-navigation"
import {
  hcoYearSummary,
  hcoBuYearSummary,
  getHcoStatus,
  getHcoStatusLabel,
  COLORS,
  HCO_CATEGORY_COLORS,
  formatCurrency,
} from "@/lib/data"

const ALL_YEARS = ["2024", "2025"]
const HCO_CATEGORIES = ["Association", "Foundation", "University", "Non-profit", "Other"]
const HCO_STATUS_OPTIONS = ["All", "New in 2025", "Continued (2024 & 2025)", "Used in 2024 only"]

export default function HcoProfiling2Page() {
  const searchParams = useSearchParams()
  const hcoFilterFromUrl = searchParams?.get("hco")

  const [selectedYears, setSelectedYears] = useState<string[]>(["2024", "2025"])
  const [selectedHcoCategories, setSelectedHcoCategories] = useState<string[]>(HCO_CATEGORIES)
  const [hcoStatusFilter, setHcoStatusFilter] = useState<string>("All")
  const [selectedHco, setSelectedHco] = useState<string | null>(null)

  // Apply HCO filter from URL
  useEffect(() => {
    if (hcoFilterFromUrl) {
      setSelectedHco(hcoFilterFromUrl)
    }
  }, [hcoFilterFromUrl])

  const yearNumbers = useMemo(() => selectedYears.map((y) => Number.parseInt(y)), [selectedYears])

  // Aggregate HCO data across years
  const aggregatedHcoData = useMemo(() => {
    const filteredRecords = hcoYearSummary.filter((r) => yearNumbers.includes(r.year))
    const grouped = new Map<string, { totalAmount: number; activityCount: number; hcoId: string; category: string }>()

    filteredRecords.forEach((r) => {
      const existing = grouped.get(r.hcoName)
      if (existing) {
        existing.totalAmount += r.totalAmount
        existing.activityCount += r.activityCount
      } else {
        grouped.set(r.hcoName, {
          totalAmount: r.totalAmount,
          activityCount: r.activityCount,
          hcoId: r.hcoId,
          category: r.category,
        })
      }
    })

    return Array.from(grouped.entries()).map(([hcoName, data]) => ({
      hcoName,
      hcoId: data.hcoId,
      category: data.category,
      totalAmount: data.totalAmount,
      activityCount: data.activityCount,
      avgAmountMillion: data.totalAmount / data.activityCount / 1000000,
      bubbleSize: data.totalAmount / 1000000,
    }))
  }, [selectedYears])

  // Filter by HCO category
  const categoryFilteredData = useMemo(() => {
    return aggregatedHcoData.filter((r) => selectedHcoCategories.includes(r.category))
  }, [aggregatedHcoData, selectedHcoCategories])

  // Filter by HCO status
  const filteredHcoData = useMemo(() => {
    if (hcoStatusFilter === "All") return categoryFilteredData

    return categoryFilteredData.filter((hco) => {
      const status = getHcoStatus(hco.hcoId)
      const statusLabel = getHcoStatusLabel(status)
      return statusLabel === hcoStatusFilter
    })
  }, [categoryFilteredData, hcoStatusFilter])

  // Calculate HCO Status KPIs
  const hcoStatusKpis = useMemo(() => {
    const uniqueHcos = new Map<string, Set<number>>()

    hcoYearSummary.forEach((r) => {
      if (!uniqueHcos.has(r.hcoId)) {
        uniqueHcos.set(r.hcoId, new Set())
      }
      uniqueHcos.get(r.hcoId)!.add(r.year)
    })

    let newIn2025 = 0
    let continued = 0
    let used2024Only = 0
    let oneTime = 0

    uniqueHcos.forEach((years, hcoId) => {
      const has2024 = years.has(2024)
      const has2025 = years.has(2025)

      if (has2025 && !has2024) newIn2025++
      else if (has2024 && has2025) continued++
      else if (has2024 && !has2025) used2024Only++

      if (years.size === 1) oneTime++
    })

    return { newIn2025, continued, used2024Only, oneTime }
  }, [])

  // KPIs
  const totalSpending = useMemo(() => filteredHcoData.reduce((sum, r) => sum + r.totalAmount, 0), [filteredHcoData])
  const totalActivities = useMemo(() => filteredHcoData.reduce((sum, r) => sum + r.activityCount, 0), [filteredHcoData])
  const uniqueHcoCount = filteredHcoData.length
  const avgAmountPerActivity = totalActivities > 0 ? totalSpending / totalActivities : 0

  // Bubble chart data with BU info in tooltip
  const bubbleData = useMemo(() => {
    return filteredHcoData
      .filter((r) => r.activityCount > 0 && r.totalAmount > 0)
      .map((r) => {
        // Get BU breakdown for this HCO
        const buBreakdown = hcoBuYearSummary
          .filter((bu) => bu.hcoName === r.hcoName && selectedYears.map((y) => Number(y)).includes(bu.year))
          .reduce(
            (acc, bu) => {
              const existing = acc.find((item) => item.bu === bu.bu)
              if (existing) {
                existing.totalAmount += bu.totalAmount
                existing.activityCount += bu.activityCount
              } else {
                acc.push({
                  bu: bu.bu,
                  totalAmount: bu.totalAmount,
                  activityCount: bu.activityCount,
                })
              }
              return acc
            },
            [] as Array<{ bu: string; totalAmount: number; activityCount: number }>,
          )
          .sort((a, b) => b.totalAmount - a.totalAmount)

        return {
          x: r.activityCount,
          y: r.avgAmountMillion,
          z: r.bubbleSize,
          name: r.hcoName,
          category: r.category,
          totalAmount: r.totalAmount,
          buBreakdown,
          fill: HCO_CATEGORY_COLORS[r.category] || COLORS.neutral,
        }
      })
      .sort((a, b) => b.z - a.z)
      .slice(0, 50)
  }, [filteredHcoData, selectedYears])

  // HCO Category distribution
  const hcoCategoryData = useMemo(() => {
    const categoryMap = new Map<string, number>()
    filteredHcoData.forEach((r) => {
      const existing = categoryMap.get(r.category) || 0
      categoryMap.set(r.category, existing + r.totalAmount)
    })
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        fill: HCO_CATEGORY_COLORS[name] || COLORS.neutral,
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredHcoData])

  // Top 10 HCOs for 2024 and 2025
  const topHcos2024 = useMemo(() => {
    return hcoYearSummary
      .filter((r) => r.year === 2024)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)
  }, [])

  const topHcos2025 = useMemo(() => {
    return hcoYearSummary
      .filter((r) => r.year === 2025)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)
  }, [])

  const maxTopAmount = useMemo(() => {
    const max2024 = topHcos2024.length > 0 ? topHcos2024[0].totalAmount : 0
    const max2025 = topHcos2025.length > 0 ? topHcos2025[0].totalAmount : 0
    return Math.max(max2024, max2025)
  }, [topHcos2024, topHcos2025])

  const formatFullCurrency = (value: number) => {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F7FB" }}>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">HCO Profiling 2.0 – Future Complete Version</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enhanced HCO lifecycle analysis with year-over-year comparison and BU engagement details.
          </p>
          {selectedHco && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Selected HCO:</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                {selectedHco}
              </span>
              <button onClick={() => setSelectedHco(null)} className="text-sm text-gray-500 hover:text-gray-700 ml-2">
                Clear ✕
              </button>
            </div>
          )}
        </div>
      </header>
      <TabNavigation />

      {/* Filter Bar */}
      <div
        className="bg-white border-b border-gray-200 sticky top-0 z-10"
        style={{ boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)" }}
      >
        <div className="max-w-[1600px] mx-auto px-8 py-4">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters:
            </span>
            <MultiSelect
              label="Year"
              options={ALL_YEARS}
              selected={selectedYears}
              onChange={setSelectedYears}
              icon={<CalendarDays className="w-4 h-4" />}
            />
            <MultiSelect
              label="HCO Type"
              options={HCO_CATEGORIES}
              selected={selectedHcoCategories}
              onChange={setSelectedHcoCategories}
              icon={<Building2 className="w-4 h-4" />}
            />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <select
                value={hcoStatusFilter}
                onChange={(e) => setHcoStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {HCO_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <span className="ml-auto text-xs text-gray-400">Filters apply to all metrics on this page.</span>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-8 py-6">
        {/* Primary KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <KpiCard
            title="Total HCO Spending"
            mainValue={formatCurrency(totalSpending)}
            subValue={formatFullCurrency(totalSpending)}
            icon={<DollarSign className="w-5 h-5 text-[#005EB8]" />}
          />
          <KpiCard
            title="Total Activities"
            mainValue={totalActivities.toLocaleString()}
            subValue="Across all selected HCOs"
            icon={<Activity className="w-5 h-5 text-[#005EB8]" />}
          />
          <KpiCard
            title="Unique HCOs"
            mainValue={uniqueHcoCount.toString()}
            subValue="Healthcare organizations"
            icon={<Building2 className="w-5 h-5 text-[#005EB8]" />}
          />
          <KpiCard
            title="Avg Amount/Activity"
            mainValue={formatCurrency(avgAmountPerActivity)}
            subValue="Average spending per activity"
            icon={<Calculator className="w-5 h-5 text-[#005EB8]" />}
          />
        </section>

        {/* HCO Status KPIs */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#10B981] rounded-full" />
            HCO Lifecycle Status (2024 vs 2025)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KpiCard
              title="New HCOs in 2025"
              mainValue={hcoStatusKpis.newIn2025.toString()}
              subValue="Only appeared in 2025"
              icon={<TrendingUp className="w-5 h-5 text-[#10B981]" />}
            />
            <KpiCard
              title="Continued HCOs"
              mainValue={hcoStatusKpis.continued.toString()}
              subValue="Active in both 2024 & 2025"
              icon={<Activity className="w-5 h-5 text-[#3B82F6]" />}
            />
            <KpiCard
              title="Used in 2024 Only"
              mainValue={hcoStatusKpis.used2024Only.toString()}
              subValue="Not continued in 2025"
              icon={<CalendarDays className="w-5 h-5 text-[#F59E0B]" />}
            />
            <KpiCard
              title="One-time HCOs"
              mainValue={hcoStatusKpis.oneTime.toString()}
              subValue="Single record across years"
              icon={<Users className="w-5 h-5 text-[#6B7280]" />}
            />
          </div>
        </section>

        {/* Bubble Chart with BU Breakdown */}
        <SectionCard
          title="HCO Spending vs Activity Analysis (with BU Engagement)"
          subtitle="Bubble size = total spending; Hover for BU breakdown"
          className="mb-6"
        >
          <div style={{ height: 500 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Activity Count"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  label={{
                    value: "Activities",
                    position: "bottom",
                    offset: 10,
                    fontSize: 12,
                    fill: "#64748B",
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Avg Amount (M)"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickFormatter={(v) => `$${v.toFixed(2)}M`}
                  label={{
                    value: "Avg Amount ($M)",
                    angle: -90,
                    position: "insideLeft",
                    offset: -10,
                    fontSize: 12,
                    fill: "#64748B",
                  }}
                />
                <ZAxis type="number" dataKey="z" range={[100, 2000]} name="Total Spending" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: 8,
                            padding: 16,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            maxWidth: 320,
                          }}
                        >
                          <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{data.name}</p>
                          <p style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>Category: {data.category}</p>
                          <p style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>Activities: {data.x}</p>
                          <p style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>
                            Avg Amount: ${data.y.toFixed(2)}M
                          </p>
                          <p style={{ fontSize: 12, color: "#005EB8", fontWeight: 500, marginBottom: 8 }}>
                            Total Spending: ${(data.totalAmount / 1000000).toFixed(2)}M
                          </p>

                          {/* BU Breakdown */}
                          {data.buBreakdown && data.buBreakdown.length > 0 && (
                            <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 8, marginTop: 8 }}>
                              <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#1F2937" }}>
                                Used by BUs:
                              </p>
                              {data.buBreakdown.map((bu: any, idx: number) => (
                                <p key={idx} style={{ fontSize: 11, color: "#4B5563", marginBottom: 2 }}>
                                  {bu.bu} – ${(bu.totalAmount / 1000000).toFixed(2)}M ({bu.activityCount} activities)
                                </p>
                              ))}
                            </div>
                          )}

                          {(!data.buBreakdown || data.buBreakdown.length === 0) && (
                            <p style={{ fontSize: 11, color: "#9CA3AF", fontStyle: "italic", marginTop: 8 }}>
                              No BU breakdown data yet
                            </p>
                          )}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend
                  payload={Object.entries(HCO_CATEGORY_COLORS).map(([name, color]) => ({
                    value: name,
                    type: "circle",
                    color: color,
                  }))}
                />
                <Scatter name="HCOs" data={bubbleData}>
                  {bubbleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.7} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* HCO Category Mix & Top 10 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SectionCard title="HCO Category Mix" subtitle="Distribution by organization type">
            <div className="flex items-center gap-8">
              <div className="flex-1">
                <div className="space-y-3 mb-4">
                  {hcoCategoryData.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-sm text-gray-700">{item.name}</span>
                      <span className="text-sm text-gray-500 ml-auto">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpending)}</p>
                  <p className="text-xs text-gray-500">Total HCO Spending</p>
                </div>
              </div>
              <div style={{ width: 180, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={hcoCategoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="90%"
                      paddingAngle={2}
                    >
                      {hcoCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* 2024 vs 2025 Top 10 Comparison */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#EC4899] rounded-full" />
            Top 10 HCOs: 2024 vs 2025 Comparison
          </h2>
          <SectionCard title="Side-by-Side Year Comparison" subtitle="Click bars to drill down to BU Deep Dive">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* 2024 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">2024 Top 10 HCOs</h4>
                <div style={{ height: 450 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topHcos2024} layout="vertical" margin={{ top: 5, right: 80, left: 150, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={true} vertical={false} />
                      <XAxis
                        type="number"
                        domain={[0, maxTopAmount]}
                        tick={{ fontSize: 11, fill: "#64748B" }}
                        tickFormatter={(v) => formatCurrency(v)}
                      />
                      <YAxis
                        type="category"
                        dataKey="hcoName"
                        tick={{ fontSize: 10, fill: "#64748B" }}
                        width={145}
                        tickFormatter={(v) => (v.length > 18 ? v.substring(0, 18) + "..." : v)}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                                <p className="font-semibold text-gray-900 mb-2 text-sm">{data.hcoName}</p>
                                <p className="text-xs text-gray-600">Year: 2024</p>
                                <p className="text-xs text-blue-600 font-semibold">
                                  Total: {formatCurrency(data.totalAmount)}
                                </p>
                                <p className="text-xs text-gray-600">Activities: {data.activityCount}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="totalAmount" fill={COLORS.primary} radius={[0, 4, 4, 0]}>
                        <LabelList
                          dataKey="totalAmount"
                          position="right"
                          formatter={(value: number) => formatCurrency(value)}
                          style={{ fontSize: 10, fill: "#1E293B", fontWeight: 500 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2025 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">2025 Top 10 HCOs</h4>
                <div style={{ height: 450 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topHcos2025} layout="vertical" margin={{ top: 5, right: 80, left: 150, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={true} vertical={false} />
                      <XAxis
                        type="number"
                        domain={[0, maxTopAmount]}
                        tick={{ fontSize: 11, fill: "#64748B" }}
                        tickFormatter={(v) => formatCurrency(v)}
                      />
                      <YAxis
                        type="category"
                        dataKey="hcoName"
                        tick={{ fontSize: 10, fill: "#64748B" }}
                        width={145}
                        tickFormatter={(v) => (v.length > 18 ? v.substring(0, 18) + "..." : v)}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                                <p className="font-semibold text-gray-900 mb-2 text-sm">{data.hcoName}</p>
                                <p className="text-xs text-gray-600">Year: 2025</p>
                                <p className="text-xs text-blue-600 font-semibold">
                                  Total: {formatCurrency(data.totalAmount)}
                                </p>
                                <p className="text-xs text-gray-600">Activities: {data.activityCount}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="totalAmount" fill={COLORS.secondary} radius={[0, 4, 4, 0]}>
                        <LabelList
                          dataKey="totalAmount"
                          position="right"
                          formatter={(value: number) => formatCurrency(value)}
                          style={{ fontSize: 10, fill: "#1E293B", fontWeight: 500 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </SectionCard>
        </section>
      </main>

      <footer className="py-4 text-center text-xs text-gray-400">
        HCO Profiling 2.0 – Enhanced with lifecycle analysis and BU engagement details. Mock data in use.
      </footer>
    </div>
  )
}
