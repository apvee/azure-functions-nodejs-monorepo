import { describe, it, expect } from 'vitest';
import { Swagger2Converter } from '../src/internal/converters/swagger2';

const minimalOAS3 = {
    openapi: '3.0.3',
    info: { title: 'API', version: '1.0.0' },
    paths: {
        '/users/{id}': {
            get: {
                operationId: 'getUser',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/User' },
                            },
                        },
                    },
                },
            },
        },
    },
    components: {
        schemas: {
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                },
                required: ['id'],
            },
        },
    },
};

describe('Swagger2Converter (B-side OAS 3.0 → 2.0)', () => {
    it('outputs swagger: "2.0" at the top level', () => {
        const converter = new Swagger2Converter(minimalOAS3);
        const out = converter.convert();
        expect(out.swagger).toBe('2.0');
    });

    it('preserves info.title and info.version', () => {
        const out = new Swagger2Converter(minimalOAS3).convert();
        expect(out.info?.title).toBe('API');
        expect(out.info?.version).toBe('1.0.0');
    });

    it('rewrites #/components/schemas $refs to Swagger 2.0 #/definitions', () => {
        const out = new Swagger2Converter(minimalOAS3).convert();
        const serialised = JSON.stringify(out);
        expect(serialised).not.toContain('#/components/schemas/User');
        expect(serialised).toContain('#/definitions/User');
        // Schemas are also moved into the standard top-level `definitions` map
        expect(out.definitions).toBeDefined();
        expect(out.definitions.User).toBeDefined();
    });

    it('does not mutate the input document', () => {
        const before = JSON.stringify(minimalOAS3);
        new Swagger2Converter(minimalOAS3).convert();
        const after = JSON.stringify(minimalOAS3);
        expect(after).toBe(before);
    });

    it('tolerates a non-object input by returning it unchanged', () => {
        // Defensive: the converter guards against non-object inputs in its `convert` method
        const out = new Swagger2Converter(null as unknown as object).convert();
        expect(out).toBeNull();
    });
});
