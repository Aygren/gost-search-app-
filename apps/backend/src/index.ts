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

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

app.use('/gigachat', gigachatRouter);
app.use('/tavily', tavilyRouter);

app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
    if (!process.env.TAVILY_API_KEY) {
        console.error('TAVILY_API_KEY is not set. Please check your .env file in apps/backend.');
    }
    if (!process.env.GIGACHAT_AUTH_KEY) {
        console.error('GIGACHAT_AUTH_KEY is not set. Please check your .env file in apps/backend.');
    }
}); 