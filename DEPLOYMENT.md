# Руководство по деплою

## Локальный деплой

### Требования
- Node.js 18+
- pnpm
- Redis (опционально)

### Шаги
1. Клонируйте репозиторий
2. Установите зависимости: `pnpm install`
3. Создайте `.env` файл с API ключами
4. Запустите backend: `cd apps/backend && pnpm dev`
5. Запустите frontend: `cd apps/frontend && pnpm dev`

## Деплой на Vercel (Frontend)

1. Подключите репозиторий к Vercel
2. Укажите корневую папку: `apps/frontend`
3. Добавьте переменные окружения в Vercel Dashboard
4. Настройте API routes для проксирования запросов к backend

## Деплой на Railway (Backend)

1. Подключите репозиторий к Railway
2. Укажите корневую папку: `apps/backend`
3. Добавьте переменные окружения
4. Настройте порт: `process.env.PORT`

## Деплой на Docker

### Dockerfile для Backend
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install -g pnpm
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 4000
CMD ["pnpm", "start"]
```

### Dockerfile для Frontend
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install -g pnpm
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## Переменные окружения

### Backend (.env)
```env
TAVILY_API_KEY=your_tavily_api_key
GIGACHAT_CLIENT_ID=your_gigachat_client_id
GIGACHAT_CLIENT_SECRET=your_gigachat_client_secret
REDIS_URL=redis://localhost:6379
PORT=4000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Настройка CORS

В продакшене убедитесь, что CORS настроен правильно в backend:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
``` 