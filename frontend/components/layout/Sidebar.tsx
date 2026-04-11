'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calculator, BookOpen, Dumbbell, Newspaper, Salad, Menu, X, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/calculator', icon: Calculator,  label: 'Калькулятор' },
  { href: '/diary',      icon: BookOpen,    label: 'Дневник'     },
  { href: '/training',   icon: Dumbbell,    label: 'Тренировки'  },
  { href: '/progress',   icon: TrendingUp,  label: 'Прогресс'    },
  { href: '/news',       icon: Newspaper,   label: 'Новости ПП'  },
]

function NavContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <>
      <Link href="/" onClick={onClose}
        className={cn('flex items-center gap-3 px-6 py-6 border-b border-white/10 cursor-pointer transition-opacity duration-200 hover:opacity-80',
          pathname === '/' ? 'opacity-100' : 'opacity-70')}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
          <Salad className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Калорийный</p>
          <p className="text-xs text-white/50">Трекер</p>
        </div>
      </Link>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} onClick={onClose}>
              <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}
                className={cn('relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer',
                  active ? 'text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5')}>
                {active && (
                  <motion.div layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-white/10 border border-white/15"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
                )}
                <Icon className="w-4 h-4 relative z-10 flex-shrink-0" />
                <span className="relative z-10">{label}</span>
              </motion.div>
            </Link>
          )
        })}
      </nav>
      <div className="px-3 pb-3 border-t border-white/10 pt-3">
        <p className="text-xs text-white/30 px-4 pt-2">Версия 2.0 · Next.js</p>
      </div>
    </>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col bg-black/40 backdrop-blur-xl border-r border-white/10 z-40">
        <NavContent pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
            <Salad className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">Калорийный Трекер</span>
        </Link>
        <button onClick={() => setOpen(v => !v)} className="p-2 rounded-xl bg-white/[0.06] border border-white/10 text-white/60 hover:text-white transition-colors">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="md:hidden fixed left-0 top-0 h-full w-72 flex flex-col bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-white/10 z-50">
              <NavContent pathname={pathname} onClose={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
