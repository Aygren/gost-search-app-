# GOST - Поиск и анализ российских нормативных документов

Веб-приложение для поиска и анализа российских нормативных документов (ГОСТ, СНиП и др.) с использованием ИИ.

## 🚀 Возможности

- **Умный поиск** документов по официальным источникам
- **AI-анализ** найденных документов с помощью GigaChat
- **Структурированный вывод** статуса и содержания документов
- **Современный интерфейс** с адаптивным дизайном
- **Потоковая обработка** ответов в реальном времени

## 🏗️ Архитектура

Проект построен на монорепозитории с использованием `pnpm workspaces`:

- **Frontend**: Next.js 14 с TypeScript и Tailwind CSS
- **Backend**: Node.js с Express и TypeScript
- **API интеграции**: Tavily Search API, GigaChat API
- **Кеширование**: Redis (опционально)

## 📁 Структура проекта

```
GOST/
├── apps/
│   ├── frontend/          # Next.js приложение
│   └── backend/           # Express сервер
├── packages/
│   └── shared/            # Общие типы и утилиты
├── package.json
└── pnpm-workspace.yaml
```

## 🛠️ Установка и запуск

### Предварительные требования

- Node.js 18+ 
- pnpm
- Redis (опционально)

### Установка зависимостей

```bash
# Установка pnpm (если не установлен)
npm install -g pnpm

# Клонирование репозитория
git clone <repository-url>
cd GOST

# Установка зависимостей
pnpm install
```

### Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
# Tavily API
TAVILY_API_KEY=your_tavily_api_key

# GigaChat API
GIGACHAT_CLIENT_ID=your_gigachat_client_id
GIGACHAT_CLIENT_SECRET=your_gigachat_client_secret

# Redis (опционально)
REDIS_URL=redis://localhost:6379
```

### Запуск в режиме разработки

```bash
# Запуск backend (порт 4000)
cd apps/backend
pnpm dev

# Запуск frontend (порт 3000)
cd apps/frontend
pnpm dev
```

### Сборка для продакшена

```bash
# Сборка frontend
cd apps/frontend
pnpm build

# Сборка backend
cd apps/backend
pnpm build
```

## 🔧 API Endpoints

### Backend API

- `GET /api/gigachat/models` - Получение доступных моделей GigaChat
- `POST /api/gigachat/completion` - Анализ документа через GigaChat
- `POST /api/tavily/search` - Поиск документов через Tavily

### Frontend API Routes

- `POST /api/search` - Поиск документов
- `POST /api/gigachat` - Прокси для GigaChat API

## 🎨 Технологии

### Frontend
- **Next.js 14** - React фреймворк
- **TypeScript** - Типизация
- **Tailwind CSS** - Стилизация
- **Lucide React** - Иконки

### Backend
- **Express.js** - Веб-сервер
- **TypeScript** - Типизация
- **Axios** - HTTP клиент
- **Cheerio** - Парсинг HTML
- **CORS** - Cross-origin requests

### API интеграции
- **Tavily Search API** - Поиск документов
- **GigaChat API** - AI анализ
- **Redis** - Кеширование (опционально)

## 📝 Лицензия

MIT License

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📞 Поддержка

При возникновении проблем создайте Issue в репозитории. 