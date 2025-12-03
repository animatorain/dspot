"use client"

import type React from "react"
import { ArrowRight } from "lucide-react"

interface SectionCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  linkText?: string
  onLinkClick?: () => void
  className?: string
}

export function SectionCard({ title, subtitle, children, linkText, onLinkClick, className = "" }: SectionCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-[0_6px_18px_rgba(15,23,42,0.08)] ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {linkText && (
          <button
            onClick={onLinkClick}
            className="flex items-center gap-1 text-sm text-[#005EB8] hover:text-[#009FDA] transition-colors font-medium"
          >
            {linkText}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
