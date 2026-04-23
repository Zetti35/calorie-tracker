# Requirements Document

## Introduction

Данная спецификация описывает функциональность синхронизации данных между клиентским хранилищем (Zustand + localStorage) и серверной базой данных Supabase для Telegram Mini App калорийного трекера. Система обеспечивает автоматическое сохранение пользовательских данных на сервер, восстановление данных при входе, работу в offline-режиме и разрешение конфликтов при синхронизации с нескольких устройств.

## Glossary

- **Sync_System**: Система синхронизации данных между клиентом и сервером
- **Client_Store**: Клиентское хранилище данных (Zustand store с persist middleware)
- **Server_Database**: Серверная база данных Supabase (таблица diary_data)
- **Sync_API**: API endpoints для синхронизации (/api/sync)
- **User_State**: Полное состояние пользовательских данных (entries, water, training, userProfile, nutritionPlan, favorites, recentFoods, customFoods, reminders, calcHistory)
- **Sync_Status_Indicator**: Визуальный индикатор статуса синхронизации
- **Conflict**: Ситуация, когда серверные данные новее локальных (updated_at на сервере > локального timestamp)
- **Offline_Mode**: Режим работы приложения без подключения к интернету
- **Debounce_Timer**: Таймер задержки перед отправкой данных на сервер (2-3 секунды)
- **Service_Role_Key**: Секретный ключ Supabase для серверных операций

## Requirements

### Requirement 1: Автоматическая синхронизация при изменении данных

**User Story:** Как пользователь, я хочу, чтобы мои данные автоматически сохранялись на сервер, чтобы не потерять их при закрытии приложения или смене устройства.

#### Acceptance Criteria

1. WHEN пользователь изменяет любые данные в Client_Store (добавляет запись в дневник, изменяет воду, тренировки, профиль), THE Sync_System SHALL запустить Debounce_Timer на 2 секунды
2. WHEN Debounce_Timer истекает И отсутствуют новые изменения, THE Sync_System SHALL отправить User_State на сервер через Sync_API
3. WHEN новое изменение происходит до истечения Debounce_Timer, THE Sync_System SHALL сбросить таймер и запустить его заново
4. WHEN синхронизация успешно завершена, THE Sync_System SHALL обновить локальный timestamp последней синхронизации
5. WHEN синхронизация завершена, THE Sync_Status_Indicator SHALL показать статус "синхронизировано" на 2 секунды

### Requirement 2: Загрузка данных при входе в приложение

**User Story:** Как пользователь, я хочу видеть свои данные при входе с любого устройства, чтобы продолжить работу с того места, где остановился.

#### Acceptance Criteria

1. WHEN пользователь открывает приложение И аутентифицирован, THE Sync_System SHALL запросить User_State с сервера через Sync_API
2. WHEN серверные данные получены И Server_Database.updated_at новее локального timestamp, THE Sync_System SHALL заменить локальные данные серверными
3. WHEN серверные данные получены И локальный timestamp новее Server_Database.updated_at, THE Sync_System SHALL сохранить локальные данные и отправить их на сервер
4. WHEN серверные данные отсутствуют (первый вход), THE Sync_System SHALL отправить текущие локальные данные на сервер
5. WHEN загрузка данных завершена, THE Sync_System SHALL обновить Client_Store и отобразить актуальные данные пользователю

### Requirement 3: Работа в offline-режиме

**User Story:** Как пользователь, я хочу продолжать работать с приложением без интернета, чтобы не зависеть от качества связи.

#### Acceptance Criteria

1. WHEN пользователь изменяет данные В Offline_Mode, THE Client_Store SHALL сохранить изменения локально
2. WHEN Sync_System пытается синхронизировать данные В Offline_Mode, THE Sync_System SHALL пометить данные как "ожидающие синхронизации"
3. WHEN подключение к интернету восстановлено, THE Sync_System SHALL автоматически отправить все ожидающие изменения на сервер
4. WHILE приложение находится В Offline_Mode, THE Sync_Status_Indicator SHALL показывать статус "offline"
5. WHEN синхронизация после восстановления подключения завершена, THE Sync_Status_Indicator SHALL показать статус "синхронизировано"

### Requirement 4: Разрешение конфликтов синхронизации

**User Story:** Как пользователь, я хочу быть уведомлен, если мои данные были изменены на другом устройстве, чтобы понимать, какая версия данных актуальна.

#### Acceptance Criteria

1. WHEN Sync_System обнаруживает Conflict (Server_Database.updated_at > локального timestamp И локальные данные изменены), THE Sync_System SHALL применить серверные данные
2. WHEN Conflict разрешен, THE Sync_System SHALL показать уведомление пользователю: "Данные обновлены с сервера. Изменения с другого устройства применены."
3. WHEN уведомление о конфликте показано, THE Sync_System SHALL сохранить резервную копию локальных данных в localStorage под ключом "calorie-tracker-backup"
4. THE Sync_System SHALL хранить резервную копию в течение 7 дней
5. WHEN пользователь открывает приложение после разрешения конфликта, THE Sync_System SHALL показать уведомление с возможностью просмотра изменений

### Requirement 5: Индикатор статуса синхронизации

**User Story:** Как пользователь, я хочу видеть статус синхронизации, чтобы понимать, сохранены ли мои данные на сервер.

#### Acceptance Criteria

1. THE Sync_Status_Indicator SHALL отображаться в header приложения
2. WHEN синхронизация не выполняется И данные актуальны, THE Sync_Status_Indicator SHALL показывать иконку "✓" (зеленый цвет)
3. WHILE Sync_System выполняет синхронизацию, THE Sync_Status_Indicator SHALL показывать анимированную иконку загрузки
4. WHEN синхронизация завершилась с ошибкой, THE Sync_Status_Indicator SHALL показывать иконку "⚠" (желтый цвет) с текстом ошибки при наведении
5. WHILE приложение находится В Offline_Mode, THE Sync_Status_Indicator SHALL показывать иконку "○" (серый цвет) с текстом "Offline"
6. WHEN пользователь нажимает на Sync_Status_Indicator с ошибкой, THE Sync_System SHALL повторить попытку синхронизации

### Requirement 6: API endpoints для синхронизации

**User Story:** Как разработчик, я хочу иметь защищенные API endpoints для синхронизации, чтобы обеспечить безопасность пользовательских данных.

#### Acceptance Criteria

1. THE Sync_API SHALL предоставлять endpoint POST /api/sync для сохранения данных
2. THE Sync_API SHALL предоставлять endpoint GET /api/sync для загрузки данных
3. WHEN запрос приходит на Sync_API, THE Sync_API SHALL проверить аутентификацию пользователя через Telegram initData
4. WHEN аутентификация не пройдена, THE Sync_API SHALL вернуть HTTP 401 Unauthorized
5. THE Sync_API SHALL использовать Service_Role_Key только на сервере (в API routes)
6. WHEN POST /api/sync получает данные, THE Sync_API SHALL сохранить User_State в Server_Database.data (JSONB) и обновить Server_Database.updated_at
7. WHEN GET /api/sync запрашивает данные, THE Sync_API SHALL вернуть User_State и Server_Database.updated_at
8. WHEN пользователь не найден в Server_Database, THE Sync_API SHALL вернуть HTTP 404 Not Found

### Requirement 7: Оптимизация синхронизации

**User Story:** Как пользователь, я хочу, чтобы синхронизация не замедляла работу приложения, чтобы комфортно пользоваться им.

#### Acceptance Criteria

1. THE Sync_System SHALL использовать Debounce_Timer для группировки изменений
2. WHEN несколько изменений происходят в течение 2 секунд, THE Sync_System SHALL отправить только одну синхронизацию с финальным состоянием
3. THE Sync_System SHALL выполнять синхронизацию асинхронно без блокировки UI
4. WHEN синхронизация выполняется, THE Client_Store SHALL продолжать принимать изменения от пользователя
5. THE Sync_System SHALL ограничить размер отправляемых данных до 1 MB (проверка перед отправкой)
6. WHEN размер User_State превышает 1 MB, THE Sync_System SHALL показать предупреждение и не отправлять данные

### Requirement 8: Обработка ошибок синхронизации

**User Story:** Как пользователь, я хочу, чтобы приложение корректно обрабатывало ошибки синхронизации, чтобы не потерять данные при сбоях.

#### Acceptance Criteria

1. WHEN синхронизация завершается с ошибкой сети, THE Sync_System SHALL повторить попытку через 5 секунд (максимум 3 попытки)
2. WHEN все попытки синхронизации исчерпаны, THE Sync_System SHALL показать уведомление: "Не удалось синхронизировать данные. Проверьте подключение к интернету."
3. WHEN синхронизация завершается с ошибкой сервера (HTTP 500), THE Sync_System SHALL показать уведомление: "Ошибка сервера. Попробуйте позже."
4. WHEN синхронизация завершается с ошибкой аутентификации (HTTP 401), THE Sync_System SHALL перенаправить пользователя на страницу входа
5. THE Sync_System SHALL логировать все ошибки синхронизации в console для отладки
6. WHEN ошибка синхронизации происходит, THE Client_Store SHALL сохранить локальные данные без изменений

### Requirement 9: Безопасность синхронизации

**User Story:** Как пользователь, я хочу быть уверен, что мои данные защищены, чтобы никто не мог получить к ним доступ.

#### Acceptance Criteria

1. THE Sync_API SHALL использовать Service_Role_Key только в серверных API routes (не на клиенте)
2. THE Sync_API SHALL проверять Telegram initData для аутентификации пользователя
3. WHEN запрос на Sync_API не содержит валидного Telegram initData, THE Sync_API SHALL вернуть HTTP 401 Unauthorized
4. THE Sync_API SHALL использовать HTTPS для всех запросов
5. THE Server_Database SHALL использовать Row Level Security (RLS) с политикой service_role_only
6. THE Sync_API SHALL проверять, что пользователь имеет доступ только к своим данным (по telegram_id)

### Requirement 10: Миграция существующих данных

**User Story:** Как существующий пользователь, я хочу, чтобы мои текущие данные из localStorage были перенесены на сервер, чтобы не потерять историю.

#### Acceptance Criteria

1. WHEN пользователь впервые открывает приложение после внедрения синхронизации, THE Sync_System SHALL проверить наличие данных в localStorage
2. WHEN данные в localStorage существуют И данных на сервере нет, THE Sync_System SHALL отправить локальные данные на сервер
3. WHEN миграция завершена успешно, THE Sync_System SHALL установить флаг "migrated: true" в localStorage
4. WHEN миграция завершена, THE Sync_System SHALL показать уведомление: "Ваши данные успешно синхронизированы с сервером"
5. THE Sync_System SHALL выполнить миграцию только один раз (проверка флага "migrated")

## Non-Functional Requirements

### Performance

- Синхронизация SHALL завершаться в течение 3 секунд при нормальном подключении к интернету
- Debounce_Timer SHALL быть настроен на 2 секунды для оптимального баланса между частотой синхронизации и UX
- Размер отправляемых данных SHALL быть ограничен 1 MB

### Reliability

- Sync_System SHALL автоматически восстанавливать синхронизацию после восстановления подключения
- Sync_System SHALL сохранять локальные данные при любых ошибках синхронизации
- Sync_System SHALL выполнять до 3 попыток синхронизации при сетевых ошибках

### Usability

- Sync_Status_Indicator SHALL быть видимым, но не отвлекающим (небольшая иконка в header)
- Уведомления о конфликтах SHALL быть понятными и содержать информацию о действиях системы
- Приложение SHALL работать полностью функционально в Offline_Mode

### Security

- Service_Role_Key SHALL храниться только в переменных окружения на сервере
- Все запросы к Sync_API SHALL проходить аутентификацию через Telegram initData
- Server_Database SHALL использовать Row Level Security для защиты данных пользователей

### Maintainability

- Sync_System SHALL быть реализован как отдельный middleware для Zustand
- Sync_API SHALL быть реализован как отдельные API routes в Next.js
- Код синхронизации SHALL быть покрыт unit-тестами для критических функций (debounce, conflict resolution)
