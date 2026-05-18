import { describe, it, expect, beforeEach } from 'vitest';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { registerAzureFunctionKey } from '../src/internal/security/functionKeys';
import { openAPIRegistry } from '../src/internal/registry';

/**
 * The shared registry is module-level; we read its raw definitions before/after
 * each test to scope assertions to the schemes we just registered.
 */
function captureSchemes(name: RegExp): Array<{ name: string; def: any }> {
    const registry = openAPIRegistry as unknown as OpenAPIRegistry;
    const defs = (registry as unknown as { definitions: any[] }).definitions;
    return defs
        .filter((d) => d.type === 'component' && d.componentType === 'securitySchemes' && name.test(d.name))
        .map((d) => ({ name: d.name, def: d.component }));
}

describe('registerAzureFunctionKey', () => {
    beforeEach(() => {
        // Reset any state by recreating registry definitions is intrusive;
        // we instead scope queries by unique scheme names.
    });

    it('registers TWO schemes (query + header) when both locations are allowed', () => {
        const unique = `FnKey_${Date.now()}_both`;
        const requirement = registerAzureFunctionKey({
            name: unique,
            authLevel: 'function',
            allowQueryParameter: true,
            allowHeader: true,
        });

        const schemes = captureSchemes(new RegExp(`^${unique}_`));
        const names = schemes.map((s) => s.name).sort();
        expect(names).toEqual([`${unique}_Header`, `${unique}_Query`]);

        const headerScheme = schemes.find((s) => s.name.endsWith('_Header'))!.def;
        const queryScheme = schemes.find((s) => s.name.endsWith('_Query'))!.def;
        expect(headerScheme.in).toBe('header');
        expect(headerScheme.name).toBe('x-functions-key');
        expect(queryScheme.in).toBe('query');
        expect(queryScheme.name).toBe('code');

        // Both names must appear in a single security requirement => logical OR.
        expect(Object.keys(requirement).sort()).toEqual([`${unique}_Header`, `${unique}_Query`]);
    });

    it('registers a single scheme when only one location is allowed', () => {
        const uniqueQuery = `FnKey_${Date.now()}_queryOnly`;
        registerAzureFunctionKey({
            name: uniqueQuery,
            authLevel: 'function',
            allowQueryParameter: true,
            allowHeader: false,
        });
        const queryOnly = captureSchemes(new RegExp(`^${uniqueQuery}$`));
        expect(queryOnly).toHaveLength(1);
        expect(queryOnly[0].def.in).toBe('query');
        expect(queryOnly[0].def.name).toBe('code');

        const uniqueHeader = `FnKey_${Date.now()}_headerOnly`;
        registerAzureFunctionKey({
            name: uniqueHeader,
            authLevel: 'function',
            allowQueryParameter: false,
            allowHeader: true,
        });
        const headerOnly = captureSchemes(new RegExp(`^${uniqueHeader}$`));
        expect(headerOnly).toHaveLength(1);
        expect(headerOnly[0].def.in).toBe('header');
        expect(headerOnly[0].def.name).toBe('x-functions-key');
    });

    it('records Azure vendor extensions', () => {
        const unique = `FnKey_${Date.now()}_vendor`;
        registerAzureFunctionKey({
            name: unique,
            authLevel: 'admin',
            allowQueryParameter: false,
            allowHeader: true,
        });
        const [{ def }] = captureSchemes(new RegExp(`^${unique}$`));
        expect(def['x-azure-function-authLevel']).toBe('admin');
        expect(def['x-azure-function-allowQuery']).toBe(false);
        expect(def['x-azure-function-allowHeader']).toBe(true);
    });
});
