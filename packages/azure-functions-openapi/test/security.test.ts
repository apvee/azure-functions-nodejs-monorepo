import { describe, it, expect } from 'vitest';
import {
    getDefaultSecurityForAuthLevel,
    mergeSecurityRequirements,
    checkAuthLevelEasyAuthConflict,
    validateAuthLevelSecurityCompatibility,
    AuthLevelWarningCollector,
    formatAuthLevelWarning,
} from '../src/internal/security/authLevel';
import {
    isEasyAuthEnabled,
    detectEasyAuthProvider,
    isRunningInAzure,
} from '../src/internal/security/autoDetect';

function withEnv(vars: Record<string, string | undefined>, fn: () => void): void {
    const snapshot: Record<string, string | undefined> = {};
    for (const k of Object.keys(vars)) {
        snapshot[k] = process.env[k];
        if (vars[k] === undefined) delete process.env[k];
        else process.env[k] = vars[k] as string;
    }
    try {
        fn();
    } finally {
        for (const k of Object.keys(snapshot)) {
            if (snapshot[k] === undefined) delete process.env[k];
            else process.env[k] = snapshot[k] as string;
        }
    }
}

describe('authLevel security mapping', () => {
    it('anonymous returns no default requirements', () => {
        expect(getDefaultSecurityForAuthLevel('anonymous')).toEqual([]);
    });

    it('function/admin map to AzureFunctionKey requirement', () => {
        expect(getDefaultSecurityForAuthLevel('function')).toEqual([{ AzureFunctionKey: [] }]);
        expect(getDefaultSecurityForAuthLevel('admin')).toEqual([{ AzureFunctionKey: [] }]);
    });

    it('mergeSecurityRequirements prefers explicit requirements when non-empty', () => {
        const explicit = [{ MyScheme: [] }];
        expect(mergeSecurityRequirements('function', explicit)).toEqual(explicit);
    });

    it('mergeSecurityRequirements falls back to default when empty/undefined', () => {
        expect(mergeSecurityRequirements('function', undefined)).toEqual([{ AzureFunctionKey: [] }]);
        expect(mergeSecurityRequirements('function', [])).toEqual([{ AzureFunctionKey: [] }]);
        expect(mergeSecurityRequirements('anonymous', undefined)).toEqual([]);
    });
});

describe('authLevel <-> EasyAuth conflict', () => {
    it('returns null when EasyAuth is not configured', () => {
        expect(checkAuthLevelEasyAuthConflict('function', null, 'GET /x')).toBeNull();
    });

    it('flags a conflict when EasyAuth is enabled and authLevel is not anonymous', () => {
        const cfg = { name: 'EasyAuth', providers: 'aad' } as unknown as Parameters<
            typeof checkAuthLevelEasyAuthConflict
        >[1];
        const warning = checkAuthLevelEasyAuthConflict('function', cfg, 'GET /x');
        expect(warning).not.toBeNull();
        expect(warning?.recommendedAuthLevel).toBe('anonymous');
    });

    it('returns null when EasyAuth is enabled and authLevel is anonymous', () => {
        const cfg = { name: 'EasyAuth', providers: 'aad' } as unknown as Parameters<
            typeof checkAuthLevelEasyAuthConflict
        >[1];
        expect(checkAuthLevelEasyAuthConflict('anonymous', cfg, 'GET /x')).toBeNull();
    });
});

describe('validateAuthLevelSecurityCompatibility', () => {
    it('flags EasyAuth + non-anonymous as a conflict', () => {
        const warning = validateAuthLevelSecurityCompatibility('function', undefined, true, 'GET /x');
        expect(warning).not.toBeNull();
        expect(warning?.recommendedAuthLevel).toBe('anonymous');
    });

    it('permits function/admin without explicit security (uses default keys)', () => {
        expect(validateAuthLevelSecurityCompatibility('function', undefined, false, 'GET /x')).toBeNull();
        expect(validateAuthLevelSecurityCompatibility('admin', [], false, 'GET /x')).toBeNull();
    });

    it('permits anonymous without security (open endpoint)', () => {
        expect(validateAuthLevelSecurityCompatibility('anonymous', undefined, false, 'GET /x')).toBeNull();
    });
});

describe('AuthLevelWarningCollector', () => {
    it('collects only non-null warnings', () => {
        const c = new AuthLevelWarningCollector();
        c.addWarning(null);
        c.addWarning({
            functionPath: 'GET /x',
            currentAuthLevel: 'function',
            recommendedAuthLevel: 'anonymous',
            reason: 'r',
        });
        expect(c.hasWarnings()).toBe(true);
        expect(c.getWarnings()).toHaveLength(1);
        expect(c.formatAll()).toContain('GET /x');
        c.clear();
        expect(c.hasWarnings()).toBe(false);
        expect(c.formatAll()).toBe('');
    });

    it('formatAuthLevelWarning produces a stable multi-line block', () => {
        const out = formatAuthLevelWarning({
            functionPath: 'GET /y',
            currentAuthLevel: 'admin',
            recommendedAuthLevel: 'anonymous',
            reason: 'just because',
        });
        expect(out).toContain('GET /y');
        expect(out).toContain("'admin'");
        expect(out).toContain("'anonymous'");
        expect(out).toContain('just because');
    });
});

describe('autoDetect — EasyAuth environment helpers', () => {
    it('isEasyAuthEnabled tracks WEBSITE_AUTH_ENABLED', () => {
        withEnv({ WEBSITE_AUTH_ENABLED: undefined }, () => {
            expect(isEasyAuthEnabled()).toBe(false);
        });
        withEnv({ WEBSITE_AUTH_ENABLED: 'true' }, () => {
            expect(isEasyAuthEnabled()).toBe(true);
        });
        withEnv({ WEBSITE_AUTH_ENABLED: '1' }, () => {
            expect(isEasyAuthEnabled()).toBe(true);
        });
        withEnv({ WEBSITE_AUTH_ENABLED: 'false' }, () => {
            expect(isEasyAuthEnabled()).toBe(false);
        });
    });

    it('detectEasyAuthProvider maps known providers and falls back to aad', () => {
        withEnv(
            { WEBSITE_AUTH_ENABLED: 'true', WEBSITE_AUTH_DEFAULT_PROVIDER: 'AzureActiveDirectory' },
            () => expect(detectEasyAuthProvider()).toBe('aad'),
        );
        withEnv(
            { WEBSITE_AUTH_ENABLED: 'true', WEBSITE_AUTH_DEFAULT_PROVIDER: 'google' },
            () => expect(detectEasyAuthProvider()).toBe('google'),
        );
        withEnv(
            { WEBSITE_AUTH_ENABLED: 'true', WEBSITE_AUTH_DEFAULT_PROVIDER: 'unknown-thing' },
            () => expect(detectEasyAuthProvider()).toBe('aad'),
        );
        withEnv(
            { WEBSITE_AUTH_ENABLED: 'false' },
            () => expect(detectEasyAuthProvider()).toBeNull(),
        );
    });

    it('isRunningInAzure checks WEBSITE_SITE_NAME', () => {
        withEnv({ WEBSITE_SITE_NAME: undefined }, () => {
            expect(isRunningInAzure()).toBe(false);
        });
        withEnv({ WEBSITE_SITE_NAME: 'app' }, () => {
            expect(isRunningInAzure()).toBe(true);
        });
    });
});
