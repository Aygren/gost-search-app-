import { Router } from 'express';
import { tavilySearchDocuments } from '../tavily';

const router = Router();

router.post('/search', async (req, res) => {
    try {
        const { query, filters } = req.body;
        if (!query) return res.status(400).json({ error: 'Query is required' });
        const data = await tavilySearchDocuments(query, filters);
        res.json(data);
    } catch (error) {
        console.error('Tavily search error:', error);
        res.status(500).json({ error: 'Tavily API error' });
    }
});

export default router; 