'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Newspaper, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { ALL_ARTICLES } from '../../data/news_articles'

const TAGS = ['Все', 'Питание', 'Здоровье', 'Мифы', 'Образ жизни', 'Тренировки', 'Витамины', 'Напитки']
const DAILY_COUNT = 7

// Детерминированное перемешивание по seed (день года)
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getDaySeed(): number {
  const now = new Date()
  return now.getFullYear() * 1000 + Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } } }

export default function NewsPage() {
  const [openId, setOpenId] = useState<number | null>(null)
  const [activeTag, setActiveTag] = useState('Все')
  const [refreshSeed, setRefreshSeed] = useState(0)

  const dailyArticles = useMemo(() => {
    const seed = getDaySeed() + refreshSeed
    return seededShuffle(ALL_ARTICLES, seed).slice(0, DAILY_COUNT)
  }, [refreshSeed])

  const filtered = activeTag === 'Все'
    ? dailyArticles
    : dailyArticles.filter(a => a.tag === activeTag).length > 0
      ? dailyArticles.filter(a => a.tag === activeTag)
      : ALL_ARTICLES.filter(a => a.tag === activeTag).slice(0, DAILY_COUNT)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="px-4 sm:px-8 py-8 sm:py-10 max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/15 flex items-center justify-center">
          <Newspaper className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Новости ПП</h1>
          <p className="text-sm text-white/40">Советы по здоровому питанию и образу жизни</p>
        </div>
      </div>

      <div className="h-px bg-white/[0.06] my-8" />

      {/* Controls */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {TAGS.map(tag => (
            <motion.button key={tag} onClick={() => setActiveTag(tag)} whileTap={{ scale: 0.95 }}
              className={['px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200',
                activeTag === tag
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                  : 'bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
              ].join(' ')}>
              {tag}
            </motion.button>
          ))}
        </div>
        <motion.button
          onClick={() => { setRefreshSeed(s => s + 1); setOpenId(null) }}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-500/25 bg-purple-500/10 text-purple-400 text-xs font-medium hover:bg-purple-500/20 hover:border-purple-500/40 transition-all">
          <RefreshCw className="w-3.5 h-3.5" />
          Обновить подборку
        </motion.button>
      </div>

      <p className="text-xs text-white/25 mb-6">
        Показано {filtered.length} из {ALL_ARTICLES.length} статей · подборка меняется каждый день
      </p>

      {/* Articles */}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map(article => {
            const isOpen = openId === article.id
            return (
              <motion.div key={article.id} variants={item} layout>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
                  <button onClick={() => setOpenId(isOpen ? null : article.id)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{article.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${article.tagColor} ${article.tagBg} ${article.tagBorder}`}>
                            {article.tag}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-white">{article.title}</p>
                      </div>
                    </div>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-white/30 shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden">
                        <div className="px-6 pb-6 border-t border-white/[0.06]">
                          <div className="pt-4 space-y-3">
                            {article.body.map((para, i) => (
                              <p key={i} className="text-sm text-white/60 leading-relaxed">{para}</p>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
