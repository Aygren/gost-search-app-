import path from 'path';
import { config as dotenvConfig } from 'dotenv';

// Гарантируем загрузку .env из apps/backend при запуске из корня
const envPath = path.resolve(__dirname, '../.env');
dotenvConfig({ path: envPath });

import express, { Request, Response } from 'express';
import gigachatRouter from './routes/gigachat';
import tavilyRouter from './routes/tavily';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

// Настройка CORS для Replit
app.use(cors({
    origin: ['https://gost-search-app-.aygren.repl.co', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());

// Статические файлы для Replit
app.use(express.static(path.join(__dirname, '../../')));

// Корневой маршрут для проверки работы API
app.get('/api', (_req: Request, res: Response) => {
    res.json({
        message: 'GOST Search API is running!',
        endpoints: {
            health: '/health',
            gigachat: '/gigachat',
            tavily: '/tavily'
        }
    });
});

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/gigachat', gigachatRouter);
app.use('/tavily', tavilyRouter);

// Fallback для SPA
app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend listening on port ${PORT}`);
    console.log(`📡 API available at: http://localhost:${PORT}`);
    console.log(`🌐 Frontend available at: http://localhost:${PORT}`);

    if (!process.env.TAVILY_API_KEY) {
        console.error('⚠️  TAVILY_API_KEY is not set. Please check your environment variables.');
    }
    if (!process.env.GIGACHAT_CLIENT_ID) {
        console.error('⚠️  GIGACHAT_CLIENT_ID is not set. Please check your environment variables.');
    }
    if (!process.env.GIGACHAT_CLIENT_SECRET) {
        console.error('⚠️  GIGACHAT_CLIENT_SECRET is not set. Please check your environment variables.');
    }
}); 