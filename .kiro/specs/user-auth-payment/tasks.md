# Implementation Plan: User Auth & Payment

## Overview

Реализация системы авторизации через Telegram initData, пробного периода, монетизации через FreeKassa и синхронизации данных через Supabase. Бэкенд — Next.js API Routes, фронтенд — существующее Next.js приложение.

## Tasks

- [x] 1. Настройка окружения и инфраструктуры
  - Установить зависимости: `@supabase/supabase-js`, `fast-check`, `jest`, `@testing-library/react`, `@types/jest`
  - Создать `.env.local` по образцу `.env.example` с переменными `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `FREEKASSA_MERCHANT_ID`, `FREEKASSA_SECRET_WORD_1`, `FREEKASSA_SECRET_WORD_2`
  - Создать `frontend/lib/supabase.ts` — браузерный и серверный клиенты Supabase
  - Создать SQL-миграции для таблиц `users`, `payments`, `diary_data` с RLS политиками (только service_role)
  - Настроить Jest: `jest.config.ts`, `jest.setup.ts` в `frontend/`
  - _Requirements: 1.1, 1.2, 6.1_

- [x] 2. Серверная верификация Telegram initData
  - [x] 2.1 Реализовать `verifyInitData(initData: string): boolean` в `frontend/lib/telegram.ts`
    - HMAC-SHA256 верификация: разобрать URLSearchParams, извлечь hash, собрать data_check_string, вычислить secret_key = HMAC-SHA256(bot_token, "WebAppData"), сравнить хэши
    - Реализовать `parseInitData(initData: string): TelegramUser` — извлечение данных пользователя
    - _Requirements: 1.4, 1.5_

  - [ ]* 2.2 Написать property-тест для верификации initData
    - **Property 1: Верификация initData отклоняет невалидные данные**
    - Генерировать случайные строки, изменённые hash, истёкшие auth_date через `fc.string()`, `fc.record()`
    - **Validates: Requirements 1.4, 1.5**

  - [ ]* 2.3 Написать unit-тесты для `verifyInitData`
    - Тест с реальным примером от Telegram (известные тестовые данные)
    - Тест с пустой строкой, отсутствующим hash, изменёнными параметрами
    - _Requirements: 1.4, 1.5_

- [x] 3. Auth API Routes
  - [x] 3.1 Реализовать `POST /api/auth/login` в `frontend/app/api/auth/login/route.ts`
    - Извлечь и верифицировать `x-telegram-init-data` заголовок (401 если невалидный)
    - Upsert пользователя в Supabase: создать если нет, обновить `updated_at` если есть
    - Если `acceptedTerms: true` в body — записать `terms_accepted_at` и `trial_started_at`
    - Вычислить и вернуть `AccessStatus` (pending_consent / trial / expired / subscribed)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 3.3_

  - [ ]* 3.2 Написать property-тест для upsert идемпотентности
    - **Property 2: Upsert пользователя идемпотентен**
    - Генерировать случайные telegram_id через `fc.bigInt()`, вызывать login N раз, проверять count = 1
    - **Validates: Requirements 1.2, 1.3**

  - [x] 3.3 Реализовать `computeAccessStatus(user: User): AccessStatus` в `frontend/lib/access.ts`
    - Логика: нет terms_accepted_at → pending_consent; есть subscription_activated_at → subscribed; trial < 72ч → trial с remaining_hours; иначе → expired
    - _Requirements: 2.2, 2.3, 3.4, 4.1, 4.3_

  - [ ]* 3.4 Написать property-тесты для `computeAccessStatus`
    - **Property 3: Вычисление статуса доступа по времени**
    - Генерировать `trial_started_at` в диапазоне [0, 200] часов назад через `fc.integer({ min: 0, max: 200 })`
    - **Validates: Requirements 2.2, 2.3, 4.1**
    - **Property 5: Согласие с условиями — идемпотентность состояния**
    - Генерировать N вызовов login без acceptTerms через `fc.nat()`
    - **Validates: Requirements 3.4, 3.5**
    - **Property 6: Subscribed статус при наличии subscription_activated_at**
    - Генерировать случайные `subscription_activated_at` через `fc.date()`
    - **Validates: Requirements 4.3, 5.4**

  - [x] 3.5 Реализовать `GET /api/auth/status` в `frontend/app/api/auth/status/route.ts`
    - Верифицировать initData, найти пользователя, вернуть `AuthResponse`
    - _Requirements: 1.3, 4.4_

- [ ] 4. Checkpoint — убедиться, что все тесты проходят
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Payment API Routes
  - [ ] 5.1 Реализовать `POST /api/payment/create` в `frontend/app/api/payment/create/route.ts`
    - Верифицировать initData, найти пользователя (404 если нет)
    - Сгенерировать уникальный `order_id` (UUID v4)
    - Вставить запись в `payments` со статусом `pending`
    - Сформировать подпись MD5(MERCHANT_ID:AMOUNT:SECRET_WORD_1:CURRENCY:ORDER_ID) и вернуть `payment_url`
    - _Requirements: 5.1, 5.2, 5.6_

  - [ ]* 5.2 Написать property-тест для уникальности order_id
    - **Property 7: Уникальность order_id для каждого платёжного запроса**
    - Генерировать N вызовов createPayment через `fc.nat({ max: 100 })`, проверять уникальность
    - **Validates: Requirements 5.1, 5.6**

  - [ ] 5.3 Реализовать `POST /api/payment/webhook` в `frontend/app/api/payment/webhook/route.ts`
    - Разобрать `application/x-www-form-urlencoded` тело
    - Верифицировать подпись: MD5(MERCHANT_ID:AMOUNT:SECRET_WORD_2:MERCHANT_ORDER_ID)
    - Если подпись невалидна — вернуть `YES` без изменений (400 логически, но FreeKassa требует YES)
    - Если дублирующийся order_id — идемпотентно вернуть `YES`
    - Обновить `payments.status = 'completed'` и `users.subscription_activated_at = now()`
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

  - [ ]* 5.4 Написать property-тест для webhook верификации
    - **Property 8: Webhook верификация — корректность обработки подписи**
    - Генерировать валидные и невалидные подписи через `fc.string()`, `fc.record()`
    - **Validates: Requirements 5.3, 5.5**

  - [ ]* 5.5 Написать unit-тесты для Payment Routes
    - Тест `generatePaymentUrl()` — корректность формата URL и MD5 подписи
    - Тест `verifyWebhookSignature()` с известными тестовыми данными FreeKassa
    - _Requirements: 5.1, 5.3_

- [ ] 6. Sync API Route
  - [ ] 6.1 Реализовать `GET /api/sync` и `POST /api/sync` в `frontend/app/api/sync/route.ts`
    - Верифицировать initData, найти пользователя
    - GET: вернуть `diary_data.data` для данного user_id
    - POST: upsert `diary_data` (last-write-wins по `updated_at`)
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 6.2 Написать property-тест для sync round-trip
    - **Property 9: Синхронизация данных — round-trip**
    - Генерировать случайные данные дневника через `fc.array(fc.record(...))`
    - **Validates: Requirements 6.2, 6.3**

- [x] 7. Клиентский хук useAuth
  - [x] 7.1 Реализовать `useAuth` хук в `frontend/lib/auth.ts`
    - Методы: `login()`, `acceptTerms()`, `createPayment()`, `refreshStatus()`
    - Хранить `status` и `user` в localStorage с TTL 1 час (fallback при offline)
    - При загрузке приложения автоматически вызывать `login()` с `Telegram.WebApp.initData`
    - _Requirements: 1.1, 3.3, 4.4, 6.4_

  - [ ]* 7.2 Написать property-тест для trial_started_at при создании
    - **Property 4: Инвариант trial_started_at при создании пользователя**
    - Генерировать случайных пользователей через `fc.record()`, проверять что `trial_started_at` в диапазоне [now()-5s, now()+5s]
    - **Validates: Requirements 2.1, 3.3**

- [x] 8. UI компоненты
  - [x] 8.1 Реализовать `ConsentScreen` в `frontend/components/ConsentScreen.tsx`
    - Отображать текст с условиями: пробный период 3 дня, затем разовая оплата 50 рублей
    - Кнопка подтверждения вызывает `acceptTerms()` из `useAuth`
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 8.2 Реализовать `TrialBanner` в `frontend/components/TrialBanner.tsx`
    - Отображать оставшееся время пробного периода (дни и часы) при статусе `trial`
    - _Requirements: 2.4_

  - [x] 8.3 Реализовать `AccessGuard` в `frontend/components/AccessGuard.tsx`
    - При `pending_consent` — рендерить `<ConsentScreen />`
    - При `trial` — рендерить `<TrialBanner />` + `{children}`
    - При `expired` — рендерить экран оплаты с кнопкой (вызывает `createPayment()` и редиректит)
    - При `subscribed` — рендерить `{children}`
    - При загрузке — не блокировать доступ (показывать skeleton/spinner)
    - При ошибке сети — использовать кэшированный статус из localStorage
    - _Requirements: 2.2, 2.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.2_

  - [ ]* 8.4 Написать unit-тесты для AccessGuard
    - Тест: рендерит `ConsentScreen` при статусе `pending_consent`
    - Тест: рендерит экран оплаты при статусе `expired`
    - Тест: рендерит `children` при статусах `trial` и `subscribed`
    - _Requirements: 3.4, 4.1, 4.3_

- [x] 9. Интеграция AccessGuard в приложение
  - [x] 9.1 Обернуть `<PageTransition>` в `<AccessGuard>` в `frontend/app/layout.tsx`
    - Инициализировать `useAuth().login()` при монтировании layout
    - После редиректа с FreeKassa вызывать `refreshStatus()` (проверять query param `?payment=success`)
    - _Requirements: 1.1, 4.4, 5.4_

  - [x] 9.2 Обновить `frontend/app/profile/page.tsx`
    - Отображать информацию о пользователе (имя из Telegram, статус доступа)
    - Кнопка оплаты для статусов `trial` и `expired`
    - _Requirements: 4.2, 5.1, 5.2_

- [ ] 10. Синхронизация Zustand store с Supabase
  - Добавить в `frontend/lib/store.ts` логику автосинхронизации: при изменении `entries` или `userProfile` вызывать `POST /api/sync` с debounce 5 секунд
  - При инициализации store загружать данные из `GET /api/sync` (если пользователь авторизован)
  - При ошибке Supabase — продолжать работу с localStorage
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 11. Final checkpoint — убедиться, что все тесты проходят
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Задачи с `*` опциональны и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные требования для трассируемости
- Property-тесты используют библиотеку `fast-check`, минимум 100 итераций
- Supabase мокируется через `jest.mock('@/lib/supabase')` в тестах
- Telegram WebApp мокируется через `window.Telegram = { WebApp: { initData: '...' } }`
- FreeKassa webhook требует ответа `YES` при успешной обработке
