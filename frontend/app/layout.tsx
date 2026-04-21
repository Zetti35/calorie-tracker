import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import PageTransition from '@/components/layout/PageTransition'
import ProfileButton from '@/components/layout/ProfileButton'
import NotificationManager from '@/components/NotificationManager'
import AccessGuard from '@/components/AccessGuard'
import { SyncProvider } from '@/components/SyncProvider'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Калорийный Трекер',
  description: 'Считай калории, следи за питанием и тренировками',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${geist.variable} dark h-full antialiased`}>
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </head>
      <body className="min-h-full bg-[#0a0a0a] text-white">
        <AccessGuard>
          <SyncProvider>
            <Sidebar />
            <main className="md:ml-64 min-h-screen relative pt-[56px] md:pt-0">
              <NotificationManager />
              <ProfileButton />
              <PageTransition>{children}</PageTransition>
            </main>
          </SyncProvider>
        </AccessGuard>
      </body>
    </html>
  )
}
