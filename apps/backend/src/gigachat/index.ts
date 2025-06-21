import axios from 'axios';
import { getGigaChatToken } from './auth';
import https from 'https';
import * as cheerio from 'cheerio';
import { tavilySearchDocuments } from '../tavily';

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

async function fetchPageContent(url: string): Promise<string> {
    try {
        const { data: html } = await axios.get(url, { httpsAgent, timeout: 10000 });
        const $ = cheerio.load(html);
        // Удаляем скрипты, стили и прочий мусор, чтобы оставить только текст
        $('script, style, nav, footer, header, .menu, .sidebar, .ad').remove();
        return $('body').text().replace(/\s\s+/g, ' ').trim();
    } catch (error: any) {
        console.error(`Failed to fetch and parse content from ${url}:`, error.message);
        throw new Error(`Не удалось загрузить содержимое со страницы по адресу: ${url}`);
    }
}

export async function gigachatGetModels() {
    const token = await getGigaChatToken();
    const url = 'https://gigachat.devices.sberbank.ru/api/v1/models';
    const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
    const response = await axios.get(url, { headers, httpsAgent });
    return response.data;
}

export async function gigachatCompletion(message: string, initialUrl: string, title?: string, query?: string) {
    let pageContent = '';
    let finalUrl = initialUrl;

    try {
        console.log(`Attempting to fetch content from initial URL: ${initialUrl}`);
        pageContent = await fetchPageContent(initialUrl);
    } catch (error) {
        console.warn(`Failed to fetch from ${initialUrl}. Reason: ${(error as Error).message}. Attempting to find alternatives...`);

        const fallbackQuery = query || title;
        if (fallbackQuery) {
            const initialDomain = new URL(initialUrl).hostname;
            console.log(`Searching for "${fallbackQuery}" on other trusted domains, excluding ${initialDomain}`);

            const searchResults = await tavilySearchDocuments(fallbackQuery, {
                exclude_domains: [initialDomain]
            });

            if (searchResults && searchResults.results) {
                for (const result of searchResults.results) {
                    try {
                        console.log(`Found alternative URL: ${result.url}. Attempting to fetch content...`);
                        pageContent = await fetchPageContent(result.url);
                        finalUrl = result.url;
                        console.log(`Successfully fetched content from alternative URL: ${finalUrl}`);
                        break; // Success, exit the loop
                    } catch (retryError) {
                        console.warn(`Failed to fetch from alternative URL ${result.url}. Reason: ${(retryError as Error).message}. Trying next alternative.`);
                    }
                }
            }
        }
    }

    if (!pageContent) {
        throw new Error(`Не удалось загрузить содержимое документа ни по исходному адресу, ни по найденным альтернативам.`);
    }

    const token = await getGigaChatToken();
    const completionsUrl = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';

    const context = `Название документа: ${title || 'Не указано'}\n\nСодержимое страницы по URL ${finalUrl}:\n\n${pageContent}`;

    const systemPrompt = `Ты — эксперт по российским нормативным документам. Твоя задача — проанализировать текст документа, который тебе предоставили.
Твой ответ должен быть СТРОГО структурирован:
1.  На первой строке напиши ТОЛЬКО статус документа, основываясь на тексте со страницы. Ищи слова "действующий", "отменен", "заменен", "не действующий". Если статус в тексте не указан, напиши "Статус: Не определен".
2.  После статуса, начиная с новой строки, напиши детальный анализ предоставленного текста.`;

    const messages = [
        { role: 'system', content: systemPrompt },
        {
            role: 'user',
            content: `Проанализируй документ, основываясь на следующем контексте:\n\n${context}`
        }
    ];

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    const data = {
        model: 'GigaChat:latest',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true
    };

    try {
        const response = await axios.post(completionsUrl, data, { headers, httpsAgent, responseType: 'stream' });
        return response;
    } catch (error: any) {
        console.error('GigaChat completion error status:', error.response?.status);
        console.error('GigaChat completion error data:', error.response?.data);
        console.error('Full GigaChat completion error:', error.message);
        throw error;
    }
} 