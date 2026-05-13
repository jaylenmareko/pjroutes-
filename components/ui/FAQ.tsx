'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQItem {
  q: string
  a: string
}

export default function FAQ({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-6 py-5 text-left"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-medium text-ink pr-4">{item.q}</span>
            <ChevronDown
              size={18}
              className={`text-muted flex-shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-sm text-muted leading-relaxed border-t border-border pt-4">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
