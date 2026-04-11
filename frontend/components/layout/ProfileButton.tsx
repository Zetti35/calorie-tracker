'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'

export default function ProfileButton() {
  const pathname = usePathname()
  const isActive = pathname === '/profile'

  return (
    <div className="absolute top-[68px] sm:top-6 right-4 sm:right-8 z-30">
      <Link href="/profile">
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className={[
            'w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200',
            isActive
              ? 'bg-white/20 border-2 border-white/40 shadow-lg shadow-white/10'
              : 'bg-white/[0.07] border border-white/15 hover:bg-white/15 hover:border-white/30',
          ].join(' ')}
        >
          <User className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/60'}`} />
        </motion.div>
      </Link>
    </div>
  )
}
