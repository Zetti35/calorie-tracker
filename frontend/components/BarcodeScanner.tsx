'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Loader2, AlertCircle } from 'lucide-react'
import type { FoodItem } from '@/types'

interface Props {
  onFound: (food: FoodItem) => void
  onClose: () => void
}

async function fetchByBarcode(barcode: string): Promise<FoodItem | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await res.json()
    if (data.status !== 1 || !data.product) return null
    const p = data.product
    const n = p.nutriments ?? {}
    const name = p.product_name_ru || p.product_name || p.generic_name || `Продукт ${barcode}`
    const brand = p.brands ? ` (${p.brands.split(',')[0].trim()})` : ''
    return {
      name: `${name}${brand}`,
      calories: Math.round(n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0)),
      protein:  Math.round((n['proteins_100g'] ?? 0) * 10) / 10,
      fat:      Math.round((n['fat_100g'] ?? 0) * 10) / 10,
      carbs:    Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
    }
  } catch {
    return null
  }
}

export default function BarcodeScanner({ onFound, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'loading' | 'scanning' | 'found' | 'error' | 'notfound'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [foundName, setFoundName] = useState('')
  const readerRef = useRef<unknown>(null)

  useEffect(() => {
    let stopped = false

    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()
        readerRef.current = reader

        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        if (devices.length === 0) {
          setErrorMsg('Камера не найдена')
          setStatus('error')
          return
        }

        // Prefer back camera
        const device = devices.find(d => /back|rear|environment/i.test(d.label)) ?? devices[devices.length - 1]

        setStatus('scanning')

        await reader.decodeFromVideoDevice(device.deviceId, videoRef.current!, async (result, err) => {
          if (stopped) return
          if (result) {
            stopped = true
            const barcode = result.getText()
            setStatus('loading')
            const food = await fetchByBarcode(barcode)
            if (food) {
              setFoundName(food.name)
              setStatus('found')
              setTimeout(() => onFound(food), 800)
            } else {
              setStatus('notfound')
            }
          }
        })
      } catch (e) {
        if (!stopped) {
          setErrorMsg(e instanceof Error ? e.message : 'Ошибка камеры')
          setStatus('error')
        }
      }
    }

    start()

    return () => {
      stopped = true
      if (readerRef.current) {
        try { (readerRef.current as { reset: () => void }).reset() } catch {}
      }
    }
  }, [onFound])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#111]/95 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-white">Сканирование штрихкода</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video */}
        <div className="relative bg-black aspect-square">
          <video ref={videoRef} className="w-full h-full object-cover" />

          {/* Scanning overlay */}
          {status === 'scanning' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-48">
                {/* Corner brackets */}
                {[['top-0 left-0', 'border-t-2 border-l-2'], ['top-0 right-0', 'border-t-2 border-r-2'],
                  ['bottom-0 left-0', 'border-b-2 border-l-2'], ['bottom-0 right-0', 'border-b-2 border-r-2']
                ].map(([pos, border], i) => (
                  <div key={i} className={`absolute ${pos} w-8 h-8 ${border} border-green-400 rounded-sm`} />
                ))}
                {/* Scan line */}
                <motion.div
                  animate={{ y: [0, 176, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-0.5 bg-green-400/70 shadow-lg shadow-green-400/50"
                />
              </div>
            </div>
          )}

          {/* Status overlays */}
          <AnimatePresence>
            {(status === 'loading' || status === 'found' || status === 'notfound' || status === 'error') && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
                {status === 'loading' && <><Loader2 className="w-8 h-8 text-white/60 animate-spin" /><p className="text-sm text-white/60">Ищем продукт...</p></>}
                {status === 'found' && <><div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center"><span className="text-2xl">✓</span></div><p className="text-sm text-green-400 text-center px-4">{foundName}</p></>}
                {status === 'notfound' && <><AlertCircle className="w-8 h-8 text-yellow-400" /><p className="text-sm text-yellow-400">Продукт не найден в базе</p><button onClick={onClose} className="text-xs text-white/40 hover:text-white/60 mt-1">Закрыть</button></>}
                {status === 'error' && <><AlertCircle className="w-8 h-8 text-red-400" /><p className="text-sm text-red-400 text-center px-4">{errorMsg}</p><button onClick={onClose} className="text-xs text-white/40 hover:text-white/60 mt-1">Закрыть</button></>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-5 py-4 text-center">
          <p className="text-xs text-white/35">Наведи камеру на штрихкод продукта</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
