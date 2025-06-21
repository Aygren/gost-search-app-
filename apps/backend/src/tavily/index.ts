import axios from 'axios';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY!;
console.log('TAVILY_API_KEY:', TAVILY_API_KEY);

export async function tavilySearchDocuments(query: string, filters?: Record<string, any>) {
    // Tavily может не поддерживать фильтр "status" напрямую. Мы передадим его, но он может быть проигнорирован.
    // Основная логика фильтрации по статусу будет в итоге на этапе анализа через GigaChat.
    // Пока добавим моковые данные о статусе и тегах в результаты.
    const url = 'https://api.tavily.com/search';
    const enhancedQuery = `${query} (ГОСТ OR ОСТ OR РД OR СП) -СНиП`;

    const headers = {
        'Authorization': `Bearer ${TAVILY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    const data = {
        query: enhancedQuery,
        max_results: 10,
        include_domains: [
            "gostinfo.ru",
            "protect.gost.ru",
            "files.stroyinf.ru"
        ],
        ...filters
    };

    try {
        const response = await axios.post(url, data, { headers, timeout: 10000 });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.log('Tavily error response:', error.response?.data, error.response?.status, error.response?.headers);
        }
        throw error;
    }
} 