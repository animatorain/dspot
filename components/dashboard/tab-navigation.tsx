"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Building2, Users } from "lucide-react"

const tabs = [
  {
    name: "Executive Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "HCO Profiling",
    href: "/hco-profiling",
    icon: Building2,
  },
  {
    name: "BU Deep Dive",
    href: "/bu-deep-dive",
    icon: Users,
  },
]

export function TabNavigation() {
  const pathname = usePathname()

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-[1600px] mx-auto px-8">
        <nav className="flex gap-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            const Icon = tab.icon
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors
                  ${
                    isActive
                      ? "border-[#005EB8] text-[#005EB8] bg-[#005EB8]/5"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
