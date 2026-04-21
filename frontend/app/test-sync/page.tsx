'use client'

import { useState } from 'react'

export default function TestSyncPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSetup = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/test-sync-setup')
      const data = await res.json()
      setResult({ type: 'setup', data })
    } catch (error: any) {
      setResult({ type: 'error', data: error.message })
    }
    setLoading(false)
  }

  const testSync = async () => {
    setLoading(true)
    try {
      const initData = (window as any).Telegram?.WebApp?.initData || ''
      
      if (!initData) {
        setResult({ 
          type: 'error', 
          data: 'No Telegram initData - open in Telegram Mini App' 
        })
        setLoading(false)
        return
      }

      // Test POST
      const testData = {
        entries: [{ 
          id: 'test-' + Date.now(), 
          food: { name: 'Test', calories: 100, protein: 1, fat: 1, carbs: 1 },
          grams: 100,
          timestamp: new Date().toISOString()
        }],
        water: {},
        training: {},
        reminders: {},
        customFoods: [],
        favorites: [],
        recentFoods: [],
        nutritionPlan: null,
        userProfile: null,
        calcHistory: [],
      }

      const postRes = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData,
        },
        body: JSON.stringify({ data: testData }),
      })

      const postData = await postRes.json()
      
      setResult({ 
        type: 'sync', 
        status: postRes.status,
        data: postData 
      })
    } catch (error: any) {
      setResult({ type: 'error', data: error.message })
    }
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🧪 Sync Test Page</h1>

      <div className="space-y-4">
        <button
          onClick={testSetup}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          1. Test Environment Setup
        </button>

        <button
          onClick={testSync}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          2. Test Sync API
        </button>
      </div>

      {loading && (
        <div className="mt-6 p-4 bg-gray-800 rounded">
          Loading...
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-gray-800 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-900 rounded text-sm">
        <h3 className="font-bold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click "Test Environment Setup" - should show all checks as true</li>
          <li>Click "Test Sync API" - should return success with updated_at</li>
          <li>Check Supabase Dashboard → diary_data table</li>
        </ol>
      </div>
    </div>
  )
}
