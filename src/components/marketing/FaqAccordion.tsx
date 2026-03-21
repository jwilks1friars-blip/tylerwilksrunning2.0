'use client'

import { useState } from 'react'

interface Faq {
  q: string
  a: string
}

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="max-w-4xl divide-y" style={{ borderTop: '1px solid #1e1b18', borderBottom: '1px solid #1e1b18' }}>
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i
        return (
          <div key={faq.q}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-6 py-5 text-left"
            >
              <h3
                className="text-base font-semibold uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
              >
                {faq.q}
              </h3>
              <span
                className="shrink-0 text-xl leading-none transition-transform"
                style={{
                  color: '#6b6560',
                  transform: isOpen ? 'rotate(45deg)' : 'none',
                }}
              >
                +
              </span>
            </button>
            {isOpen && (
              <p className="pb-5 text-sm leading-7" style={{ color: '#6b6560' }}>
                {faq.a}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
