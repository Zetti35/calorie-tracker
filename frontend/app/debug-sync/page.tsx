'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'

export default function DebugSyncPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const syncState = useAppStore((state) => (state as any)._sync)

  useEffect(() => {
    // Intercept console.log
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    console.log = (...args) => {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
      setLogs(prev => [...prev, `[LOG] ${new Date().toLocaleTimeString()}: ${message}`])
      originalLog(...args)
    }

    console.warn = (...args) => {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
      setLogs(prev => [...prev, `[WARN] ${new Date().toLocaleTimeString()}: ${message}`])
      originalWarn(...args)
    }

    console.error = (...args) => {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
      setLogs(prev => [...prev, `[ERROR] ${new Date().toLocaleTimeString()}: ${message}`])
      originalError(...args)
    }

    return () => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
    }
  }, [])

  useEffect(() => {
    if (autoScroll) {
      const logsDiv = document.getElementById('logs')
      if (logsDiv) {
        logsDiv.scrollTop = logsDiv.scrollHeight
      }
    }
  }, [logs, autoScroll])

  const clearLogs = () => setLogs([])

  const testAddEntry = () => {
    const addEntry = useAppStore.getState().addEntry
    addEntry({
      id: 'test-' + Date.now(),
      food: { name: 'Тестовый продукт', calories: 100, protein: 5, fat: 3, carbs: 15 },
      grams: 100,
      timestamp: new Date().toISOString(),
    })
    console.log('[DEBUG] Added test entry')
  }

  const checkTelegram = () => {
    const telegram = (window as any).Telegram
    console.log('[DEBUG] Telegram available:', !!telegram)
    console.log('[DEBUG] WebApp available:', !!telegram?.WebApp)
    console.log('[DEBUG] initData available:', !!telegram?.WebApp?.initData)
    console.log('[DEBUG] initData length:', telegram?.WebApp?.initData?.length || 0)
  }

  const testInitDataVerification = async () => {
    const telegram = (window as any).Telegram
    const initData = telegram?.WebApp?.initData
    
    if (!initData) {
      console.error('[DEBUG] No initData available')
      return
    }

    console.log('[DEBUG] Testing initData verification...')
    
    try {
      const response = await fetch('/api/debug-init-data', {
        method: 'POST',
        headers: {
          'x-telegram-init-data': initData,
        },
      })

      const result = await response.json()
      console.log('[DEBUG] Verification result:', result)
    } catch (error) {
      console.error('[DEBUG] Verification test failed:', error)
    }
  }

  const testRawInitData = async () => {
    const telegram = (window as any).Telegram
    const initData = telegram?.WebApp?.initData
    
    if (!initData) {
      console.error('[DEBUG] No initData available')
      return
    }

    console.log('[DEBUG] Testing RAW initData...')
    console.log('[DEBUG] RAW initData:', initData)
    
    try {
      const response = await fetch('/api/debug-raw-initdata', {
        method: 'POST',
        headers: {
          'x-telegram-init-data': initData,
        },
      })

      const result = await response.json()
      console.log('[DEBUG] RAW result:', result)
    } catch (error) {
      console.error('[DEBUG] RAW test failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4">
      <h1 className="text-2xl font-bold mb-4">🐛 Sync Debug Console</h1>

      {/* Sync Status */}
      <div className="mb-4 p-4 bg-gray-900 rounded">
        <h2 className="font-bold mb-2">Sync Status:</h2>
        <div className="text-sm space-y-1">
          <div>Status: <span className="text-cyan-400">{syncState?.status || 'unknown'}</span></div>
          <div>Last Synced: <span className="text-cyan-400">
            {syncState?.lastSyncedAt 
              ? new Date(syncState.lastSyncedAt).toLocaleString() 
              : 'Never'}
          </span></div>
          <div>Pending: <span className="text-cyan-400">{syncState?.pendingSync ? 'Yes' : 'No'}</span></div>
          <div>Error: <span className="text-red-400">{syncState?.error || 'None'}</span></div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={checkTelegram}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
        >
          Check Telegram
        </button>
        <button
          onClick={testRawInitData}
          className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded text-sm"
        >
          Show RAW initData
        </button>
        <button
          onClick={testInitDataVerification}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm"
        >
          Test Verification
        </button>
        <button
          onClick={testAddEntry}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
        >
          Add Test Entry
        </button>
        <button
          onClick={clearLogs}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
        >
          Clear Logs
        </button>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`${autoScroll ? 'bg-yellow-600' : 'bg-gray-600'} hover:opacity-80 px-4 py-2 rounded text-sm`}
        >
          Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Logs */}
      <div className="bg-black rounded p-4">
        <h2 className="font-bold mb-2">Console Logs:</h2>
        <div 
          id="logs"
          className="font-mono text-xs h-96 overflow-y-auto space-y-1"
        >
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet. Click "Check Telegram" or "Add Test Entry"</div>
          ) : (
            logs.map((log, i) => (
              <div 
                key={i}
                className={
                  log.includes('[ERROR]') ? 'text-red-400' :
                  log.includes('[WARN]') ? 'text-yellow-400' :
                  log.includes('✅') ? 'text-green-400' :
                  log.includes('❌') ? 'text-red-400' :
                  'text-gray-300'
                }
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-gray-900 rounded text-sm">
        <h3 className="font-bold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click "Check Telegram" - should show initData available</li>
          <li>Click "Test Verification" - tests initData HMAC verification</li>
          <li>Click "Add Test Entry" - should trigger sync after 2 seconds</li>
          <li>Watch logs for sync messages</li>
          <li>Check Supabase Dashboard → diary_data table</li>
        </ol>
      </div>
    </div>
  )
}
