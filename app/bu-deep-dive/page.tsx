"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import {
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
  BarChart,
} from "recharts"
import { Building2, CalendarDays } from "lucide-react"
import { SectionCard } from "@/components/dashboard/section-card"
import { TabNavigation } from "@/components/dashboard/tab-navigation"
import { MultiSelect } from "@/components/ui/multi-select"
import {
  hcoBreakdownRows,
  hcoBuYearSummary,
  getParentBu,
  getHcoTypeEnglish,
  unifiedActivityData,
  COLORS,
  HCO_CATEGORY_COLORS,
  BU_COLORS,
  formatCurrency,
} from "@/lib/data"

// 所有季度和 BU
const ALL_QUARTERS = [...new Set(unifiedActivityData.map((d) => d.yearQuarter))].sort()
const ALL_PARENT_BUS = ["B&I MKT", "B&I Sales", "CKM-KAM", "CV MKT", "CV Sales", "Medical", "VA&P", "S&CE"]

// BU 子级颜色
const BU_SUBLEVEL_COLORS: Record<string, string> = {
  "B&I MKT-Central MKT": "#005EB8",
  "B&I MKT-Regional MKT": "#3B82F6",
  "B&I MKT-Others Dimission": "#93C5FD",
  "CV MKT-Central MKT": "#10B981",
  "CV MKT-Regional MKT": "#34D399",
  "CV MKT-Others Dimission": "#A7F3D0",
}

// 自定义 Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color || entry.fill }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function BuDeepDivePage() {
  const searchParams = useSearchParams()
  const hcoIdFromUrl = searchParams?.get("hcoId")
  const yearFromUrl = searchParams?.get("year")

  // 筛选状态
  const [selectedQuarters, setSelectedQuarters] = useState<string[]>(ALL_QUARTERS)
  const [selectedBus, setSelectedBus] = useState<string[]>(ALL_PARENT_BUS)

  // 计算允许的年份
  const allowedYears = useMemo(() => {
    const years = new Set<string>()
    selectedQuarters.forEach((q) => {
      years.add(q.substring(0, 4))
    })
    return Array.from(years)
  }, [selectedQuarters])

  // 判断是否有选中具有子级的 BU
  const hasSelectedBuWithSubLevels = useMemo(() => {
    return selectedBus.includes("B&I MKT") || selectedBus.includes("CV MKT")
  }, [selectedBus])

  // 获取选中的具有子级的 BU 列表
  const selectedBusWithSubLevels = useMemo(() => {
    return selectedBus.filter((bu) => bu === "B&I MKT" || bu === "CV MKT")
  }, [selectedBus])

  // 过滤后的 HCO 分类数据
  const filteredHcoBreakdown = useMemo(() => {
    return hcoBreakdownRows.filter((row) => {
      const parentBu = getParentBu(row.buSubLevel)
      return (
        allowedYears.includes(row.year.toString()) && selectedBus.includes(parentBu) && row.thirdPartyType === "HCO"
      )
    })
  }, [allowedYears, selectedBus])

  // Section 1: BU → HCO Category 堆叠数据 - 使用 getHcoTypeEnglish 转换中文类型
  const buHcoCategoryStackedData = useMemo(() => {
    const dataMap = new Map<string, Record<string, number>>()

    filteredHcoBreakdown.forEach((row) => {
      const parentBu = getParentBu(row.buSubLevel)
      const hcoTypeEn = getHcoTypeEnglish(row.hcoType) // 转换中文类型为英文

      if (!dataMap.has(parentBu)) {
        dataMap.set(parentBu, {
          bu: parentBu as any,
          University: 0,
          Association: 0,
          Foundation: 0,
          "Non-profit": 0,
          Other: 0,
        })
      }
      const buData = dataMap.get(parentBu)!
      buData[hcoTypeEn] = (buData[hcoTypeEn] || 0) + row.amount
    })

    return Array.from(dataMap.values()).sort((a, b) => {
      const totalA =
        (a.University || 0) + (a.Association || 0) + (a.Foundation || 0) + (a["Non-profit"] || 0) + (a.Other || 0)
      const totalB =
        (b.University || 0) + (b.Association || 0) + (b.Foundation || 0) + (b["Non-profit"] || 0) + (b.Other || 0)
      return totalB - totalA
    })
  }, [filteredHcoBreakdown])

  // HCO Category Mix 饼图数据 - 使用 getHcoTypeEnglish 转换中文类型并添加 fill
  const hcoCategoryMixData = useMemo(() => {
    const categoryMap = new Map<string, number>()
    filteredHcoBreakdown.forEach((row) => {
      const hcoTypeEn = getHcoTypeEnglish(row.hcoType) // 转换中文类型为英文
      categoryMap.set(hcoTypeEn, (categoryMap.get(hcoTypeEn) || 0) + row.amount)
    })
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        fill: HCO_CATEGORY_COLORS[name] || COLORS.purple, // 添加 fill 属性
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [filteredHcoBreakdown])

  // Section 2: BU 子级数据
  const buSubLevelData = useMemo(() => {
    if (!hasSelectedBuWithSubLevels) return []

    const subLevelMap = new Map<string, { amount: number; count: number }>()

    filteredHcoBreakdown.forEach((row) => {
      const parentBu = getParentBu(row.buSubLevel)
      if (selectedBusWithSubLevels.includes(parentBu) && row.buSubLevel !== parentBu) {
        const existing = subLevelMap.get(row.buSubLevel) || { amount: 0, count: 0 }
        subLevelMap.set(row.buSubLevel, {
          amount: existing.amount + row.amount,
          count: existing.count + row.count,
        })
      }
    })

    return Array.from(subLevelMap.entries())
      .map(([buSubLevel, data]) => ({
        buSubLevel,
        parentBu: getParentBu(buSubLevel),
        ...data,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredHcoBreakdown, hasSelectedBuWithSubLevels, selectedBusWithSubLevels])

  // Summary Table 数据 - 使用 getHcoTypeEnglish 转换中文类型
  const summaryTableData = useMemo(() => {
    if (!hasSelectedBuWithSubLevels) return []

    const tableRows: Array<{
      parentBu: string
      buSubLevel: string
      hcoType: string
      amount: number
      count: number
    }> = []

    filteredHcoBreakdown.forEach((row) => {
      const parentBu = getParentBu(row.buSubLevel)
      if (selectedBusWithSubLevels.includes(parentBu)) {
        tableRows.push({
          parentBu,
          buSubLevel: row.buSubLevel,
          hcoType: getHcoTypeEnglish(row.hcoType), // 转换中文类型为英文
          amount: row.amount,
          count: row.count,
        })
      }
    })

    return tableRows.sort((a, b) => b.amount - a.amount).slice(0, 15)
  }, [filteredHcoBreakdown, hasSelectedBuWithSubLevels, selectedBusWithSubLevels])

  // Section 3: HCO vs Vendor 数据 - 添加 fill 属性
  const thirdPartyComparisonData = useMemo(() => {
    // HCO 金额
    const hcoAmount = filteredHcoBreakdown.reduce((sum, row) => sum + row.amount, 0)

    // Vendor 金额来自 hcoBreakdownRows 中 thirdPartyType === "Vendor"
    const vendorAmount = hcoBreakdownRows
      .filter((row) => {
        const parentBu = getParentBu(row.buSubLevel)
        return (
          allowedYears.includes(row.year.toString()) &&
          selectedBus.includes(parentBu) &&
          row.thirdPartyType === "Vendor"
        )
      })
      .reduce((sum, row) => sum + row.amount, 0)

    return [
      { name: "HCO", value: hcoAmount, fill: COLORS.primary },
      { name: "Vendor", value: vendorAmount, fill: COLORS.accent },
    ].filter((d) => d.value > 0)
  }, [filteredHcoBreakdown, allowedYears, selectedBus])

  const hcoXBuHeatmapData = useMemo(() => {
    // If filtering by specific HCO from URL, show only that HCO
    if (hcoIdFromUrl) {
      const hcoData = hcoBuYearSummary.filter(
        (r) => r.hcoId === hcoIdFromUrl && allowedYears.includes(r.year.toString()),
      )

      const hcoName = hcoData.length > 0 ? hcoData[0].hcoName : "Unknown HCO"
      const buMap = new Map<string, number>()

      hcoData.forEach((r) => {
        buMap.set(r.bu, (buMap.get(r.bu) || 0) + r.totalAmount)
      })

      return [
        {
          hcoName,
          ...Object.fromEntries(buMap.entries()),
        },
      ]
    }

    // Otherwise show top 20 HCOs
    const hcoMap = new Map<string, Map<string, number>>()

    hcoBuYearSummary
      .filter((r) => allowedYears.includes(r.year.toString()))
      .forEach((r) => {
        if (!hcoMap.has(r.hcoName)) {
          hcoMap.set(r.hcoName, new Map())
        }
        const buMap = hcoMap.get(r.hcoName)!
        buMap.set(r.bu, (buMap.get(r.bu) || 0) + r.totalAmount)
      })

    // Convert to array and sort by total amount
    const heatmapArray = Array.from(hcoMap.entries()).map(([hcoName, buMap]) => {
      const total = Array.from(buMap.values()).reduce((sum, v) => sum + v, 0)
      return {
        hcoName,
        total,
        ...Object.fromEntries(buMap.entries()),
      }
    })

    return heatmapArray.sort((a, b) => b.total - a.total).slice(0, 20)
  }, [hcoIdFromUrl, allowedYears])

  const hcoCategories = ["University", "Association", "Foundation", "Non-profit", "Other"]

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F7FB" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Third-Party Activity Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive view of spending, activities, BU behavior and HCO profile.
          </p>
          {hcoIdFromUrl && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filtered by HCO:</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                {hcoXBuHeatmapData[0]?.hcoName || hcoIdFromUrl}
              </span>
            </div>
          )}
        </div>
      </header>
      <TabNavigation />

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
              label="Quarter"
              options={ALL_QUARTERS}
              selected={selectedQuarters}
              onChange={setSelectedQuarters}
              icon={<CalendarDays className="w-4 h-4" />}
            />
            <MultiSelect
              label="BU"
              options={ALL_PARENT_BUS}
              selected={selectedBus}
              onChange={setSelectedBus}
              icon={<Building2 className="w-4 h-4" />}
            />
            <span className="ml-auto text-xs text-gray-400">Filters apply to all metrics on this page.</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-8 py-8 space-y-8">
        {/* Section 1: BU → HCO Category Overview */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-[#005EB8] rounded-full" />
            <h2 className="text-xl font-bold text-gray-900">BU → HCO Category Overview</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Stacked Bar Chart */}
            <SectionCard
              title="HCO Category by BU"
              subtitle="Stacked spending by HCO type across BUs"
              className="lg:col-span-3"
            >
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={buHcoCategoryStackedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="bu"
                      tick={{ fontSize: 11 }}
                      stroke="#6B7280"
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 12 }} stroke="#6B7280" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {hcoCategories.map((category) => (
                      <Bar
                        key={category}
                        dataKey={category}
                        stackId="a"
                        fill={HCO_CATEGORY_COLORS[category]}
                        name={category}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            {/* HCO Category Mix Donut - 使用 entry.fill */}
            <SectionCard
              title="HCO Category Mix"
              subtitle="Overall distribution under current selection"
              className="lg:col-span-2"
            >
              <div className="h-[320px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={hcoCategoryMixData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {hcoCategoryMixData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    />
                    <Legend formatter={(value) => <span className="text-sm text-gray-700">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(hcoCategoryMixData.reduce((s, d) => s + d.value, 0))}
                  </p>
                  <p className="text-xs text-gray-500">HCO spending</p>
                </div>
              </div>
            </SectionCard>
          </div>
        </section>

        {/* Section 2: BU Sub-level Drill Down */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-[#009FDA] rounded-full" />
            <h2 className="text-xl font-bold text-gray-900">BU Sub-level Drill Down</h2>
            <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-blue-50 rounded text-xs text-blue-600">
              <Building2 className="w-3 h-3" />
              {hasSelectedBuWithSubLevels ? `${selectedBusWithSubLevels.join(", ")}` : "No sub-levels"}
            </div>
          </div>

          {hasSelectedBuWithSubLevels ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sub-level Bar Chart */}
              <SectionCard title="Spending by BU Sub-level" subtitle="Central vs Regional vs Others breakdown">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={buSubLevelData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => formatCurrency(v)}
                        tick={{ fontSize: 11 }}
                        stroke="#6B7280"
                      />
                      <YAxis
                        type="category"
                        dataKey="buSubLevel"
                        tick={{ fontSize: 11 }}
                        stroke="#6B7280"
                        width={115}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" name="Spending" radius={[0, 4, 4, 0]}>
                        {buSubLevelData.map((entry) => (
                          <Cell
                            key={entry.buSubLevel}
                            fill={BU_SUBLEVEL_COLORS[entry.buSubLevel] || BU_COLORS[entry.parentBu] || COLORS.primary}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              {/* Summary Table */}
              <SectionCard title="Sub-level Summary Table" subtitle="Top records by amount (sorted descending)">
                <div className="h-[300px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 font-medium text-gray-600">BU</th>
                        <th className="text-left p-2 font-medium text-gray-600">Sub-level</th>
                        <th className="text-left p-2 font-medium text-gray-600">HCO Type</th>
                        <th className="text-right p-2 font-medium text-gray-600">Amount</th>
                        <th className="text-right p-2 font-medium text-gray-600">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryTableData.map((row, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-2 text-gray-900">{row.parentBu}</td>
                          <td className="p-2 text-gray-700">{row.buSubLevel.replace(`${row.parentBu}-`, "")}</td>
                          <td className="p-2">
                            <span
                              className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: HCO_CATEGORY_COLORS[row.hcoType] || COLORS.neutral }}
                            >
                              {row.hcoType}
                            </span>
                          </td>
                          <td className="p-2 text-right text-gray-900 font-medium">{formatCurrency(row.amount)}</td>
                          <td className="p-2 text-right text-gray-600">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-[0_6px_18px_rgba(15,23,42,0.08)] text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Sub-level view is not applicable for the current BU selection.</p>
              <p className="text-sm text-gray-400 mt-2">
                Select <strong>B&I MKT</strong> or <strong>CV MKT</strong> to view sub-level breakdown.
              </p>
            </div>
          )}
        </section>

        {/* Section 3: Third-Party Type Focus */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-[#FFC20A] rounded-full" />
            <h2 className="text-xl font-bold text-gray-900">Third-Party Type Focus</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* HCO vs Vendor Bar Chart - 使用 entry.fill */}
            <SectionCard title="HCO vs Vendor Spending" subtitle="Under current BU selection">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={thirdPartyComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6B7280" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 12 }} stroke="#6B7280" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Spending" radius={[4, 4, 0, 0]}>
                      {thirdPartyComparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            {/* Explanation Card */}
            <SectionCard title="About This Dashboard" subtitle="Usage guidance">
              <div className="h-[280px] flex flex-col justify-center">
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-[#005EB8] mt-0.5 flex-shrink-0" />
                    <p>
                      Use this dashboard to understand BU-level spending patterns across different HCO types and
                      organizational structures.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarDays className="w-5 h-5 text-[#009FDA] mt-0.5 flex-shrink-0" />
                    <p>Filter by Quarter and BU to drill down into specific timeframes and business unit activities.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-[#FFC20A] mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                    <p>
                      Sub-level breakdown is available for <strong>B&I MKT</strong> and <strong>CV MKT</strong> to show
                      Central vs Regional spending patterns.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-[#A855F7] rounded-full" />
            <h2 className="text-xl font-bold text-gray-900">HCO × BU Cross Analysis</h2>
          </div>
          <SectionCard
            title={hcoIdFromUrl ? `BU Engagement for Selected HCO` : "Top 20 HCOs by BU Usage"}
            subtitle="Understand which HCOs are used by which BUs"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                      HCO Name
                    </th>
                    {ALL_PARENT_BUS.map((bu) => (
                      <th key={bu} className="text-center p-3 font-semibold text-gray-700 min-w-[100px]">
                        {bu}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hcoXBuHeatmapData.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white">{row.hcoName}</td>
                      {ALL_PARENT_BUS.map((bu) => {
                        const amount = (row as any)[bu] || 0
                        const maxAmount = Math.max(
                          ...hcoXBuHeatmapData.map((r) => Math.max(...ALL_PARENT_BUS.map((b) => (r as any)[b] || 0))),
                        )
                        const opacity = amount > 0 ? 0.2 + (amount / maxAmount) * 0.8 : 0

                        return (
                          <td
                            key={bu}
                            className="p-3 text-center"
                            style={{
                              backgroundColor: amount > 0 ? `rgba(0, 94, 184, ${opacity})` : "transparent",
                            }}
                          >
                            {amount > 0 ? (
                              <span className={amount / maxAmount > 0.5 ? "text-white font-semibold" : "text-gray-900"}>
                                {formatCurrency(amount)}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </section>
      </main>
    </div>
  )
}
