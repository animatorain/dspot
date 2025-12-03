"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from "recharts"
import { TrendingUp, Activity, CalendarDays, Building2, ListFilter } from "lucide-react"

import { MultiSelect } from "@/components/ui/multi-select"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { SectionCard } from "@/components/dashboard/section-card"
import { TabNavigation } from "@/components/dashboard/tab-navigation"
import {
  unifiedActivityData,
  hcoMasterData,
  hcoBuYearSummary,
  getHcoCategory,
  COLORS,
  HCO_CATEGORY_COLORS,
  BU_COLORS,
  BU_COLORS_ARRAY,
} from "@/lib/data"

const ALL_QUARTERS = ["2024Q1", "2024Q2", "2024Q3", "2024Q4", "2025Q1", "2025Q2", "2025Q3"]
const ALL_BUS = [...new Set(unifiedActivityData.map((r) => r.bu))].sort()

export default function ExecutiveOverviewPage() {
  const [selectedQuarters, setSelectedQuarters] = useState<string[]>(ALL_QUARTERS)
  const [selectedBus, setSelectedBus] = useState<string[]>(ALL_BUS)
  const [activityTypeFilter, setActivityTypeFilter] = useState<"all" | "event" | "non-event">("all")
  const [thirdPartyTypeFilter, setThirdPartyTypeFilter] = useState<"all" | "HCO" | "Vendor">("all")

  const filteredRows = useMemo(() => {
    return unifiedActivityData.filter((row) => {
      const quarterMatch = selectedQuarters.includes(row.yearQuarter)
      const buMatch = selectedBus.includes(row.bu)
      const activityMatch =
        activityTypeFilter === "all" ||
        (activityTypeFilter === "event" && row.activityType === "event") ||
        (activityTypeFilter === "non-event" && row.activityType === "non-event")
      const thirdPartyMatch = thirdPartyTypeFilter === "all" || row.thirdPartyType === thirdPartyTypeFilter
      return quarterMatch && buMatch && activityMatch && thirdPartyMatch
    })
  }, [selectedQuarters, selectedBus, activityTypeFilter, thirdPartyTypeFilter])

  const totalSpending = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + r.amount, 0)
  }, [filteredRows])

  const totalActivities = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + r.count, 0)
  }, [filteredRows])

  const distinctQuarters = useMemo(() => [...new Set(filteredRows.map((r) => r.yearQuarter))].sort(), [filteredRows])

  const quarterlyTrendData = useMemo(() => {
    const quarterMap = new Map<string, { amount: number; count: number }>()
    filteredRows.forEach((r) => {
      const existing = quarterMap.get(r.yearQuarter) || { amount: 0, count: 0 }
      existing.amount += r.amount
      existing.count += r.count
      quarterMap.set(r.yearQuarter, existing)
    })
    return ALL_QUARTERS.filter((q) => quarterMap.has(q)).map((q) => ({
      quarter: q,
      amount: quarterMap.get(q)!.amount,
      count: quarterMap.get(q)!.count,
    }))
  }, [filteredRows])

  const thirdPartyTypeData = useMemo(() => {
    const hcoTotal = filteredRows.filter((r) => r.thirdPartyType === "HCO").reduce((s, r) => s + r.amount, 0)
    const vendorTotal = filteredRows.filter((r) => r.thirdPartyType === "Vendor").reduce((s, r) => s + r.amount, 0)
    return [
      { key: "HCO", value: hcoTotal, fill: COLORS.primary },
      { key: "Vendor", value: vendorTotal, fill: COLORS.accent },
    ]
  }, [filteredRows])

  const activityTypeData = useMemo(() => {
    const eventTotal = filteredRows.filter((r) => r.activityType === "event").reduce((s, r) => s + r.amount, 0)
    const nonEventTotal = filteredRows.filter((r) => r.activityType === "non-event").reduce((s, r) => s + r.amount, 0)
    return [
      { key: "Event", value: eventTotal, fill: COLORS.primary },
      { key: "Non-event", value: nonEventTotal, fill: COLORS.neutral },
    ]
  }, [filteredRows])

  const buData = useMemo(() => {
    const buMap = new Map<string, { amount: number; count: number }>()
    filteredRows.forEach((r) => {
      const existing = buMap.get(r.bu) || { amount: 0, count: 0 }
      existing.amount += r.amount
      existing.count += r.count
      buMap.set(r.bu, existing)
    })
    return Array.from(buMap.entries())
      .map(([bu, data], index) => ({
        bu,
        amount: data.amount,
        count: data.count,
        fill: BU_COLORS[bu] || BU_COLORS_ARRAY[index % BU_COLORS_ARRAY.length],
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredRows])

  const selectedYears = useMemo(() => {
    const years = new Set<number>()
    selectedQuarters.forEach((q) => years.add(Number.parseInt(q.substring(0, 4))))
    return Array.from(years)
  }, [selectedQuarters])

  const filteredHcoData = useMemo(() => {
    return hcoMasterData
      .filter((r) => selectedYears.includes(r.year))
      .map((r) => ({
        entityName: r.entityName,
        category: getHcoCategory(r.entityName),
        amount: r.totalAmount,
      }))
  }, [selectedYears])

  const hcoCategoryData = useMemo(() => {
    const categoryMap = new Map<string, number>()
    filteredHcoData.forEach((d) => {
      const existing = categoryMap.get(d.category) || 0
      categoryMap.set(d.category, existing + d.amount)
    })
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        fill: HCO_CATEGORY_COLORS[name] || COLORS.purple,
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredHcoData])

  const topHcos = useMemo(() => {
    const hcoMap = new Map<string, number>()
    filteredHcoData.forEach((d) => {
      const existing = hcoMap.get(d.entityName) || 0
      hcoMap.set(d.entityName, existing + d.amount)
    })
    return Array.from(hcoMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [filteredHcoData])

  const highImpactHcos = useMemo(() => {
    const hcoMap = new Map<string, { totalAmount: number; buCount: number }>()

    filteredHcoData.forEach((d) => {
      const existing = hcoMap.get(d.entityName) || { totalAmount: 0, buCount: 0 }
      hcoMap.set(d.entityName, {
        totalAmount: existing.totalAmount + d.amount,
        buCount: 0, // Will calculate separately
      })
    })

    // Calculate BU count for each HCO
    hcoMap.forEach((data, hcoName) => {
      const buSet = new Set<string>()
      hcoBuYearSummary
        .filter((r) => r.hcoName === hcoName && selectedYears.includes(r.year))
        .forEach((r) => buSet.add(r.bu))
      data.buCount = buSet.size
    })

    return Array.from(hcoMap.entries())
      .map(([hcoName, data]) => ({
        hcoName,
        totalAmount: data.totalAmount,
        buCount: data.buCount,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)
  }, [filteredHcoData, selectedYears])

  const hcoTotalSpending = useMemo(() => filteredHcoData.reduce((s, d) => s + d.amount, 0), [filteredHcoData])

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const formatFullCurrency = (value: number) => `$${value.toLocaleString()}`

  const handleThirdPartyTypeClick = (key: string) => {
    if (thirdPartyTypeFilter === key) {
      setThirdPartyTypeFilter("all")
    } else {
      setThirdPartyTypeFilter(key as "HCO" | "Vendor")
    }
  }

  const handleHcoClick = (hcoName: string) => {
    // Navigate to HCO Profiling with filter
    const url = `/hco-profiling?hco=${encodeURIComponent(hcoName)}`
    window.location.href = url
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F7FB" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Third-Party Activity Executive Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Page 1 — Summary across spending, activities, BU behavior and HCO profile.
          </p>
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
              <ListFilter className="w-4 h-4" />
              Filters:
            </span>
            <MultiSelect
              label="Quarter"
              options={ALL_QUARTERS}
              selected={selectedQuarters}
              onChange={setSelectedQuarters}
              icon={<CalendarDays className="w-4 h-4" />}
            />
            <MultiSelect
              label="BU"
              options={ALL_BUS}
              selected={selectedBus}
              onChange={setSelectedBus}
              icon={<Building2 className="w-4 h-4" />}
            />
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <select
                value={activityTypeFilter}
                onChange={(e) => setActivityTypeFilter(e.target.value as "all" | "event" | "non-event")}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Activities</option>
                <option value="event">Event Only</option>
                <option value="non-event">Non-event Only</option>
              </select>
            </div>
            <span className="ml-auto text-xs text-gray-400">Filters apply to all metrics on this page.</span>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-8 py-6">
        {/* KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <KpiCard
            title="Total Spending"
            mainValue={formatCurrency(totalSpending)}
            subValue={formatFullCurrency(totalSpending)}
            icon={<TrendingUp className="w-5 h-5 text-[#005EB8]" />}
          />
          <KpiCard
            title="Total Activities"
            mainValue={totalActivities.toLocaleString()}
            subValue="Across all selected quarters & BUs"
            icon={<Activity className="w-5 h-5 text-[#005EB8]" />}
          />
          <KpiCard
            title="Quarters Covered"
            mainValue={`${distinctQuarters.length} Quarters`}
            subValue={
              distinctQuarters.length > 0
                ? `${distinctQuarters[0]} – ${distinctQuarters[distinctQuarters.length - 1]}`
                : "No data"
            }
            icon={<CalendarDays className="w-5 h-5 text-[#005EB8]" />}
          />
        </section>

        {/* Activity & Investment Snapshot */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#005EB8] rounded-full" />
            Activity & Investment Snapshot
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quarterly Trend */}
            <div className="lg:col-span-2">
              <SectionCard
                title="Quarterly Spending & Activity Trend"
                subtitle="Spending (bars) and activity count (line) by quarter"
              >
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={quarterlyTrendData} margin={{ top: 10, right: 60, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="quarter"
                        tick={{ fontSize: 12, fill: "#64748B" }}
                        axisLine={{ stroke: "#E2E8F0" }}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12, fill: "#64748B" }}
                        tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                        axisLine={{ stroke: "#E2E8F0" }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12, fill: "#64748B" }}
                        axisLine={{ stroke: "#E2E8F0" }}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          if (name === "Total Spending") return formatCurrency(value)
                          return value
                        }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="amount"
                        name="Total Spending"
                        fill={COLORS.primary}
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="count"
                        name="Activity Count"
                        stroke={COLORS.secondary}
                        strokeWidth={3}
                        dot={{ r: 5, fill: COLORS.secondary }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </div>

            {/* Donut Charts */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Third-Party Type Donut */}
              <SectionCard title="Spending by Third-Party Type" subtitle="HCO vs Vendor distribution">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="space-y-2 mb-3">
                      {thirdPartyTypeData.map((item) => (
                        <div key={item.key} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                          <span className="text-sm text-gray-700">{item.key}</span>
                          {thirdPartyTypeFilter === item.key && (
                            <span className="text-xs text-[#005EB8] font-medium">(Active)</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2">
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSpending)}</p>
                      <p className="text-xs text-gray-500">Third-party spending</p>
                    </div>
                  </div>
                  <div style={{ width: 120, height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={thirdPartyTypeData}
                          dataKey="value"
                          nameKey="key"
                          cx="50%"
                          cy="50%"
                          innerRadius="55%"
                          outerRadius="90%"
                          paddingAngle={2}
                          onClick={(data) => {
                            if (data && data.key) {
                              handleThirdPartyTypeClick(data.key)
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {thirdPartyTypeData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.fill}
                              opacity={thirdPartyTypeFilter === "all" || thirdPartyTypeFilter === entry.key ? 1 : 0.3}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </SectionCard>

              {/* Activity Type Donut */}
              <SectionCard title="Spending by Activity Type" subtitle="Event vs Non-event distribution">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="space-y-2 mb-3">
                      {activityTypeData.map((item) => (
                        <div key={item.key} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                          <span className="text-sm text-gray-700">{item.key}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2">
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSpending)}</p>
                      <p className="text-xs text-gray-500">Activity spending</p>
                    </div>
                  </div>
                  <div style={{ width: 120, height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activityTypeData}
                          dataKey="value"
                          nameKey="key"
                          cx="50%"
                          cy="50%"
                          innerRadius="55%"
                          outerRadius="90%"
                          paddingAngle={2}
                        >
                          {activityTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </section>

        {/* BU Snapshot Overview */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#FFC20A] rounded-full" />
            BU Snapshot Overview
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* BU Bar Chart */}
            <SectionCard
              title="Spending & Activity by BU"
              subtitle="Based on current Quarter & BU selection"
              headerRight={
                <Link href="/bu-deep-dive" className="text-sm text-[#005EB8] hover:underline flex items-center gap-1">
                  View BU details → Page 2 <span>→</span>
                </Link>
              }
            >
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={buData} margin={{ top: 10, right: 60, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="bu"
                      tick={{ fontSize: 11, fill: "#64748B" }}
                      axisLine={{ stroke: "#E2E8F0" }}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 12, fill: "#64748B" }}
                      tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                      axisLine={{ stroke: "#E2E8F0" }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12, fill: "#64748B" }}
                      axisLine={{ stroke: "#E2E8F0" }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => (name === "Spending" ? formatCurrency(value) : value)}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="amount" name="Spending" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="count"
                      name="Activity Count"
                      stroke={COLORS.secondary}
                      strokeWidth={2}
                      dot={{ r: 4, fill: COLORS.secondary }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            {/* BU Share Donut */}
            <SectionCard title="BU Share of Total Spending" subtitle="Proportional distribution across BUs">
              <div className="flex items-center justify-center gap-8">
                <div style={{ width: 200, height: 200, position: "relative" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={buData}
                        dataKey="amount"
                        nameKey="bu"
                        cx="50%"
                        cy="50%"
                        innerRadius="50%"
                        outerRadius="85%"
                        paddingAngle={1}
                      >
                        {buData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                    }}
                  >
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSpending)}</p>
                    <p className="text-xs text-gray-500">Total BU Spending</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {buData.map((item) => (
                  <div key={item.bu} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.fill }} />
                    <span className="text-xs text-gray-600">{item.bu}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </section>

        {/* HCO Snapshot Overview */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#009FDA] rounded-full" />
            HCO Snapshot Overview
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* HCO Category Mix */}
            <SectionCard title="HCO Category Mix" subtitle="Distribution by organization type">
              <div className="flex items-center justify-center gap-8" style={{ minHeight: 220 }}>
                <div style={{ width: 180, height: 180, position: "relative", flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={hcoCategoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="50%"
                        outerRadius="85%"
                        paddingAngle={2}
                      >
                        {hcoCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                    }}
                  >
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(hcoTotalSpending)}</p>
                    <p className="text-xs text-gray-500">HCO Spending</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="space-y-2">
                    {hcoCategoryData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.fill }} />
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Top HCOs */}
            <SectionCard
              title="Top HCOs by Spending"
              subtitle="Top 5 healthcare organizations"
              headerRight={
                <Link href="/hco-profiling" className="text-sm text-[#005EB8] hover:underline flex items-center gap-1">
                  View HCO details → Page 2 <span>→</span>
                </Link>
              }
            >
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topHcos} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#64748B" }}
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#64748B" }}
                      width={95}
                      tickFormatter={(v) => (v.length > 12 ? v.substring(0, 12) + "..." : v)}
                    />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar
                      dataKey="amount"
                      name="Total Spending"
                      fill={COLORS.primary}
                      radius={[0, 4, 4, 0]}
                      onClick={(data) => handleHcoClick(data.name)}
                      style={{ cursor: "pointer" }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>
        </section>

        {/* High Impact HCOs */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#A855F7] rounded-full" />
            High Impact HCOs
          </h2>
          <SectionCard
            title="Top 5 HCOs by Total Spending"
            subtitle="Healthcare organizations with highest impact and BU engagement"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">HCO Name</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Amount</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">BU Count</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {highImpactHcos.map((hco, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium">{hco.hcoName}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900 font-semibold">
                        {formatCurrency(hco.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                          {hco.buCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleHcoClick(hco.hcoName)}
                          className="text-sm text-[#005EB8] hover:underline font-medium"
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </section>
      </main>

      <footer className="py-4 text-center text-xs text-gray-400">
        Data refreshed based on current filter selection. HCO data source: hcoMasterData, hcoBuYearSummary.
      </footer>
    </div>
  )
}
