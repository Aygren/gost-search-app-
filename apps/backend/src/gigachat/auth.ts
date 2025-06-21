import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from 'redis';
import https from 'https';

const GIGACHAT_AUTH_KEY = process.env.GIGACHAT_AUTH_KEY;
const TOKEN_CACHE_KEY = 'gigachat_access_token';

// --- Redis Client Initialization ---
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect().catch(err => console.error("Could not connect to Redis:", err));
// --------------------------------

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

export async function getGigaChatToken(): Promise<string> {
    if (!GIGACHAT_AUTH_KEY) {
        console.error("GIGACHAT_AUTH_KEY is not set in .env file");
        throw new Error("GigaChat auth key is missing.");
    }

    if (redisClient.isReady) {
        const cached = await redisClient.get(TOKEN_CACHE_KEY);
        if (cached) {
            console.log("Returning cached GigaChat token.");
            return cached;
        }
    } else {
        console.warn("Redis is not connected. Token caching is disabled.");
    }

    console.log("Requesting new GigaChat token...");
    const url = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': uuidv4(),
        'Authorization': `Basic ${GIGACHAT_AUTH_KEY}`,
    };
    const data = new URLSearchParams({ scope: 'GIGACHAT_API_PERS' });

    try {
        const response = await axios.post(url, data, { headers, httpsAgent, timeout: 10000 });
        const token = response.data.access_token;
        console.log("Successfully received new GigaChat token.");

        if (redisClient.isReady) {
            await redisClient.setEx(TOKEN_CACHE_KEY, 60 * 29, token);
            console.log("GigaChat token cached in Redis.");
        }
        return token;
    } catch (error: any) {
        console.error("Error getting GigaChat token:", error.response?.data || error.message);
        throw new Error("Failed to get GigaChat token.");
    }
} 