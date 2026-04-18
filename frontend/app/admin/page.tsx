'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Shield, CheckCircle2, XCircle, Clock, Users, RefreshCw } from 'lucide-react'

type User = {
  id: string
  telegram_id: number
  username: string | null
  first_name: string | null
  trial_started_at: string | null
  terms_accepted_at: string | null
  subscription_activated_at: string | null
  created_at: string
}

function getInitData(): string {
  if (typeof window === 'undefined') return ''
  return window.Telegram?.WebApp?.initData ?? ''
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getStatus(user: User) {
  if (user.subscription_activated_at) return { label: 'Оплачено', color: 'text-green-400', bg: 'bg-green-500/15' }
  if (!user.terms_accepted_at) return { label: 'Не принял условия', color: 'text-white/40', bg: 'bg-white/5' }
  if (user.trial_started_at) {
    const hours = (Date.now() - new Date(user.trial_started_at).getTime()) / 3600000
    if (hours < 72) return { label: `Триал (${Math.ceil(72 - hours)}ч)`, color: 'text-blue-400', bg: 'bg-blue-500/15' }
    return { label: 'Триал истёк', color: 'text-orange-400', bg: 'bg-orange-500/15' }
  }
  return { label: 'Нет доступа', color: 'text-red-400', bg: 'bg-red-500/15' }
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-telegram-init-data': getInitData() },
      })
      if (res.status === 403) { setError('Доступ запрещён'); return }
      if (!res.ok) { setError('Ошибка загрузки'); return }
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch {
      setError('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleAction(telegramId: number, action: 'grant' | 'revoke') {
    setActionLoading(telegramId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': getInitData(),
        },
        body: JSON.stringify({ telegram_id: telegramId, action }),
      })
      if (res.ok) await fetchUsers()
    } finally {
      setActionLoading(null)
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-lg font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-4 sm:px-8 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Админ панель</h1>
            <p className="text-xs text-white/40">{users.length} пользователей</p>
          </div>
        </div>
        <motion.button
          onClick={fetchUsers}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white/60 text-sm hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-white/30 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => {
            const status = getStatus(user)
            const isLoading = actionLoading === user.telegram_id
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {user.first_name ?? 'Без имени'}
                      {user.username && <span className="text-white/40 font-normal"> @{user.username}</span>}
                    </p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color} shrink-0`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-white/30">
                    <span>ID: {user.telegram_id}</span>
                    <span>Регистрация: {formatDate(user.created_at)}</span>
                    {user.subscription_activated_at && (
                      <span>Оплата: {formatDate(user.subscription_activated_at)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {user.subscription_activated_at ? (
                    <motion.button
                      onClick={() => handleAction(user.telegram_id, 'revoke')}
                      disabled={isLoading}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 disabled:opacity-50 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {isLoading ? '...' : 'Забрать'}
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={() => handleAction(user.telegram_id, 'grant')}
                      disabled={isLoading}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/20 disabled:opacity-50 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isLoading ? '...' : 'Выдать'}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )
          })}

          {users.length === 0 && (
            <div className="text-center py-20 text-white/30">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Пользователей пока нет</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
