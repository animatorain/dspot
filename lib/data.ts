// ============================================
// 共享数据模型和常量
// ============================================

// 颜色常量
export const COLORS = {
  primary: "#005EB8",
  secondary: "#009FDA",
  accent: "#FFC20A",
  neutral: "#6C757D",
  purple: "#A855F7",
  red: "#E53935",
  green: "#43A047",
  orange: "#FB8C00",
  pink: "#EC407A",
}

export const BU_COLORS: Record<string, string> = {
  "B&I MKT": "#005EB8",
  "B&I Sales": "#009FDA",
  "CKM-KAM": "#FFC20A",
  "CV MKT": "#A855F7",
  "CV Sales": "#43A047",
  Medical: "#E53935",
  "S&CE": "#FB8C00",
  "VA&P": "#EC407A",
}

export const BU_COLORS_ARRAY = ["#005EB8", "#009FDA", "#FFC20A", "#10B981", "#8B5CF6", "#F97316", "#EC4899", "#14B8A6"]

export const HCO_CATEGORY_COLORS: Record<string, string> = {
  University: "#005EB8",
  Association: "#FFC20A",
  Foundation: "#009FDA",
  "Non-profit": "#6C757D",
  Other: "#A855F7",
}

// ============================================
// 类型定义
// ============================================
export interface UnifiedActivityRecord {
  yearQuarter: string
  thirdPartyType: "HCO" | "Vendor"
  bu: string
  amount: number
  count: number
  activityType: "event" | "non-event" // 新增字段
}

export interface HcoData {
  hcoName: string
  category: "University" | "Association" | "Foundation" | "Non-profit" | "Other"
  amount: number
}

// 新增：HCO 分类数据表类型
export interface HcoBreakdownRecord {
  year: number
  thirdPartyType: "HCO" | "Vendor"
  hcoType: string // 大学、基金会、民办非企业单位、学协会等
  hcoCategorySystem: string // 学协会-国家级、学协会-省级等
  buSubLevel: string // BU 子级，如 B&I MKT-Central MKT
  amount: number
  count: number
}

// 新增：HCO Profiling 数据表类型
export interface HcoMasterRecord {
  year: number
  entityName: string
  totalAmount: number
  activityCount: number
  avgAmount: number
  avgAmountMillion: number
  bubbleSize: number
}

// 新增：未来完整版数据结构 (Future Complete Version Data Structures)
// ============================================

// Activity Summary - 用于 Executive Overview
export interface ActivitySummaryRecord {
  yearQuarter: string
  bu: string
  thirdPartyType: "HCO" | "Vendor"
  activityType: "event" | "non-event"
  amount: number
  count: number
}

// HCO Year Summary - HCO × Year 粒度
export interface HcoYearSummaryRecord {
  year: number
  hcoId: string
  hcoName: string
  category: "Association" | "Foundation" | "University" | "Non-profit" | "Other"
  totalAmount: number
  activityCount: number
}

// HCO BU Year Summary - HCO × BU × Year 粒度
export interface HcoBuYearSummaryRecord {
  year: number
  hcoId: string
  hcoName: string
  bu: string
  totalAmount: number
  activityCount: number
}

// ============================================
// BU 子级到父级 BU 的映射
// ============================================
export const BU_SUBLEVEL_TO_PARENT: Record<string, string> = {
  // B&I MKT 子级
  "B&I MKT-Central MKT": "B&I MKT",
  "B&I MKT-Regional MKT": "B&I MKT",
  "B&I MKT-Others Dimission": "B&I MKT",
  // CV MKT 子级
  "CV MKT-Central MKT": "CV MKT",
  "CV MKT-Regional MKT": "CV MKT",
  "CV MKT-Others Dimission": "CV MKT",
  // 没有子级的 BU，父级就是自身
  "B&I Sales": "B&I Sales",
  "CKM-KAM": "CKM-KAM",
  "CV Sales": "CV Sales",
  Medical: "Medical",
  "VA&P": "VA&P",
  "S&CE": "S&CE",
}

// 获取父级 BU
export function getParentBu(buSubLevel: string): string {
  return BU_SUBLEVEL_TO_PARENT[buSubLevel] || buSubLevel
}

// 判断一个 BU 是否有子级
export function hasSubLevels(bu: string): boolean {
  return bu === "B&I MKT" || bu === "CV MKT"
}

// 获取某个父级 BU 的所有子级
export function getSubLevels(parentBu: string): string[] {
  return Object.entries(BU_SUBLEVEL_TO_PARENT)
    .filter(([_, parent]) => parent === parentBu)
    .map(([subLevel]) => subLevel)
    .filter((subLevel) => subLevel !== parentBu) // 排除自身
}

// HCO 类型中英文映射
export const HCO_TYPE_MAP: Record<string, string> = {
  大学: "University",
  基金会: "Foundation",
  民办非企业单位: "Non-profit",
  学协会: "Association",
}

export function getHcoTypeEnglish(chineseType: string): string {
  return HCO_TYPE_MAP[chineseType] || "Other"
}

// 获取 HCO 类型（根据名称推断）
export function getHcoCategory(entityName: string): string {
  if (!entityName) return "Other"

  // Foundation - 基金会
  if (entityName.includes("基金会") || entityName.includes("基金")) {
    return "Foundation"
  }

  // University - 大学、学院
  if (entityName.includes("大学") || entityName.includes("学院")) {
    return "University"
  }

  // Non-profit - 医院、研究院、研究所、研究中心、中心
  if (
    entityName.includes("医院") ||
    entityName.includes("研究院") ||
    entityName.includes("研究所") ||
    entityName.includes("研究中心") ||
    entityName.includes("服务中心") ||
    entityName.includes("促进中心") ||
    entityName.includes("关爱中心")
  ) {
    return "Non-profit"
  }

  // Association - 协会、学会、联合会、联盟、促进会
  if (
    entityName.includes("协会") ||
    entityName.includes("学会") ||
    entityName.includes("联合会") ||
    entityName.includes("联盟") ||
    entityName.includes("促进会") ||
    entityName.includes("商会")
  ) {
    return "Association"
  }

  // 其他全部归为 Other
  return "Other"
}

// BU 父级映射
// 简化 getParentBu 函数，移除 BU_SUBLEVEL_TO_PARENT 常量
// export function getParentBu(buSubLevel: string): string {
//   if (!buSubLevel) return "Other"
//   if (buSubLevel.startsWith("B&I MKT")) return "B&I MKT"
//   if (buSubLevel.startsWith("CV MKT")) return "CV MKT"
//   if (buSubLevel.startsWith("B&I Sales")) return "B&I Sales"
//   if (buSubLevel.startsWith("CV Sales")) return "CV Sales"
//   if (buSubLevel.startsWith("Medical")) return "Medical"
//   if (buSubLevel.startsWith("S&CE")) return "S&CE"
//   if (buSubLevel.startsWith("VA&P")) return "VA&P"
//   if (buSubLevel.startsWith("CKM-KAM")) return "CKM-KAM"
//   return buSubLevel
// }

// ============================================
// 统一活动数据（现有）
// ============================================
export const unifiedActivityData: UnifiedActivityRecord[] = [
  // 2024Q1 - HCO event: 20,144,288 / 68; Vendor event: 1,990,000 / 2
  { yearQuarter: "2024Q1", thirdPartyType: "HCO", bu: "B&I MKT", amount: 4753528, count: 4, activityType: "event" },
  { yearQuarter: "2024Q1", thirdPartyType: "HCO", bu: "B&I Sales", amount: 2828586, count: 12, activityType: "event" },
  { yearQuarter: "2024Q1", thirdPartyType: "HCO", bu: "CKM-KAM", amount: 2100000, count: 13, activityType: "event" },
  { yearQuarter: "2024Q1", thirdPartyType: "HCO", bu: "CV MKT", amount: 6328440, count: 9, activityType: "event" },
  { yearQuarter: "2024Q1", thirdPartyType: "HCO", bu: "CV Sales", amount: 2833734, count: 24, activityType: "event" },
  { yearQuarter: "2024Q1", thirdPartyType: "HCO", bu: "Medical", amount: 100000, count: 1, activityType: "event" },
  { yearQuarter: "2024Q1", thirdPartyType: "HCO", bu: "VA&P", amount: 1200000, count: 5, activityType: "event" },
  { yearQuarter: "2024Q1", thirdPartyType: "Vendor", bu: "B&I MKT", amount: 1990000, count: 2, activityType: "event" },

  // 2024Q2 - HCO event: 30,413,047 / 173; HCO non-event: 200,000 / 1; Vendor event: 4,371,785 / 3
  { yearQuarter: "2024Q2", thirdPartyType: "HCO", bu: "B&I MKT", amount: 8650571, count: 5, activityType: "event" },
  { yearQuarter: "2024Q2", thirdPartyType: "HCO", bu: "B&I Sales", amount: 4094000, count: 43, activityType: "event" },
  {
    yearQuarter: "2024Q2",
    thirdPartyType: "HCO",
    bu: "B&I Sales",
    amount: 200000,
    count: 1,
    activityType: "non-event",
  },
  { yearQuarter: "2024Q2", thirdPartyType: "HCO", bu: "CKM-KAM", amount: 2290000, count: 29, activityType: "event" },
  { yearQuarter: "2024Q2", thirdPartyType: "HCO", bu: "CV MKT", amount: 4293021, count: 14, activityType: "event" },
  { yearQuarter: "2024Q2", thirdPartyType: "HCO", bu: "CV Sales", amount: 4215455, count: 49, activityType: "event" },
  { yearQuarter: "2024Q2", thirdPartyType: "HCO", bu: "Medical", amount: 5620000, count: 24, activityType: "event" },
  { yearQuarter: "2024Q2", thirdPartyType: "HCO", bu: "VA&P", amount: 1250000, count: 9, activityType: "event" },
  { yearQuarter: "2024Q2", thirdPartyType: "Vendor", bu: "B&I MKT", amount: 3971785, count: 2, activityType: "event" },
  { yearQuarter: "2024Q2", thirdPartyType: "Vendor", bu: "VA&P", amount: 400000, count: 1, activityType: "event" },

  // 2024Q3 - HCO event: 30,966,923 / 195; HCO non-event: 200,000 / 2; Vendor event: 670,000 / 4
  { yearQuarter: "2024Q3", thirdPartyType: "HCO", bu: "B&I MKT", amount: 2389585, count: 5, activityType: "event" },
  { yearQuarter: "2024Q3", thirdPartyType: "HCO", bu: "B&I Sales", amount: 1993000, count: 46, activityType: "event" },
  {
    yearQuarter: "2024Q3",
    thirdPartyType: "HCO",
    bu: "B&I Sales",
    amount: 200000,
    count: 2,
    activityType: "non-event",
  },
  { yearQuarter: "2024Q3", thirdPartyType: "HCO", bu: "CKM-KAM", amount: 2261000, count: 25, activityType: "event" },
  { yearQuarter: "2024Q3", thirdPartyType: "HCO", bu: "CV MKT", amount: 9490348, count: 11, activityType: "event" },
  { yearQuarter: "2024Q3", thirdPartyType: "HCO", bu: "CV Sales", amount: 7332990, count: 76, activityType: "event" },
  { yearQuarter: "2024Q3", thirdPartyType: "HCO", bu: "Medical", amount: 5620000, count: 21, activityType: "event" },
  { yearQuarter: "2024Q3", thirdPartyType: "HCO", bu: "VA&P", amount: 1880000, count: 11, activityType: "event" },
  { yearQuarter: "2024Q3", thirdPartyType: "Vendor", bu: "B&I Sales", amount: 450000, count: 2, activityType: "event" },
  { yearQuarter: "2024Q3", thirdPartyType: "Vendor", bu: "CKM-KAM", amount: 220000, count: 2, activityType: "event" },

  // 2024Q4 - HCO event: 14,848,520 / 205; HCO non-event: 336,000 / 5; Vendor event: 860,000 / 6; Vendor non-event: 3,945,280 / 1
  { yearQuarter: "2024Q4", thirdPartyType: "HCO", bu: "B&I MKT", amount: 2100000, count: 7, activityType: "event" },
  { yearQuarter: "2024Q4", thirdPartyType: "HCO", bu: "B&I Sales", amount: 1404000, count: 44, activityType: "event" },
  {
    yearQuarter: "2024Q4",
    thirdPartyType: "HCO",
    bu: "B&I Sales",
    amount: 336000,
    count: 5,
    activityType: "non-event",
  },
  { yearQuarter: "2024Q4", thirdPartyType: "HCO", bu: "CKM-KAM", amount: 1490000, count: 16, activityType: "event" },
  { yearQuarter: "2024Q4", thirdPartyType: "HCO", bu: "CV MKT", amount: 2013520, count: 9, activityType: "event" },
  { yearQuarter: "2024Q4", thirdPartyType: "HCO", bu: "CV Sales", amount: 3255000, count: 96, activityType: "event" },
  { yearQuarter: "2024Q4", thirdPartyType: "HCO", bu: "Medical", amount: 2700000, count: 16, activityType: "event" },
  { yearQuarter: "2024Q4", thirdPartyType: "HCO", bu: "VA&P", amount: 1886000, count: 17, activityType: "event" },
  { yearQuarter: "2024Q4", thirdPartyType: "Vendor", bu: "B&I Sales", amount: 160000, count: 3, activityType: "event" },
  { yearQuarter: "2024Q4", thirdPartyType: "Vendor", bu: "CKM-KAM", amount: 600000, count: 2, activityType: "event" },
  {
    yearQuarter: "2024Q4",
    thirdPartyType: "Vendor",
    bu: "Medical",
    amount: 3945280,
    count: 1,
    activityType: "non-event",
  },
  { yearQuarter: "2024Q4", thirdPartyType: "Vendor", bu: "S&CE", amount: 100000, count: 1, activityType: "event" },

  // 2025Q1 - HCO event: 14,235,000 / 52; HCO non-event: 455,000 / 2; Vendor event: 840,000 / 1
  { yearQuarter: "2025Q1", thirdPartyType: "HCO", bu: "B&I MKT", amount: 7980000, count: 9, activityType: "event" },
  { yearQuarter: "2025Q1", thirdPartyType: "HCO", bu: "B&I MKT", amount: 455000, count: 2, activityType: "non-event" },
  { yearQuarter: "2025Q1", thirdPartyType: "HCO", bu: "B&I Sales", amount: 1340000, count: 15, activityType: "event" },
  { yearQuarter: "2025Q1", thirdPartyType: "HCO", bu: "CKM-KAM", amount: 760000, count: 7, activityType: "event" },
  { yearQuarter: "2025Q1", thirdPartyType: "HCO", bu: "CV MKT", amount: 2720000, count: 7, activityType: "event" },
  { yearQuarter: "2025Q1", thirdPartyType: "HCO", bu: "CV Sales", amount: 650000, count: 9, activityType: "event" },
  { yearQuarter: "2025Q1", thirdPartyType: "HCO", bu: "Medical", amount: 30000, count: 1, activityType: "event" },
  { yearQuarter: "2025Q1", thirdPartyType: "HCO", bu: "VA&P", amount: 755000, count: 4, activityType: "event" },
  { yearQuarter: "2025Q1", thirdPartyType: "Vendor", bu: "B&I MKT", amount: 840000, count: 1, activityType: "event" },

  // 2025Q2 - HCO event: 28,605,000 / 184; HCO non-event: 2,782,934 / 7; Vendor event: 310,000 / 3
  { yearQuarter: "2025Q2", thirdPartyType: "HCO", bu: "B&I MKT", amount: 5980000, count: 16, activityType: "event" },
  { yearQuarter: "2025Q2", thirdPartyType: "HCO", bu: "B&I Sales", amount: 2280000, count: 46, activityType: "event" },
  { yearQuarter: "2025Q2", thirdPartyType: "HCO", bu: "CKM-KAM", amount: 1800000, count: 19, activityType: "event" },
  { yearQuarter: "2025Q2", thirdPartyType: "HCO", bu: "CV MKT", amount: 13570000, count: 29, activityType: "event" },
  { yearQuarter: "2025Q2", thirdPartyType: "HCO", bu: "CV Sales", amount: 3075000, count: 64, activityType: "event" },
  { yearQuarter: "2025Q2", thirdPartyType: "HCO", bu: "Medical", amount: 327066, count: 3, activityType: "event" },
  { yearQuarter: "2025Q2", thirdPartyType: "HCO", bu: "Medical", amount: 2782934, count: 2, activityType: "non-event" },
  { yearQuarter: "2025Q2", thirdPartyType: "HCO", bu: "VA&P", amount: 1573000, count: 7, activityType: "event" },
  { yearQuarter: "2025Q2", thirdPartyType: "Vendor", bu: "B&I Sales", amount: 50000, count: 1, activityType: "event" },
  { yearQuarter: "2025Q2", thirdPartyType: "Vendor", bu: "CKM-KAM", amount: 260000, count: 2, activityType: "event" },

  // 2025Q3 - HCO event: 17,220,000 / 171; HCO non-event: 653,000 / 19
  { yearQuarter: "2025Q3", thirdPartyType: "HCO", bu: "B&I MKT", amount: 1460000, count: 15, activityType: "event" },
  { yearQuarter: "2025Q3", thirdPartyType: "HCO", bu: "B&I Sales", amount: 2067000, count: 30, activityType: "event" },
  {
    yearQuarter: "2025Q3",
    thirdPartyType: "HCO",
    bu: "B&I Sales",
    amount: 653000,
    count: 10,
    activityType: "non-event",
  },
  { yearQuarter: "2025Q3", thirdPartyType: "HCO", bu: "CKM-KAM", amount: 2110000, count: 19, activityType: "event" },
  { yearQuarter: "2025Q3", thirdPartyType: "HCO", bu: "CV MKT", amount: 2570000, count: 10, activityType: "event" },
  { yearQuarter: "2025Q3", thirdPartyType: "HCO", bu: "CV Sales", amount: 4660000, count: 63, activityType: "event" },
  { yearQuarter: "2025Q3", thirdPartyType: "HCO", bu: "CV Sales", amount: 0, count: 9, activityType: "non-event" },
  { yearQuarter: "2025Q3", thirdPartyType: "HCO", bu: "Medical", amount: 1210000, count: 4, activityType: "event" },
  { yearQuarter: "2025Q3", thirdPartyType: "HCO", bu: "VA&P", amount: 3143000, count: 30, activityType: "event" },
]

export const activitySummary: ActivitySummaryRecord[] = unifiedActivityData.map((record) => ({
  yearQuarter: record.yearQuarter,
  bu: record.bu,
  thirdPartyType: record.thirdPartyType,
  activityType: record.activityType,
  amount: record.amount,
  count: record.count,
}))

// ============================================
// HCO 分类数据（新增）
// ============================================
export const hcoBreakdownRows: HcoBreakdownRecord[] = [
  // 2024 年 - B&I MKT 子级数据
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "大学",
    hcoCategorySystem: "",
    buSubLevel: "B&I MKT-Central MKT",
    amount: 8500000,
    count: 12,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "学协会",
    hcoCategorySystem: "学协会-国家级",
    buSubLevel: "B&I MKT-Central MKT",
    amount: 4200000,
    count: 8,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "学协会",
    hcoCategorySystem: "学协会-省级",
    buSubLevel: "B&I MKT-Regional MKT",
    amount: 3100000,
    count: 15,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "基金会",
    hcoCategorySystem: "",
    buSubLevel: "B&I MKT-Regional MKT",
    amount: 1800000,
    count: 5,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "民办非企业单位",
    hcoCategorySystem: "",
    buSubLevel: "B&I MKT-Others Dimission",
    amount: 600000,
    count: 3,
  },
  // 2024 年 - CV MKT 子级数据
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "大学",
    hcoCategorySystem: "",
    buSubLevel: "CV MKT-Central MKT",
    amount: 12000000,
    count: 18,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "学协会",
    hcoCategorySystem: "学协会-国家级",
    buSubLevel: "CV MKT-Central MKT",
    amount: 5500000,
    count: 10,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "学协会",
    hcoCategorySystem: "学协会-省级",
    buSubLevel: "CV MKT-Regional MKT",
    amount: 2800000,
    count: 12,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "基金会",
    hcoCategorySystem: "",
    buSubLevel: "CV MKT-Regional MKT",
    amount: 1200000,
    count: 4,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "民办非企业单位",
    hcoCategorySystem: "",
    buSubLevel: "CV MKT-Others Dimission",
    amount: 400000,
    count: 2,
  },
  // 2024 年 - 其他 BU（无子级）
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "大学",
    hcoCategorySystem: "",
    buSubLevel: "B&I Sales",
    amount: 6500000,
    count: 80,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "学协会",
    hcoCategorySystem: "学协会-省级",
    buSubLevel: "B&I Sales",
    amount: 2800000,
    count: 45,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "大学",
    hcoCategorySystem: "",
    buSubLevel: "CKM-KAM",
    amount: 4200000,
    count: 40,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "学协会",
    hcoCategorySystem: "学协会-地市级",
    buSubLevel: "CKM-KAM",
    amount: 2100000,
    count: 25,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "大学",
    hcoCategorySystem: "",
    buSubLevel: "CV Sales",
    amount: 10200000,
    count: 150,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "学协会",
    hcoCategorySystem: "学协会-省级",
    buSubLevel: "CV Sales",
    amount: 4800000,
    count: 60,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "大学",
    hcoCategorySystem: "",
    buSubLevel: "Medical",
    amount: 8500000,
    count: 35,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "基金会",
    hcoCategorySystem: "",
    buSubLevel: "Medical",
    amount: 3200000,
    count: 15,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "大学",
    hcoCategorySystem: "",
    buSubLevel: "VA&P",
    amount: 3800000,
    count: 25,
  },
  {
    year: 2024,
    thirdPartyType: "HCO",
    hcoType: "民办非企业单位",
    hcoCategorySystem: "",
    buSubLevel: "VA&P",
    amount: 1400000,
    count: 10,
  },
  // 2025 年 - B&I MKT 子级数据
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "大学",
    hcoCategorySystem: "",
    buSubLevel: "B&I MKT-Central MKT",
    amount: 9200000,
    count: 20,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "学协会",
    hcoCategorySystem: "学协会-国家级",
    buSubLevel: "B&I MKT-Central MKT",
    amount: 3800000,
    count: 10,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "学协会",
    hcoCategorySystem: "学协会-省级",
    buSubLevel: "B&I MKT-Regional MKT",
    amount: 2500000,
    count: 12,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "基金会",
    hcoCategorySystem: "",
    buSubLevel: "B&I MKT-Regional MKT",
    amount: 1200000,
    count: 4,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "民办非企业单位",
    hcoCategorySystem: "",
    buSubLevel: "B&I MKT-Others Dimission",
    amount: 450000,
    count: 2,
  },
  // 2025 年 - CV MKT 子级数据
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "大学",
    hcoCategorySystem: "",
    buSubLevel: "CV MKT-Central MKT",
    amount: 11500000,
    count: 22,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "学协会",
    hcoCategorySystem: "学协会-国家级",
    buSubLevel: "CV MKT-Central MKT",
    amount: 4800000,
    count: 12,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "学协会",
    hcoCategorySystem: "学协会-省级",
    buSubLevel: "CV MKT-Regional MKT",
    amount: 2200000,
    count: 10,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "基金会",
    hcoCategorySystem: "",
    buSubLevel: "CV MKT-Regional MKT",
    amount: 900000,
    count: 3,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "民办非企业单位",
    hcoCategorySystem: "",
    buSubLevel: "CV MKT-Others Dimission",
    amount: 350000,
    count: 2,
  },
  // 2025 年 - 其他 BU
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "大学",
    hcoCategorySystem: "",
    buSubLevel: "B&I Sales",
    amount: 4200000,
    count: 60,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "学协会",
    hcoCategorySystem: "学协会-省级",
    buSubLevel: "B&I Sales",
    amount: 1800000,
    count: 30,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "大学",
    hcoCategorySystem: "",
    buSubLevel: "CKM-KAM",
    amount: 2800000,
    count: 28,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "学协会",
    hcoCategorySystem: "学协会-地市级",
    buSubLevel: "CKM-KAM",
    amount: 1500000,
    count: 18,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "大学",
    hcoCategorySystem: "",
    buSubLevel: "CV Sales",
    amount: 5200000,
    count: 90,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "学协会",
    hcoCategorySystem: "学协会-省级",
    buSubLevel: "CV Sales",
    amount: 2800000,
    count: 45,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "大学",
    hcoCategorySystem: "",
    buSubLevel: "Medical",
    amount: 2800000,
    count: 8,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "基金会",
    hcoCategorySystem: "",
    buSubLevel: "Medical",
    amount: 1200000,
    count: 4,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "大学",
    hcoCategorySystem: "",
    buSubLevel: "VA&P",
    amount: 3200000,
    count: 28,
  },
  {
    year: 2025,
    thirdPartyType: "HCO",
    hcoType: "民办非企业单位",
    hcoCategorySystem: "",
    buSubLevel: "VA&P",
    amount: 1100000,
    count: 12,
  },
  // Vendor 数据
  {
    year: 2024,
    thirdPartyType: "Vendor",
    hcoType: "",
    hcoCategorySystem: "",
    buSubLevel: "B&I MKT-Central MKT",
    amount: 3500000,
    count: 3,
  },
  {
    year: 2024,
    thirdPartyType: "Vendor",
    hcoType: "",
    hcoCategorySystem: "",
    buSubLevel: "VA&P",
    amount: 400000,
    count: 1,
  },
  {
    year: 2024,
    thirdPartyType: "Vendor",
    hcoType: "",
    hcoCategorySystem: "",
    buSubLevel: "Medical",
    amount: 3945280,
    count: 1,
  },
  {
    year: 2025,
    thirdPartyType: "Vendor",
    hcoType: "",
    hcoCategorySystem: "",
    buSubLevel: "B&I MKT-Central MKT",
    amount: 840000,
    count: 1,
  },
  {
    year: 2025,
    thirdPartyType: "Vendor",
    hcoType: "",
    hcoCategorySystem: "",
    buSubLevel: "CKM-KAM",
    amount: 260000,
    count: 2,
  },
]

// ============================================
// HCO Year Summary Mock Data (未来完整版)
// ============================================
export const hcoYearSummary: HcoYearSummaryRecord[] = [
  // 2024 data - top HCOs with mock IDs
  {
    year: 2024,
    hcoId: "HCO001",
    hcoName: "中国医药教育协会",
    category: "Association",
    totalAmount: 5565171,
    activityCount: 25,
  },
  {
    year: 2024,
    hcoId: "HCO002",
    hcoName: "北京慢性病防治与健康教育研究会",
    category: "Association",
    totalAmount: 4673388,
    activityCount: 17,
  },
  {
    year: 2024,
    hcoId: "HCO003",
    hcoName: "北京医学奖励基金会",
    category: "Foundation",
    totalAmount: 3741786,
    activityCount: 16,
  },
  {
    year: 2024,
    hcoId: "HCO004",
    hcoName: "苏州工业园区东方华夏心血管健康研究院",
    category: "Non-profit",
    totalAmount: 8705319,
    activityCount: 11,
  },
  {
    year: 2024,
    hcoId: "HCO005",
    hcoName: "中国人体健康科技促进会",
    category: "Association",
    totalAmount: 9090235,
    activityCount: 10,
  },
  {
    year: 2024,
    hcoId: "HCO006",
    hcoName: "广东省医学会",
    category: "Association",
    totalAmount: 695000,
    activityCount: 12,
  },
  {
    year: 2024,
    hcoId: "HCO007",
    hcoName: "北京生命绿洲公益服务中心",
    category: "Non-profit",
    totalAmount: 5375230,
    activityCount: 4,
  },
  {
    year: 2024,
    hcoId: "HCO008",
    hcoName: "中国初级卫生保健基金会",
    category: "Foundation",
    totalAmount: 3279448,
    activityCount: 3,
  },
  {
    year: 2024,
    hcoId: "HCO009",
    hcoName: "中华医学会",
    category: "Association",
    totalAmount: 1340000,
    activityCount: 7,
  },
  {
    year: 2024,
    hcoId: "HCO010",
    hcoName: "中国医院协会",
    category: "Association",
    totalAmount: 1300000,
    activityCount: 5,
  },

  // 2025 data - some continuing, some new
  {
    year: 2025,
    hcoId: "HCO001",
    hcoName: "中国医药教育协会",
    category: "Association",
    totalAmount: 6200000,
    activityCount: 28,
  },
  {
    year: 2025,
    hcoId: "HCO002",
    hcoName: "北京慢性病防治与健康教育研究会",
    category: "Association",
    totalAmount: 5100000,
    activityCount: 19,
  },
  {
    year: 2025,
    hcoId: "HCO003",
    hcoName: "北京医学奖励基金会",
    category: "Foundation",
    totalAmount: 4200000,
    activityCount: 18,
  },
  {
    year: 2025,
    hcoId: "HCO004",
    hcoName: "苏州工业园区东方华夏心血管健康研究院",
    category: "Non-profit",
    totalAmount: 9500000,
    activityCount: 13,
  },
  {
    year: 2025,
    hcoId: "HCO011",
    hcoName: "上海医学会",
    category: "Association",
    totalAmount: 7800000,
    activityCount: 22,
  },
  {
    year: 2025,
    hcoId: "HCO012",
    hcoName: "浙江省医学会",
    category: "Association",
    totalAmount: 6500000,
    activityCount: 18,
  },
  {
    year: 2025,
    hcoId: "HCO013",
    hcoName: "四川省医学会",
    category: "Association",
    totalAmount: 5200000,
    activityCount: 15,
  },
  {
    year: 2025,
    hcoId: "HCO009",
    hcoName: "中华医学会",
    category: "Association",
    totalAmount: 1500000,
    activityCount: 8,
  },
  {
    year: 2025,
    hcoId: "HCO014",
    hcoName: "江苏省医学会",
    category: "Association",
    totalAmount: 4800000,
    activityCount: 14,
  },
  {
    year: 2025,
    hcoId: "HCO015",
    hcoName: "广东省医院协会",
    category: "Association",
    totalAmount: 3900000,
    activityCount: 11,
  },
]

// ============================================
// HCO BU Year Summary Mock Data (未来完整版)
// ============================================
export const hcoBuYearSummary: HcoBuYearSummaryRecord[] = [
  // 2024 - HCO001 used by multiple BUs
  { year: 2024, hcoId: "HCO001", hcoName: "中国医药教育协会", bu: "B&I MKT", totalAmount: 2500000, activityCount: 10 },
  { year: 2024, hcoId: "HCO001", hcoName: "中国医药教育协会", bu: "CV MKT", totalAmount: 1800000, activityCount: 8 },
  { year: 2024, hcoId: "HCO001", hcoName: "中国医药教育协会", bu: "Medical", totalAmount: 1265171, activityCount: 7 },

  // 2024 - HCO002
  {
    year: 2024,
    hcoId: "HCO002",
    hcoName: "北京慢性病防治与健康教育研究会",
    bu: "B&I MKT",
    totalAmount: 2800000,
    activityCount: 10,
  },
  {
    year: 2024,
    hcoId: "HCO002",
    hcoName: "北京慢性病防治与健康教育研究会",
    bu: "CV Sales",
    totalAmount: 1873388,
    activityCount: 7,
  },

  // 2024 - HCO003
  { year: 2024, hcoId: "HCO003", hcoName: "北京医学奖励基金会", bu: "CV MKT", totalAmount: 2200000, activityCount: 9 },
  {
    year: 2024,
    hcoId: "HCO003",
    hcoName: "北京医学奖励基金会",
    bu: "B&I Sales",
    totalAmount: 1541786,
    activityCount: 7,
  },

  // 2024 - HCO004
  {
    year: 2024,
    hcoId: "HCO004",
    hcoName: "苏州工业园区东方华夏心血管健康研究院",
    bu: "CV MKT",
    totalAmount: 6000000,
    activityCount: 7,
  },
  {
    year: 2024,
    hcoId: "HCO004",
    hcoName: "苏州工业园区东方华夏心血管健康研究院",
    bu: "Medical",
    totalAmount: 2705319,
    activityCount: 4,
  },

  // 2024 - HCO005
  {
    year: 2024,
    hcoId: "HCO005",
    hcoName: "中国人体健康科技促进会",
    bu: "B&I MKT",
    totalAmount: 5000000,
    activityCount: 5,
  },
  {
    year: 2024,
    hcoId: "HCO005",
    hcoName: "中国人体健康科技促进会",
    bu: "CV MKT",
    totalAmount: 4090235,
    activityCount: 5,
  },

  // 2025 - HCO001 continued
  { year: 2025, hcoId: "HCO001", hcoName: "中国医药教育协会", bu: "B&I MKT", totalAmount: 2800000, activityCount: 12 },
  { year: 2025, hcoId: "HCO001", hcoName: "中国医药教育协会", bu: "CV MKT", totalAmount: 2000000, activityCount: 9 },
  { year: 2025, hcoId: "HCO001", hcoName: "中国医药教育协会", bu: "Medical", totalAmount: 1400000, activityCount: 7 },

  // 2025 - HCO002 continued
  {
    year: 2025,
    hcoId: "HCO002",
    hcoName: "北京慢性病防治与健康教育研究会",
    bu: "B&I MKT",
    totalAmount: 3000000,
    activityCount: 11,
  },
  {
    year: 2025,
    hcoId: "HCO002",
    hcoName: "北京慢性病防治与健康教育研究会",
    bu: "CV Sales",
    totalAmount: 2100000,
    activityCount: 8,
  },

  // 2025 - HCO011 new
  { year: 2025, hcoId: "HCO011", hcoName: "上海医学会", bu: "B&I MKT", totalAmount: 3500000, activityCount: 10 },
  { year: 2025, hcoId: "HCO011", hcoName: "上海医学会", bu: "CV MKT", totalAmount: 2800000, activityCount: 8 },
  { year: 2025, hcoId: "HCO011", hcoName: "上海医学会", bu: "B&I Sales", totalAmount: 1500000, activityCount: 4 },

  // 2025 - HCO012 new
  { year: 2025, hcoId: "HCO012", hcoName: "浙江省医学会", bu: "CV MKT", totalAmount: 4000000, activityCount: 11 },
  { year: 2025, hcoId: "HCO012", hcoName: "浙江省医学会", bu: "Medical", totalAmount: 2500000, activityCount: 7 },
]

// ============================================
// Helper Functions for HCO Status
// ============================================
export function getHcoStatus(hcoId: string): "new_2025" | "continued" | "used_2024_only" | "one_time" {
  const years = new Set<number>()
  hcoYearSummary.filter((r) => r.hcoId === hcoId).forEach((r) => years.add(r.year))

  const has2024 = years.has(2024)
  const has2025 = years.has(2025)

  if (has2025 && !has2024) return "new_2025"
  if (has2024 && has2025) return "continued"
  if (has2024 && !has2025) return "used_2024_only"
  return "one_time"
}

export function getHcoStatusLabel(status: "new_2025" | "continued" | "used_2024_only" | "one_time"): string {
  const labels = {
    new_2025: "New in 2025",
    continued: "Continued (2024 & 2025)",
    used_2024_only: "Used in 2024 only",
    one_time: "One-time HCOs",
  }
  return labels[status]
}

// ============================================
// Utility function for formatting currency
// ============================================
export function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

// ============================================
// HCO 占位数据
// ============================================
export const mockHcoData: HcoData[] = [
  { hcoName: "Beijing Medical University", category: "University", amount: 18500000 },
  { hcoName: "Shanghai Health Association", category: "Association", amount: 15200000 },
  { hcoName: "China Medical Foundation", category: "Foundation", amount: 12800000 },
  { hcoName: "National Healthcare Alliance", category: "Non-profit", amount: 11500000 },
  { hcoName: "Guangzhou University Hospital", category: "University", amount: 10200000 },
  { hcoName: "Shenzhen Medical Center", category: "University", amount: 9800000 },
  { hcoName: "Healthcare Research Institute", category: "Other", amount: 8500000 },
  { hcoName: "Medical Education Foundation", category: "Foundation", amount: 7200000 },
  { hcoName: "Professional Healthcare Association", category: "Association", amount: 6000000 },
]

// ============================================
// HCO Profiling 数据（Page 2 专用）
// 基于用户提供的原始汇总表，2024年+2025年完整数据
// ============================================
export const hcoMasterData: HcoMasterRecord[] = [
  // ========== 2024 年数据 ==========
  {
    year: 2024,
    entityName: "中国医药教育协会",
    totalAmount: 5565171,
    activityCount: 25,
    avgAmount: 222606.84,
    avgAmountMillion: 0.22,
    bubbleSize: 5.57,
  },
  {
    year: 2024,
    entityName: "北京慢性病防治与健康教育研究会",
    totalAmount: 4673388,
    activityCount: 17,
    avgAmount: 274905.18,
    avgAmountMillion: 0.27,
    bubbleSize: 4.67,
  },
  {
    year: 2024,
    entityName: "北京医学奖励基金会",
    totalAmount: 3741786,
    activityCount: 16,
    avgAmount: 233861.63,
    avgAmountMillion: 0.23,
    bubbleSize: 3.74,
  },
  {
    year: 2024,
    entityName: "广东省医学会",
    totalAmount: 695000,
    activityCount: 12,
    avgAmount: 57916.67,
    avgAmountMillion: 0.06,
    bubbleSize: 0.7,
  },
  {
    year: 2024,
    entityName: "苏州工业园区东方华夏心血管健康研究院",
    totalAmount: 8705319,
    activityCount: 11,
    avgAmount: 791392.64,
    avgAmountMillion: 0.79,
    bubbleSize: 8.71,
  },
  {
    year: 2024,
    entityName: "北京心血管疾病防治研究会",
    totalAmount: 3109388,
    activityCount: 11,
    avgAmount: 282671.64,
    avgAmountMillion: 0.28,
    bubbleSize: 3.11,
  },
  {
    year: 2024,
    entityName: "北京整合医学学会",
    totalAmount: 1666000,
    activityCount: 11,
    avgAmount: 151454.55,
    avgAmountMillion: 0.15,
    bubbleSize: 1.67,
  },
  {
    year: 2024,
    entityName: "中国人体健康科技促进会",
    totalAmount: 9090235,
    activityCount: 10,
    avgAmount: 909023.5,
    avgAmountMillion: 0.91,
    bubbleSize: 9.09,
  },
  {
    year: 2024,
    entityName: "中国老年保健协会",
    totalAmount: 3141437,
    activityCount: 10,
    avgAmount: 314143.7,
    avgAmountMillion: 0.31,
    bubbleSize: 3.14,
  },
  {
    year: 2024,
    entityName: "广东省药学会",
    totalAmount: 750000,
    activityCount: 10,
    avgAmount: 75000,
    avgAmountMillion: 0.08,
    bubbleSize: 0.75,
  },
  {
    year: 2024,
    entityName: "北京杰凯心血管健康基金会",
    totalAmount: 2830439,
    activityCount: 9,
    avgAmount: 314493.22,
    avgAmountMillion: 0.31,
    bubbleSize: 2.83,
  },
  {
    year: 2024,
    entityName: "北京围手术期医学研究会",
    totalAmount: 2021983,
    activityCount: 9,
    avgAmount: 224664.78,
    avgAmountMillion: 0.22,
    bubbleSize: 2.02,
  },
  {
    year: 2024,
    entityName: "广东省介入性心脏病学会",
    totalAmount: 280000,
    activityCount: 9,
    avgAmount: 31111.11,
    avgAmountMillion: 0.03,
    bubbleSize: 0.28,
  },
  {
    year: 2024,
    entityName: "中国医疗保健国际交流促进会",
    totalAmount: 1410000,
    activityCount: 8,
    avgAmount: 176250,
    avgAmountMillion: 0.18,
    bubbleSize: 1.41,
  },
  {
    year: 2024,
    entityName: "中华医学会北京分会秘书处",
    totalAmount: 1110000,
    activityCount: 8,
    avgAmount: 138750,
    avgAmountMillion: 0.14,
    bubbleSize: 1.11,
  },
  {
    year: 2024,
    entityName: "中关村精准医学基金会",
    totalAmount: 760000,
    activityCount: 8,
    avgAmount: 95000,
    avgAmountMillion: 0.1,
    bubbleSize: 0.76,
  },
  {
    year: 2024,
    entityName: "广东省医疗行业协会",
    totalAmount: 720000,
    activityCount: 8,
    avgAmount: 90000,
    avgAmountMillion: 0.09,
    bubbleSize: 0.72,
  },
  {
    year: 2024,
    entityName: "浙江省医学会",
    totalAmount: 550000,
    activityCount: 8,
    avgAmount: 68750,
    avgAmountMillion: 0.07,
    bubbleSize: 0.55,
  },
  {
    year: 2024,
    entityName: "中华医学会",
    totalAmount: 1340000,
    activityCount: 7,
    avgAmount: 191428.57,
    avgAmountMillion: 0.19,
    bubbleSize: 1.34,
  },
  {
    year: 2024,
    entityName: "中国康复医学会",
    totalAmount: 990000,
    activityCount: 7,
    avgAmount: 141428.57,
    avgAmountMillion: 0.14,
    bubbleSize: 0.99,
  },
  {
    year: 2024,
    entityName: "北京力生心血管健康基金会",
    totalAmount: 760000,
    activityCount: 7,
    avgAmount: 108571.43,
    avgAmountMillion: 0.11,
    bubbleSize: 0.76,
  },
  {
    year: 2024,
    entityName: "江苏省老年医学学会",
    totalAmount: 430000,
    activityCount: 7,
    avgAmount: 61428.57,
    avgAmountMillion: 0.06,
    bubbleSize: 0.43,
  },
  {
    year: 2024,
    entityName: "中国健康促进与教育协会",
    totalAmount: 2010000,
    activityCount: 6,
    avgAmount: 335000,
    avgAmountMillion: 0.34,
    bubbleSize: 2.01,
  },
  {
    year: 2024,
    entityName: "上海市医师协会",
    totalAmount: 540000,
    activityCount: 6,
    avgAmount: 90000,
    avgAmountMillion: 0.09,
    bubbleSize: 0.54,
  },
  {
    year: 2024,
    entityName: "陕西省医学传播学会",
    totalAmount: 450000,
    activityCount: 6,
    avgAmount: 75000,
    avgAmountMillion: 0.08,
    bubbleSize: 0.45,
  },
  {
    year: 2024,
    entityName: "山西省医师协会",
    totalAmount: 410000,
    activityCount: 6,
    avgAmount: 68333.33,
    avgAmountMillion: 0.07,
    bubbleSize: 0.41,
  },
  {
    year: 2024,
    entityName: "福建省医务志愿者协会",
    totalAmount: 210000,
    activityCount: 6,
    avgAmount: 35000,
    avgAmountMillion: 0.04,
    bubbleSize: 0.21,
  },
  {
    year: 2024,
    entityName: "重庆市医师协会",
    totalAmount: 200000,
    activityCount: 6,
    avgAmount: 33333.33,
    avgAmountMillion: 0.03,
    bubbleSize: 0.2,
  },
  {
    year: 2024,
    entityName: "中国医院协会",
    totalAmount: 1300000,
    activityCount: 5,
    avgAmount: 260000,
    avgAmountMillion: 0.26,
    bubbleSize: 1.3,
  },
  {
    year: 2024,
    entityName: "海峡两岸医药卫生交流协会",
    totalAmount: 330000,
    activityCount: 5,
    avgAmount: 66000,
    avgAmountMillion: 0.07,
    bubbleSize: 0.33,
  },
  {
    year: 2024,
    entityName: "四川省国际医学交流促进会",
    totalAmount: 330000,
    activityCount: 5,
    avgAmount: 66000,
    avgAmountMillion: 0.07,
    bubbleSize: 0.33,
  },
  // ========== 2025 年数据 ==========
  {
    year: 2025,
    entityName: "中国医药教育协会",
    totalAmount: 6200000,
    activityCount: 28,
    avgAmount: 221428.57,
    avgAmountMillion: 0.22,
    bubbleSize: 6.2,
  },
  {
    year: 2025,
    entityName: "北京慢性病防治与健康教育研究会",
    totalAmount: 5100000,
    activityCount: 19,
    avgAmount: 268421.05,
    avgAmountMillion: 0.27,
    bubbleSize: 5.1,
  },
  {
    year: 2025,
    entityName: "北京医学奖励基金会",
    totalAmount: 4200000,
    activityCount: 18,
    avgAmount: 233333.33,
    avgAmountMillion: 0.23,
    bubbleSize: 4.2,
  },
  {
    year: 2025,
    entityName: "苏州工业园区东方华夏心血管健康研究院",
    totalAmount: 9500000,
    activityCount: 13,
    avgAmount: 730769.23,
    avgAmountMillion: 0.73,
    bubbleSize: 9.5,
  },
  {
    year: 2025,
    entityName: "上海医学会",
    totalAmount: 7800000,
    activityCount: 22,
    avgAmount: 354545.45,
    avgAmountMillion: 0.35,
    bubbleSize: 7.8,
  },
  {
    year: 2025,
    entityName: "浙江省医学会",
    totalAmount: 6500000,
    activityCount: 18,
    avgAmount: 361111.11,
    avgAmountMillion: 0.36,
    bubbleSize: 6.5,
  },
  {
    year: 2025,
    entityName: "四川省医学会",
    totalAmount: 5200000,
    activityCount: 15,
    avgAmount: 346666.67,
    avgAmountMillion: 0.35,
    bubbleSize: 5.2,
  },
  {
    year: 2025,
    entityName: "中华医学会",
    totalAmount: 1500000,
    activityCount: 8,
    avgAmount: 187500,
    avgAmountMillion: 0.19,
    bubbleSize: 1.5,
  },
  {
    year: 2025,
    entityName: "江苏省医学会",
    totalAmount: 4800000,
    activityCount: 14,
    avgAmount: 342857.14,
    avgAmountMillion: 0.34,
    bubbleSize: 4.8,
  },
  {
    year: 2025,
    entityName: "广东省医院协会",
    totalAmount: 3900000,
    activityCount: 11,
    avgAmount: 354545.45,
    avgAmountMillion: 0.35,
    bubbleSize: 3.9,
  },
]
