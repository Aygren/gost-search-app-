import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    const body = await req.json();
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

    try {
        const backendRes = await fetch(`${backendUrl}/gigachat/completion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!backendRes.ok || !backendRes.body) {
            const errorText = await backendRes.text();
            console.error('Backend error:', errorText);
            return new Response(JSON.stringify({ error: 'GigaChat API error on backend' }), {
                status: backendRes.status
            });
        }
        
        const stream = new ReadableStream({
            async start(controller) {
                const reader = backendRes.body!.getReader();
                const decoder = new TextDecoder();

                function push() {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            controller.close();
                            return;
                        }
                        controller.enqueue(value);
                        push();
                    }).catch(err => {
                        console.error('Stream reading error:', err);
                        controller.error(err);
                    });
                }
                push();
            }
        });
        
        return new Response(stream, {
            headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
        });

    } catch (error) {
        console.error('Error forwarding to GigaChat:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
} 