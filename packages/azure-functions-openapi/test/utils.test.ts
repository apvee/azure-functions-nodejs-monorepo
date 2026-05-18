import { describe, it, expect } from 'vitest';
import { isJsonContentType } from '../src/utils';

describe('isJsonContentType', () => {
    it('accepts application/json', () => {
        expect(isJsonContentType('application/json')).toBe(true);
    });

    it('accepts application/json with charset parameter', () => {
        expect(isJsonContentType('application/json; charset=utf-8')).toBe(true);
        expect(isJsonContentType('application/json;charset=utf-8')).toBe(true);
    });

    it('accepts JSON structured syntax suffix per RFC 6839', () => {
        expect(isJsonContentType('application/problem+json')).toBe(true);
        expect(isJsonContentType('application/ld+json')).toBe(true);
        expect(isJsonContentType('application/vnd.api+json')).toBe(true);
        expect(isJsonContentType('application/hal+json')).toBe(true);
    });

    it('is case-insensitive', () => {
        expect(isJsonContentType('Application/JSON')).toBe(true);
        expect(isJsonContentType('APPLICATION/PROBLEM+JSON')).toBe(true);
    });

    it('rejects non-JSON content types', () => {
        expect(isJsonContentType('text/plain')).toBe(false);
        expect(isJsonContentType('application/xml')).toBe(false);
        expect(isJsonContentType('text/json+invalid')).toBe(false);
        expect(isJsonContentType('multipart/form-data')).toBe(false);
    });

    it('rejects empty / missing values', () => {
        expect(isJsonContentType(null)).toBe(false);
        expect(isJsonContentType(undefined)).toBe(false);
        expect(isJsonContentType('')).toBe(false);
        expect(isJsonContentType('   ')).toBe(false);
    });
});
