import FAQ from '@/components/ui/FAQ'
import Link from 'next/link'

const BUYER_FAQS = [
  { q: 'What is an empty leg flight?', a: 'When a private jet completes a one-way charter and needs to reposition, that return flight would otherwise fly empty. Operators list these repositioning flights — called empty legs — at a steep discount rather than absorb the cost of flying empty.' },
  { q: 'How do I find empty leg flights on PJRoutes?', a: 'Use the search bar on the homepage or browse routes. Enter your origin, destination, and preferred date. You can also set a route alert — we\'ll email you the moment a matching flight lists.' },
  { q: 'How much do empty leg flights cost?', a: 'Prices are set by operators directly and vary by route, aircraft type, and timing. You\'ll typically see significant discounts compared to standard charter rates. PJRoutes charges no additional platform fee — what the operator lists is what you pay.' },
  { q: 'Are all operators on PJRoutes certified?', a: 'Yes. Every operator must hold an active FAA Part 135 Air Carrier Certificate. We verify this before any listing goes live.' },
  { q: 'What happens after I book?', a: 'Your booking is confirmed instantly. You\'ll receive an email with everything you need — receipt, FBO address, arrival instructions, and departure window. If anything changes last minute, the operator will call you 24–48 hours in advance.' },
  { q: 'Can I split the cost with others?', a: 'Yes — you book the entire aircraft, so you can bring as many passengers as the jet holds. Splitting the cost across a group often makes it comparable to or cheaper than business class.' },
  { q: 'What if the operator cancels?', a: 'If the operator cancels the flight, you receive a full refund. No questions asked.' },
  { q: 'Can I pay by bank transfer?', a: 'Yes. At checkout you can pay by credit card or ACH bank transfer. Bank transfer has a significantly lower processing fee, which is shown transparently at checkout.' },
]

const OPERATOR_FAQS = [
  { q: 'How quickly can I get a listing live?', a: 'Submit your flight and we review it within 24 hours. Once approved it goes live immediately.' },
  { q: 'Do I have to list every repositioning flight?', a: 'No. List what you want, when you want. No commitments.' },
  { q: 'Will my company name be visible to buyers?', a: 'No. Aircraft details are shown but your company name stays private unless you choose to share it.' },
  { q: 'What are the operator requirements?', a: 'An active FAA Part 135 Air Carrier Certificate is required. We verify before your first listing goes live.' },
]

export default function FAQPage() {
  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-ink mb-2">Frequently Asked Questions</h1>
          <p className="text-muted">Everything you need to know about flying private with PJRoutes.</p>
        </div>

        <div className="mb-12">
          <h2 className="text-lg font-bold text-ink mb-4">For Travelers</h2>
          <FAQ items={BUYER_FAQS} />
        </div>

        <div className="mb-12">
          <h2 className="text-lg font-bold text-ink mb-4">For Operators</h2>
          <FAQ items={OPERATOR_FAQS} />
        </div>

        <div className="rounded-2xl bg-surface p-8 text-center">
          <p className="text-ink font-medium mb-2">Still have questions?</p>
          <p className="text-muted text-sm mb-4">We&apos;re happy to help.</p>
          <Link href="/contact" className="btn-primary">Contact Us</Link>
        </div>
      </div>
    </div>
  )
}
