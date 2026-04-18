'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { CreditCard, Lock } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import ConsentScreen from './ConsentScreen'
import TrialBanner from './TrialBanner'

type Props = {
  children: React.ReactNode
}

export default function AccessGuard({ children }: Props) {
  const { status, isLoading, acceptTerms, createPayment, refreshStatus } = useAuth()
  const pathname = usePathname()

  // Проверяем редирект после оплаты
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('payment=success')) {
      refreshStatus()
      window.history.replaceState({}, '', '/')
    }
  }, [refreshStatus])

  // Страница /admin не требует проверки доступа
  if (pathname?.startsWith('/admin')) {
    return <>{children}</>
  }

  async function handlePayment() {
    try {
      const url = await createPayment()
      // В Telegram Mini App открываем через WebApp.openLink
      if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(url)
      } else {
        window.open(url, '_blank')
      }
    } catch {
      alert('Ошибка при создании платежа. Попробуй ещё раз.')
    }
  }

  // Загрузка — не блокируем, показываем контент
  if (isLoading && !status) {
    return <>{children}</>
  }

  // Нет согласия с условиями
  if (status?.type === 'pending_consent') {
    return <ConsentScreen onAccept={acceptTerms} />
  }

  // Пробный период истёк
  if (status?.type === 'expired') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/15 flex items-center justify-center">
              <Lock className="w-8 h-8 text-orange-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Пробный период завершён
          </h1>
          <p className="text-white/40 text-sm mb-8">
            Для продолжения использования оплати разовый доступ
          </p>

          <div className="bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-6 mb-6">
            <p className="text-4xl font-black text-white mb-1">50 ₽</p>
            <p className="text-white/40 text-sm">разовая оплата · доступ навсегда</p>
          </div>

          <motion.button
            onClick={handlePayment}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full h-14 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold text-base rounded-2xl transition-colors shadow-lg shadow-orange-500/20"
          >
            <CreditCard className="w-5 h-5" />
            Оплатить 50 ₽
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // Пробный период активен — показываем баннер + контент
  if (status?.type === 'trial') {
    return (
      <>
        <TrialBanner
          remainingHours={status.remaining_hours}
          onPayClick={handlePayment}
        />
        {children}
      </>
    )
  }

  // Подписка активна или статус неизвестен — показываем контент
  return <>{children}</>
}
