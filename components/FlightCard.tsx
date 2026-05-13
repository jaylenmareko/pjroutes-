'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Wifi, PawPrint, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { Flight } from '@/lib/types'
import { formatPrice, formatDate, formatTime, JET_SIZE_LABEL } from '@/lib/utils'

const PLATFORM_FEE = 0.25

interface Props {
  flight: Flight
  layout?: 'list' | 'grid'
}

export default function FlightCard({ flight, layout = 'list' }: Props) {
  const photos = flight.photos || []
  const [photoIndex, setPhotoIndex] = useState(0)
  const buyerPrice = Math.round(flight.price * (1 + PLATFORM_FEE))

  function prev(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setPhotoIndex(i => (i - 1 + photos.length) % photos.length)
  }

  function next(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setPhotoIndex(i => (i + 1) % photos.length)
  }

  const photo = (
    <div className={`relative bg-surface overflow-hidden flex-shrink-0 ${
      layout === 'grid' ? 'h-48 w-full' : 'h-full sm:w-56 h-48 sm:h-auto'
    }`}>
      {photos.length > 0 ? (
        <img
          src={photos[photoIndex]}
          alt={flight.aircraft_type}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-4xl opacity-10">✈</div>
      )}

      <div className="absolute top-3 left-3">
        <span className="bg-primary text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
          {JET_SIZE_LABEL[flight.jet_size]}
        </span>
      </div>

      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={14} />
          </button>
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            {photoIndex + 1}/{photos.length}
          </div>
        </>
      )}
    </div>
  )

  const details = (
    <div className={`flex-1 p-4 flex gap-4 ${layout === 'grid' ? 'flex-col' : 'flex-col sm:flex-row sm:items-center'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-center">
            <div className="text-xs font-bold text-ink uppercase tracking-widest">{flight.from_airport}</div>
            <div className="text-sm text-muted">{flight.from_city}</div>
          </div>
          <div className="flex items-center gap-1 text-muted px-1">
            <div className="w-4 h-px bg-border" />
            <ArrowRight size={11} />
            <div className="w-4 h-px bg-border" />
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-ink uppercase tracking-widest">{flight.to_airport}</div>
            <div className="text-sm text-muted">{flight.to_city}</div>
          </div>
        </div>

        <div className="text-xs text-muted mt-2">
          {formatDate(flight.depart_start)} · {formatTime(flight.depart_start)} – {formatTime(flight.depart_end)}
        </div>

        <div className="mt-2">
          <div className="text-xs font-medium text-ink">{flight.aircraft_type}</div>
          <div className="text-xs text-muted">Up to {flight.seats} passengers</div>
        </div>

        {(flight.has_wifi || flight.pets_allowed) && (
          <div className="flex items-center gap-2 mt-2">
            {flight.has_wifi && <Wifi size={12} className="text-muted" />}
            {flight.pets_allowed && <PawPrint size={12} className="text-muted" />}
          </div>
        )}
      </div>

      <div className={`flex-shrink-0 flex gap-3 ${layout === 'grid' ? 'items-center justify-between' : 'flex-col items-end sm:min-w-[140px]'}`}>
        <div className={layout === 'grid' ? '' : 'text-right'}>
          <div className="text-2xl font-extrabold text-ink">{formatPrice(buyerPrice)}</div>
          <div className="text-xs text-muted">Entire Aircraft</div>
        </div>
        <button className="btn-primary rounded-xl text-sm px-5 py-2 whitespace-nowrap">
          Book Now →
        </button>
      </div>
    </div>
  )

  return (
    <Link
      href={`/flights/${flight.id}`}
      className={`card group block overflow-hidden cursor-pointer ${layout === 'grid' ? '' : 'flex flex-col sm:flex-row'}`}
    >
      {photo}
      {details}
    </Link>
  )
}
