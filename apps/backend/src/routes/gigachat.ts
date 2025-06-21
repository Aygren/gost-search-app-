import { Router } from 'express';
import { gigachatGetModels, gigachatCompletion } from '../gigachat';

const router = Router();

router.get('/models', async (req, res) => {
    try {
        const data = await gigachatGetModels();
        res.json(data);
    } catch (error) {
        console.error('GigaChat models error:', error);
        res.status(500).json({ error: 'GigaChat API error' });
    }
});

router.post('/completion', async (req, res) => {
    try {
        const { message, url, title, query } = req.body;

        if (!message || !url) {
            return res.status(400).json({ error: 'Message and URL are required' });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const gigaResponse = await gigachatCompletion(message, url, title, query);

        // Добавляем обработку ошибок стрима
        gigaResponse.data.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Stream error occurred' });
            } else {
                res.write(`data: [DONE]\n\n`);
                res.end();
            }
        });

        gigaResponse.data.pipe(res);

    } catch (error: any) {
        console.error('GigaChat completion route error:', error.message);

        // Извлекаем статус и сообщение из ошибки axios, если они есть
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'An unexpected error occurred on the server.';

        // Важно: если заголовки еще не были отправлены, мы можем отправить корректный HTTP-ответ с ошибкой.
        // В нашем случае, ошибка скорее всего произойдет до начала стрима, так что это сработает.
        if (!res.headersSent) {
            res.status(status).json({ error: `GigaChat API error: ${message}` });
        } else {
            // Если стрим уже начался, отправляем событие об ошибке
            res.write(`data: {"error": "${message}"}\n\n`);
            res.write(`data: [DONE]\n\n`);
            res.end();
        }
    }
});

export default router; 