import { describe, it, expect, beforeEach } from 'vitest';
import { resolveServers } from '../src/internal/handlers/docs';
import { resetLogger, setLogger } from '../src/internal/logger';

describe('resolveServers (host-header injection protection — B1)', () => {
    beforeEach(() => {
        // Silence warnings emitted by the helper during the tests
        setLogger({ warn: () => {}, error: () => {} });
    });
    afterEachReset();

    function afterEachReset() {
        // afterEach via beforeEach trick — ensures reset between tests
        return resetLogger();
    }

    it('returns the configured servers when set, ignoring the request URL', () => {
        const configured = [{ url: 'https://api.example.com' }];
        const out = resolveServers(configured, 'https://evil.attacker.test/api/openapi.json', {
            trustHostHeader: false,
            trustedHosts: [],
        });
        expect(out).toEqual(configured);
    });

    it('returns undefined when trustHostHeader is false and no servers configured', () => {
        const out = resolveServers(undefined, 'https://anything.example.test/x', {
            trustHostHeader: false,
            trustedHosts: [],
        });
        expect(out).toBeUndefined();
    });

    it('honours the request origin when trustHostHeader is true and no allowlist is set', () => {
        const out = resolveServers(undefined, 'https://prod.example.com:8443/api/openapi.json', {
            trustHostHeader: true,
            trustedHosts: [],
        });
        expect(out).toEqual([{ url: 'https://prod.example.com:8443' }]);
    });

    it('rejects requests whose host is not in the allowlist', () => {
        const out = resolveServers(undefined, 'https://evil.attacker.test/api/openapi.json', {
            trustHostHeader: true,
            trustedHosts: ['api.example.com'],
        });
        expect(out).toBeUndefined();
    });

    it('accepts requests whose host matches the allowlist (case-insensitive)', () => {
        const out = resolveServers(undefined, 'https://API.example.com/api/openapi.json', {
            trustHostHeader: true,
            trustedHosts: ['api.example.com'],
        });
        // URL normalises the hostname to lower-case
        expect(out).toEqual([{ url: 'https://api.example.com' }]);
    });

    it('returns undefined for malformed request URLs', () => {
        const out = resolveServers(undefined, 'not a url at all', {
            trustHostHeader: true,
            trustedHosts: [],
        });
        expect(out).toBeUndefined();
    });

    it('treats an empty configured-servers array as not configured', () => {
        const out = resolveServers([], 'https://api.example.com/x', {
            trustHostHeader: false,
            trustedHosts: [],
        });
        expect(out).toBeUndefined();
    });
});
