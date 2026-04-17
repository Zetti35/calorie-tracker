'use client'
import { useState, useEffect, useCallback } from 'react'
import type { AccessStatus, User, AuthResponse } from './access'

const CACHE_KEY = 'auth_cache'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 час

type CachedAuth = {
  user: User
  access: AccessStatus
  cachedAt: number
}

function getInitData(): string {
  if (typeof window === 'undefined') return ''
  return window.Telegram?.WebApp?.initData ?? ''
}

function loadCache(): CachedAuth | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached: CachedAuth = JSON.parse(raw)
    if (Date.now() - cached.cachedAt > CACHE_TTL_MS) return null
    return cached
  } catch {
    return null
  }
}

function saveCache(user: User, access: AccessStatus) {
  try {
    const cached: CachedAuth = { user, access, cachedAt: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
  } catch { /* ignore */ }
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY) } catch { /* ignore */ }
}

async function apiCall<T>(path: string, options?: RequestInit): Promise<T> {
  const initData = getInitData()
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': initData,
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

export type UseAuthReturn = {
  status: AccessStatus | null
  user: User | null
  isLoading: boolean
  login: () => Promise<void>
  acceptTerms: () => Promise<void>
  createPayment: () => Promise<string>
  refreshStatus: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AccessStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const setAuth = useCallback((data: AuthResponse) => {
    setUser(data.user)
    setStatus(data.access)
    saveCache(data.user, data.access)
  }, [])

  const login = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await apiCall<AuthResponse>('/api/auth/login', { method: 'POST', body: '{}' })
      setAuth(data)
    } catch (err) {
      console.error('[useAuth] login error:', err)
      // При ошибке сети — используем кэш
      const cached = loadCache()
      if (cached) {
        setUser(cached.user)
        setStatus(cached.access)
      }
    } finally {
      setIsLoading(false)
    }
  }, [setAuth])

  const acceptTerms = useCallback(async () => {
    const data = await apiCall<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ acceptedTerms: true }),
    })
    setAuth(data)
  }, [setAuth])

  const createPayment = useCallback(async (): Promise<string> => {
    const data = await apiCall<{ payment_url: string }>('/api/payment/create', { method: 'POST', body: '{}' })
    return data.payment_url
  }, [])

  const refreshStatus = useCallback(async () => {
    try {
      const data = await apiCall<AuthResponse>('/api/auth/status')
      setAuth(data)
    } catch { /* ignore */ }
  }, [setAuth])

  useEffect(() => {
    console.log('[useAuth] mounting, calling login...')
    // Сначала показываем кэш, потом обновляем
    const cached = loadCache()
    if (cached) {
      setUser(cached.user)
      setStatus(cached.access)
      setIsLoading(false)
    }
    login()
  }, [login])

  return { status, user, isLoading, login, acceptTerms, createPayment, refreshStatus }
}

// Расширяем тип Window для Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string
        close: () => void
        openLink: (url: string) => void
      }
    }
  }
}
