import { describe, it, expect } from 'vitest';
import { parseEasyAuthPrincipal, ValidationError } from '../src/utils';

function encode(obj: unknown): string {
    return Buffer.from(JSON.stringify(obj), 'utf-8').toString('base64');
}

describe('parseEasyAuthPrincipal', () => {
    it('parses a valid base64-encoded principal', () => {
        const header = encode({
            auth_typ: 'aad',
            userId: 'user-1',
            claims: [{ typ: 'name', val: 'Alice' }],
        });
        const principal = parseEasyAuthPrincipal(header);
        expect(principal.auth_typ).toBe('aad');
        expect(principal.userId).toBe('user-1');
    });

    it('throws ValidationError on missing required fields', () => {
        const header = encode({ claims: [] });
        expect(() => parseEasyAuthPrincipal(header)).toThrow(ValidationError);
    });

    it('throws ValidationError on invalid base64 / non-JSON content', () => {
        // Buffer.from(..., 'base64') is lenient, but the decoded bytes are not JSON
        expect(() => parseEasyAuthPrincipal('!!!not-base64!!!')).toThrow(ValidationError);
    });

    it('enforces the 64 KiB input length limit', () => {
        const oversized = 'A'.repeat(64 * 1024 + 1);
        expect(() => parseEasyAuthPrincipal(oversized)).toThrow(/exceeds/);
    });

    it('rejects non-string values', () => {
        // @ts-expect-error — intentional misuse for the runtime guard
        expect(() => parseEasyAuthPrincipal(undefined)).toThrow(ValidationError);
    });
});
