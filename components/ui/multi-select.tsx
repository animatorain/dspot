"use client"

import type React from "react"
import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"

interface MultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  icon?: React.ReactNode
}

export function MultiSelect({ label, options, selected, onChange, icon }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const toggleAll = () => {
    if (selected.length === options.length) {
      onChange([])
    } else {
      onChange([...options])
    }
  }

  const displayText =
    selected.length === 0
      ? `Select ${label}`
      : selected.length === options.length
        ? `All ${label}`
        : selected.length <= 2
          ? selected.join(", ")
          : `${selected.length} selected`

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-[#005EB8] transition-colors min-w-[200px] justify-between shadow-sm"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm text-gray-700">{displayText}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-[300px] overflow-auto">
            <div
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
              onClick={toggleAll}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  selected.length === options.length ? "bg-[#005EB8] border-[#005EB8]" : "border-gray-300"
                }`}
              >
                {selected.length === options.length && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm font-medium text-gray-700">Select All</span>
            </div>
            {options.map((option) => (
              <div
                key={option}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleOption(option)}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    selected.includes(option) ? "bg-[#005EB8] border-[#005EB8]" : "border-gray-300"
                  }`}
                >
                  {selected.includes(option) && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-gray-700">{option}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
