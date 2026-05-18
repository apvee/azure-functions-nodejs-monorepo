import { describe, it, expect, beforeEach } from 'vitest';
import type { HttpRequest } from '@azure/functions';
import { createSafeRequest } from '../src/internal/parsing';

/**
 * Minimal HttpRequest-like object that exercises:
 *  - own enumerable properties (url, method, params, query)
 *  - prototype methods (json, text)
 *  - prototype getter (headers)
 *  - prototype-only helper (custom)
 */
class FakeHttpRequest {
    url = 'https://example.com/api/things/42';
    method = 'POST';
    params = { id: '42' };
    query = new URLSearchParams('a=1');

    private _headers = new Map<string, string>([['content-type', 'application/json']]);

    get headers() {
        return {
            get: (name: string) => this._headers.get(name.toLowerCase()) ?? null,
        };
    }

    async json(): Promise<unknown> {
        return { hello: 'world' };
    }

    async text(): Promise<string> {
        return JSON.stringify({ hello: 'world' });
    }

    /** Prototype-only method used to verify that proxying preserves `this` binding. */
    helper(): string {
        return `${this.method} ${this.url}`;
    }
}

const asHttpRequest = (req: FakeHttpRequest): HttpRequest => req as unknown as HttpRequest;

describe('createSafeRequest', () => {
    let raw: FakeHttpRequest;

    beforeEach(() => {
        raw = new FakeHttpRequest();
    });

    it('returns the original request when body was not parsed', () => {
        const safe = createSafeRequest(asHttpRequest(raw), false);
        expect(safe).toBe(raw as unknown as HttpRequest);
    });

    it('preserves own enumerable properties (url, method, params)', () => {
        const safe = createSafeRequest(asHttpRequest(raw), true);
        expect(safe.url).toBe(raw.url);
        expect(safe.method).toBe(raw.method);
        expect(safe.params).toEqual(raw.params);
    });

    it('preserves prototype getter `headers` and forwards calls', () => {
        const safe = createSafeRequest(asHttpRequest(raw), true);
        expect(safe.headers.get('content-type')).toBe('application/json');
        expect(safe.headers.get('CONTENT-TYPE')).toBe('application/json');
    });

    it('preserves prototype methods and keeps `this` binding correct', () => {
        const safe = createSafeRequest(asHttpRequest(raw), true);
        // The custom helper relies on `this.method` and `this.url`. If the wrapper
        // broke prototype binding, this would throw or return undefined values.
        const helperResult = (safe as unknown as FakeHttpRequest).helper();
        expect(helperResult).toBe('POST https://example.com/api/things/42');
    });

    it('blocks body-consuming methods with a helpful error', async () => {
        const safe = createSafeRequest(asHttpRequest(raw), true);
        await expect(safe.json()).rejects.toThrow(/body has already been parsed/);
        await expect(safe.text()).rejects.toThrow(/body has already been parsed/);
    });
});
