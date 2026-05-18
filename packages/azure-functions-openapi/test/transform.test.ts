import { describe, it, expect, beforeEach } from 'vitest';
import { getLogger, resetLogger, setLogger } from '../src/internal/logger';
import { transformToRouteConfig } from '../src/internal/transform';
import type { FunctionRouteConfig } from '../src/types';

interface CapturedLog {
    level: 'warn' | 'error';
    message: string;
    args: unknown[];
}

function makeRecordingLogger() {
    const logs: CapturedLog[] = [];
    setLogger({
        warn: (message, ...args) => logs.push({ level: 'warn', message, args }),
        error: (message, ...args) => logs.push({ level: 'error', message, args }),
    });
    return logs;
}

describe('transformToRouteConfig', () => {
    beforeEach(() => {
        resetLogger();
    });

    it('rejects mutually-exclusive response + responses', () => {
        const cfg = {
            methods: ['GET'],
            route: 'x',
            response: { _def: {} } as any,
            responses: [{ httpCode: 200 }],
        } as FunctionRouteConfig;
        expect(() => transformToRouteConfig(cfg)).toThrow(/Cannot use both 'response' and 'responses'/);
    });

    it('rejects mutually-exclusive schema + content inside a response', () => {
        const cfg = {
            methods: ['GET'],
            route: 'x',
            responses: [{ httpCode: 200, schema: {} as any, content: [{ mediaType: 'application/json' }] }],
        } as FunctionRouteConfig;
        expect(() => transformToRouteConfig(cfg)).toThrow(/Cannot use both 'schema' and 'content'/);
    });

    it('rejects duplicate httpCodes', () => {
        const cfg = {
            methods: ['GET'],
            route: 'x',
            responses: [
                { httpCode: 200, schema: {} as any },
                { httpCode: 200, schema: {} as any },
            ],
        } as FunctionRouteConfig;
        expect(() => transformToRouteConfig(cfg)).toThrow(/Duplicate httpCode: 200/);
    });

    it('warns for 2xx responses without body when not in the allow-list', () => {
        const logs = makeRecordingLogger();
        const cfg = {
            methods: ['GET'],
            route: 'x',
            responses: [{ httpCode: 200 }],
        } as FunctionRouteConfig;
        transformToRouteConfig(cfg);
        expect(logs.some((l) => l.level === 'warn' && /no schema or content/.test(l.message))).toBe(true);
    });

    it('does NOT warn for 204 / 205 / 304 without body', () => {
        const logs = makeRecordingLogger();
        const cfg = {
            methods: ['GET'],
            route: 'x',
            responses: [{ httpCode: 204 }, { httpCode: 205 }, { httpCode: 304 }],
        } as FunctionRouteConfig;
        transformToRouteConfig(cfg);
        expect(logs.length).toBe(0);
    });

    it('warns when both `request` and shortcuts are provided', () => {
        const logs = makeRecordingLogger();
        const cfg = {
            methods: ['POST'],
            route: 'x',
            body: {} as any,
            request: { body: { content: { 'application/json': { schema: {} as any } } } } as any,
            responses: [{ httpCode: 200, schema: {} as any }],
        } as FunctionRouteConfig;
        transformToRouteConfig(cfg);
        expect(logs.some((l) => /shortcuts \(params\/query\/body\/headers\)/.test(l.message))).toBe(true);
    });
});

describe('logger', () => {
    it('reset reverts to the default console logger', () => {
        const dummy = { warn: () => {}, error: () => {} };
        setLogger(dummy);
        expect(getLogger()).toBe(dummy);
        resetLogger();
        expect(getLogger()).not.toBe(dummy);
    });
});
