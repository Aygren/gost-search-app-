# 🚀 Деплой на Replit

## Пошаговая инструкция

### 1. Создание нового Repl

1. Перейдите на [replit.com](https://replit.com) и войдите в аккаунт
2. Нажмите кнопку **"Create Repl"**
3. Выберите **"Import from GitHub"**
4. Вставьте URL вашего репозитория: `https://github.com/Aygren/gost-search-app-`
5. Выберите язык **"Node.js"**
6. Нажмите **"Import from GitHub"**

### 2. Настройка переменных окружения

После импорта проекта:

1. В левой панели найдите вкладку **"Secrets"** (значок замка 🔒)
2. Добавьте следующие переменные:

```
TAVILY_API_KEY = ваш_ключ_tavily
GIGACHAT_CLIENT_ID = ваш_client_id_gigachat  
GIGACHAT_CLIENT_SECRET = ваш_client_secret_gigachat
```

### 3. Запуск проекта

1. Нажмите кнопку **"Run"** в верхней части экрана
2. Replit автоматически установит зависимости и запустит проект
3. В консоли вы увидите сообщения о запуске сервера

### 4. Доступ к приложению

После успешного запуска:
- **Frontend**: Откроется автоматически в правой панели
- **API**: Доступен по адресу `https://your-repl-name.your-username.repl.co`

## 🔧 Структура проекта на Replit

```
/
├── .replit              # Конфигурация Replit
├── replit.nix           # Зависимости системы
├── index.html           # Упрощенный фронтенд
├── apps/
│   ├── backend/         # Backend API
│   └── frontend/        # Next.js фронтенд (не используется на Replit)
└── package.json         # Корневой package.json
```

## 🌐 Особенности деплоя на Replit

### Преимущества:
- ✅ **Бесплатный хостинг**
- ✅ **Автоматическая установка зависимостей**
- ✅ **Встроенная база данных** (если понадобится)
- ✅ **Простота настройки**
- ✅ **Публичный доступ**

### Ограничения:
- ⚠️ **Таймауты** - Replit может "засыпать" при неактивности
- ⚠️ **Лимиты ресурсов** - ограниченная память и CPU
- ⚠️ **Публичный код** - код виден всем (если не настроен приватный режим)

## 🛠️ Устранение неполадок

### Проблема: "Module not found"
**Решение**: Убедитесь, что все зависимости установлены:
```bash
pnpm install
```

### Проблема: "API keys not set"
**Решение**: Проверьте переменные окружения в Secrets

### Проблема: "CORS error"
**Решение**: Обновите CORS настройки в `apps/backend/src/index.ts`

### Проблема: "Port already in use"
**Решение**: Replit автоматически назначает порт, проверьте переменную `PORT`

## 📱 Тестирование

1. **Поиск документов**: Введите запрос в поле поиска
2. **Анализ**: Кликните на найденный документ для анализа
3. **API тест**: Перейдите на `/health` для проверки API

## 🔄 Обновление

Для обновления кода на Replit:
1. Внесите изменения в локальный репозиторий
2. Отправьте изменения на GitHub: `git push`
3. На Replit нажмите **"Sync"** для обновления кода

## 📞 Поддержка

При возникновении проблем:
1. Проверьте консоль на наличие ошибок
2. Убедитесь, что все API ключи настроены
3. Проверьте логи в консоли Replit 