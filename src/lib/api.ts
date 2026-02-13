const API_BASE = '/api';

interface RequestOptions extends RequestInit {
    token?: string;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { token, headers, ...rest } = options;
    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: { ...defaultHeaders, ...headers } as HeadersInit,
        ...rest,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    return response.json();
}
