import { describe, it, expect } from 'vitest';
import {
    escapeJsonForScript,
    redactSensitiveUrl,
    isRunningOnAzure,
    SENSITIVE_QUERY_KEYS,
} from '../src/internal/sanitize';

describe('escapeJsonForScript', () => {
    it('escapes closing script tags', () => {
        const out = escapeJsonForScript({ s: '</script>' });
        expect(out).not.toContain('</script>');
        expect(out).toContain('\\u003c/script\\u003e');
        expect(JSON.parse(out)).toEqual({ s: '</script>' });
    });

    it('escapes U+2028 / U+2029 line separators', () => {
        const out = escapeJsonForScript({ s: 'a\u2028b\u2029c' });
        expect(out).not.toMatch(/[\u2028\u2029]/);
        expect(out).toContain('\\u2028');
        expect(out).toContain('\\u2029');
        expect(JSON.parse(out)).toEqual({ s: 'a\u2028b\u2029c' });
    });

    it('escapes ampersands and angle brackets', () => {
        const out = escapeJsonForScript({ s: '<&>' });
        expect(out).toContain('\\u003c');
        expect(out).toContain('\\u003e');
        expect(out).toContain('\\u0026');
    });

    it('round-trips plain values', () => {
        expect(JSON.parse(escapeJsonForScript([1, 2, 3]))).toEqual([1, 2, 3]);
        expect(JSON.parse(escapeJsonForScript('hello'))).toBe('hello');
        expect(JSON.parse(escapeJsonForScript(null))).toBe(null);
    });
});

describe('redactSensitiveUrl', () => {
    it('redacts the default sensitive query parameters', () => {
        for (const key of SENSITIVE_QUERY_KEYS) {
            const out = redactSensitiveUrl(`https://example.com/api?${key}=super-secret`);
            expect(out).not.toContain('super-secret');
            expect(out).toContain('REDACTED');
        }
    });

    it('is case-insensitive on parameter names', () => {
        const out = redactSensitiveUrl('https://example.com/api?CODE=secret&X-Functions-Key=k');
        expect(out).not.toContain('secret');
        expect(out).not.toMatch(/=k(&|$)/);
        expect(out).toContain('REDACTED');
    });

    it('preserves non-sensitive query parameters', () => {
        const out = redactSensitiveUrl('https://example.com/api?id=42&code=secret');
        expect(out).toContain('id=42');
        expect(out).not.toContain('code=secret');
    });

    it('supports additional custom keys', () => {
        const out = redactSensitiveUrl('https://example.com/?signature=abc', ['signature']);
        expect(out).not.toContain('abc');
        expect(out).toContain('REDACTED');
    });

    it('returns the input unchanged for non-URL strings', () => {
        expect(redactSensitiveUrl('not a url')).toBe('not a url');
    });
});

describe('isRunningOnAzure', () => {
    it('returns true when WEBSITE_SITE_NAME is set', () => {
        const previous = process.env.WEBSITE_SITE_NAME;
        process.env.WEBSITE_SITE_NAME = 'my-test-app';
        try {
            expect(isRunningOnAzure()).toBe(true);
        } finally {
            if (previous === undefined) {
                delete process.env.WEBSITE_SITE_NAME;
            } else {
                process.env.WEBSITE_SITE_NAME = previous;
            }
        }
    });

    it('returns false when WEBSITE_SITE_NAME is unset', () => {
        const previous = process.env.WEBSITE_SITE_NAME;
        delete process.env.WEBSITE_SITE_NAME;
        try {
            expect(isRunningOnAzure()).toBe(false);
        } finally {
            if (previous !== undefined) {
                process.env.WEBSITE_SITE_NAME = previous;
            }
        }
    });
});
