import ListFlightButton from '@/components/ui/ListFlightButton'

const STEPS = [
  {
    step: '01',
    title: 'Submit your flight',
    desc: 'Enter the route, aircraft details, departure window, and your price.',
  },
  {
    step: '02',
    title: 'We verify and publish',
    desc: 'We review your listing within 24 hours and put it live.',
  },
  {
    step: '03',
    title: 'Buyer books, you fly',
    desc: 'You get notified with the buyer\'s contact info. Confirm the slot, they show up.',
  },
]

export default function OperatorsPage() {
  return (
    <div className="pt-16 min-h-screen flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold text-ink mb-2">List an Empty Leg</h1>
        <p className="text-muted text-sm mb-14">Three steps. No commitment.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-14">
          {STEPS.map(item => (
            <div key={item.step} className="text-left">
              <div className="text-4xl font-extrabold text-primary/20 mb-3">{item.step}</div>
              <h3 className="font-bold text-ink mb-1">{item.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <ListFlightButton />
      </div>
    </div>
  )
}
