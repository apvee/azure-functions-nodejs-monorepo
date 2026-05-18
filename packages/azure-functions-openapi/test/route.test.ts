import { describe, it, expect } from 'vitest';
import { normalizeAzureFunctionRoute, normalizeOpenAPIPath, mapHttpMethod } from '../src/internal/route';

describe('normalizeAzureFunctionRoute', () => {
    it('strips leading slash', () => {
        expect(normalizeAzureFunctionRoute('/todos/{id}')).toBe('todos/{id}');
        expect(normalizeAzureFunctionRoute('todos/{id}')).toBe('todos/{id}');
    });
});

describe('normalizeOpenAPIPath', () => {
    it('combines prefix and route with a single leading slash', () => {
        expect(normalizeOpenAPIPath('api', '/todos/{id}')).toBe('/api/todos/{id}');
        expect(normalizeOpenAPIPath('api', 'todos/{id}')).toBe('/api/todos/{id}');
        expect(normalizeOpenAPIPath('/api/', '/todos/{id}')).toBe('/api/todos/{id}');
    });

    it('handles empty prefix', () => {
        expect(normalizeOpenAPIPath('', '/todos')).toBe('/todos');
    });
});

describe('mapHttpMethod', () => {
    it('maps Azure HTTP methods to lowercase OpenAPI methods', () => {
        expect(mapHttpMethod('GET')).toBe('get');
        expect(mapHttpMethod('POST')).toBe('post');
        expect(mapHttpMethod('PATCH')).toBe('patch');
        expect(mapHttpMethod('DELETE')).toBe('delete');
    });
});
