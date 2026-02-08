export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const getWebSocketUrl = (path: string) => {
    // If it's a browser, we can derive it or use the ENV
    const url = new URL(API_URL);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}${path}`;
};
