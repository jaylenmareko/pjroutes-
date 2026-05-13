'use client'
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Props {
  photos: string[]
  aircraftType: string
}

export default function PhotoGallery({ photos, aircraftType }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const open = (i: number) => setLightboxIndex(i)
  const close = () => setLightboxIndex(null)

  const prev = useCallback(() => {
    setLightboxIndex(i => (i === null ? null : (i - 1 + photos.length) % photos.length))
  }, [photos.length])

  const next = useCallback(() => {
    setLightboxIndex(i => (i === null ? null : (i + 1) % photos.length))
  }, [photos.length])

  // Keyboard nav
  useEffect(() => {
    if (lightboxIndex === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, prev, next])

  // Prevent scroll when lightbox open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex])

  if (!photos.length) {
    return (
      <div className="h-64 bg-surface rounded-2xl flex items-center justify-center text-muted text-sm">
        No photos available
      </div>
    )
  }

  return (
    <>
      {/* Photo grid — click to open lightbox */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden h-64 sm:h-80 cursor-pointer">
        {/* Large left */}
        <div
          className="col-span-2 relative bg-surface group overflow-hidden"
          onClick={() => open(0)}
        >
          <img
            src={photos[0]}
            alt={aircraftType}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium">
            {aircraftType}
          </div>
          {photos.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
              Show all {photos.length} photos
            </div>
          )}
        </div>

        {/* Two stacked right */}
        <div className="flex flex-col gap-2">
          {[1, 2].map(i => (
            <div
              key={i}
              className="flex-1 bg-surface overflow-hidden group cursor-pointer"
              onClick={() => open(i)}
            >
              {photos[i] ? (
                <img
                  src={photos[i]}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-surface" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          onClick={close}
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-white text-sm font-medium opacity-80">{aircraftType}</span>
            <div className="flex items-center gap-4">
              <span className="text-white text-sm opacity-60">
                {lightboxIndex + 1} / {photos.length}
              </span>
              <button
                onClick={close}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Main image */}
          <div
            className="flex-1 flex items-center justify-center relative px-16 min-h-0"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIndex]}
              alt={`Photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg select-none"
              style={{ maxHeight: 'calc(100vh - 180px)' }}
            />

            {/* Prev arrow */}
            {photos.length > 1 && (
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            {/* Next arrow */}
            {photos.length > 1 && (
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight size={22} />
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div
              className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-4"
              onClick={e => e.stopPropagation()}
            >
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className={`relative w-14 h-10 rounded overflow-hidden flex-shrink-0 transition-all ${
                    i === lightboxIndex
                      ? 'ring-2 ring-white opacity-100'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
