/**
 * This code has been modified from the original version.
 * Original file: "openapi3_to_swagger2.js"
 * Repository: https://github.com/LucyBot-Inc/api-spec-converter
 * License: MIT
 */

"use strict";
import camelCase from 'lodash.camelcase';
import cloneDeep from 'lodash.clonedeep';

const HTTP_METHODS: string[] = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
const SCHEMA_PROPERTIES: string[] = ['format', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'minLength', 'maxLength', 'multipleOf', 'minItems', 'maxItems', 'uniqueItems', 'minProperties', 'maxProperties', 'additionalProperties', 'pattern', 'enum', 'default'];
const ARRAY_PROPERTIES: string[] = ['type', 'items'];

const APPLICATION_JSON_REGEX = /^(application\/json|[^;\/ \t]+\/[^;\/ \t]+[+]json)[ \t]*(;.*)?$/i;
const SUPPORTED_MIME_TYPES = {
    APPLICATION_X_WWW_URLENCODED: 'application/x-www-form-urlencoded',
    MULTIPART_FORM_DATA: 'multipart/form-data'
};

function capitalizeFirstLetter(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts OpenAPI 3.x specifications to Swagger 2.0 format.
 */
export class Swagger2Converter {
    spec: any;

    constructor(openApiSpec: any) {
        this.spec = cloneDeep(openApiSpec);
    }

    convert(): any {
        if (typeof this.spec === 'object' && this.spec !== null) {
            this.spec.swagger = '2.0';
            this.convertInfos();
            this.convertOperations();
            if (this.spec.components) {
                this.convertSchemas();
                this.convertSecurityDefinitions();

                this.spec['x-components'] = this.spec.components;
                delete this.spec.components;

                fixRefs(this.spec);
            }
        }
        return this.spec;
    }

    private resolveReference(base: any, obj: any): any {
        if (!obj || !obj.$ref) return obj;
        const ref: string = obj.$ref;
        if (ref.startsWith('#')) {
            const keys = ref.split('/').map(k => k.replace(/~1/g, '/').replace(/~0/g, '~'));
            keys.shift();
            let cur: any = base;
            keys.forEach(k => { cur = cur ? cur[k] : undefined; });
            return cur ? cloneDeep(cur) : undefined;
        } else {
            throw new Error("Remote $ref URLs are not supported in this implementation.");
        }
    }

    private convertInfos(): void {
        const servers = this.spec.servers;
        const server = servers && servers[0];
        if (server) {
            let serverUrl: string = server.url;
            const variables = server.variables || {};
            for (const variable in variables) {
                const variableObject = variables[variable] || {};
                if (variableObject.default) {
                    const re = new RegExp(`{${variable}}`, 'g');
                    serverUrl = serverUrl.replace(re, variableObject.default);
                }
            }
            const url = new URL(serverUrl);
            this.spec.host = url.host || undefined;
            this.spec.schemes = url.protocol ? [url.protocol.replace(':', '')] : undefined;
            this.spec.basePath = url.pathname !== '/' ? url.pathname : undefined;
        }
        delete this.spec.servers;
        delete this.spec.openapi;
    }

    private convertOperations(): void {
        if (typeof this.spec.paths !== 'object') return;

        for (const path in this.spec.paths) {
            let pathObject = this.spec.paths[path] = this.resolveReference(this.spec, this.spec.paths[path]) || {};
            this.convertParameters(pathObject);
            for (const method in pathObject) {
                if (HTTP_METHODS.includes(method)) {
                    const operation = pathObject[method] = this.resolveReference(this.spec, pathObject[method]) || {};
                    operation.operationId = operation.operationId || capitalizeFirstLetter(camelCase(`${method}${operation.summary || path}`));
                    this.convertOperationParameters(operation);
                    this.convertResponses(operation);
                }
            }
        }
    }

    private convertOperationParameters(operation: any): void {
        operation.parameters = operation.parameters || [];
        if (operation.requestBody) {
            let param = this.resolveReference(this.spec, operation.requestBody) || {};

            if (operation.requestBody.content) {
                const contentType = getSupportedMimeTypes(operation.requestBody.content)[0];
                if (contentType) {
                    param.name = 'body';
                    param.in = contentType === SUPPORTED_MIME_TYPES.APPLICATION_X_WWW_URLENCODED ||
                        contentType === SUPPORTED_MIME_TYPES.MULTIPART_FORM_DATA ? 'formData' : 'body';
                    param.schema = operation.requestBody.content[contentType].schema;
                    if (param.in === 'formData' && param.schema.type === 'object' && param.schema.properties) {
                        const required = param.schema.required || [];
                        for (const name in param.schema.properties) {
                            const schema = param.schema.properties[name];
                            if (!schema.readOnly) {
                                const formDataParam = {
                                    name,
                                    in: 'formData',
                                    required: required.includes(name),
                                    ...schema
                                };
                                operation.parameters.push(formDataParam);
                            }
                        }
                    } else {
                        operation.parameters.push(param);
                    }
                    operation.consumes = [contentType];
                    this.convertSchema(param.schema, 'request');
                }
            }
            delete operation.requestBody;
        }
        this.convertParameters(operation);
    }

    private convertParameters(obj: any): void {
        if (!Array.isArray(obj.parameters)) return;

        obj.parameters.forEach((param: any, i: number) => {
            param = obj.parameters[i] = this.resolveReference(this.spec, param) || {};
            if (param.in !== 'body') {
                this.copySchemaProperties(param, SCHEMA_PROPERTIES);
                this.copySchemaProperties(param, ARRAY_PROPERTIES);
                this.copySchemaXProperties(param);
                if (!param.description) {
                    const schema = this.resolveReference(this.spec, param.schema);
                    if (schema && schema.description) {
                        param.description = schema.description;
                    }
                }
                delete param.schema;
                delete param.allowReserved;
                if (param.example !== undefined) {
                    param['x-example'] = param.example;
                    delete param.example;
                }
            }
            if (param.type === 'array') {
                const style = param.style || (['query', 'cookie'].includes(param.in) ? 'form' : 'simple');
                param.collectionFormat = this.getCollectionFormat(style, param.explode);
            }
            delete param.style;
            delete param.explode;
        });
    }

    private copySchemaProperties(obj: any, props: string[]): void {
        const schema = this.resolveReference(this.spec, obj.schema);
        if (!schema) return;
        props.forEach(prop => {
            if (schema[prop] !== undefined) {
                obj[prop] = schema[prop];
            }
        });
    }

    private copySchemaXProperties(obj: any): void {
        const schema = this.resolveReference(this.spec, obj.schema);
        if (!schema) return;
        for (const propName in schema) {
            if (propName.startsWith('x-') && !obj.hasOwnProperty(propName)) {
                obj[propName] = schema[propName];
            }
        }
    }

    private convertResponses(operation: any): void {
        if (typeof operation.responses !== 'object') return;

        for (const code in operation.responses) {
            const response = operation.responses[code] = this.resolveReference(this.spec, operation.responses[code]) || {};
            if (response.content) {
                let anySchema = null;
                let jsonSchema = null;
                for (const mediaRange in response.content) {
                    const mediaType = mediaRange.includes('*') ? 'application/octet-stream' : mediaRange;
                    operation.produces = operation.produces || [];
                    if (!operation.produces.includes(mediaType)) {
                        operation.produces.push(mediaType);
                    }

                    const content = response.content[mediaRange];
                    anySchema = anySchema || content.schema;
                    if (!jsonSchema && isJsonMimeType(mediaType)) {
                        jsonSchema = content.schema;
                    }

                    if (content.example) {
                        response.examples = response.examples || {};
                        response.examples[mediaType] = content.example;
                    }
                }

                if (anySchema) {
                    response.schema = jsonSchema || anySchema;
                    const resolvedSchema = this.resolveReference(this.spec, response.schema);
                    if (resolvedSchema && response.schema.$ref && !response.schema.$ref.startsWith('#')) {
                        response.schema = resolvedSchema;
                    }
                    this.convertSchema(response.schema, 'response');
                }
            }

            const headers = response.headers;
            if (headers) {
                for (const header in headers) {
                    const resolvedHeader = this.resolveReference(this.spec, headers[header]) || {};
                    if (resolvedHeader.schema) {
                        resolvedHeader.type = resolvedHeader.schema.type;
                        resolvedHeader.format = resolvedHeader.schema.format;
                        delete resolvedHeader.schema;
                    }
                    headers[header] = resolvedHeader;
                }
            }
            delete response.content;
        }
    }

    private convertSchema(def: any, operationDirection?: string): void {
        if (def.oneOf) {
            delete def.oneOf;
            delete def.discriminator;
        }

        if (def.anyOf) {
            delete def.anyOf;
            delete def.discriminator;
        }

        if (def.allOf) {
            def.allOf.forEach((subDef: any) => this.convertSchema(subDef, operationDirection));
        }

        if (def.discriminator) {
            if (def.discriminator.mapping) {
                this.convertDiscriminatorMapping(def.discriminator.mapping);
            }
            def.discriminator = def.discriminator.propertyName;
        }

        switch (def.type) {
            case 'object':
                if (def.properties) {
                    for (const propName in def.properties) {
                        if (def.properties[propName].writeOnly && operationDirection === 'response') {
                            delete def.properties[propName];
                        } else {
                            this.convertSchema(def.properties[propName], operationDirection);
                            delete def.properties[propName].writeOnly;
                        }
                    }
                }
            // fall through
            case 'array':
                if (def.items) {
                    this.convertSchema(def.items, operationDirection);
                }
                break;
        }

        if (def.nullable) {
            def['x-nullable'] = true;
            delete def.nullable;
        }

        if (def.deprecated !== undefined) {
            def['x-deprecated'] = def.deprecated;
            delete def.deprecated;
        }
    }

    private convertSchemas(): void {
        this.spec.definitions = this.spec.components.schemas;

        for (const defName in this.spec.definitions) {
            this.convertSchema(this.spec.definitions[defName]);
        }

        delete this.spec.components.schemas;
    }

    private convertDiscriminatorMapping(mapping: any): void {
        for (const payload in mapping) {
            const schemaNameOrRef = mapping[payload];
            if (typeof schemaNameOrRef !== 'string') {
                console.warn(`Ignoring ${schemaNameOrRef} for ${payload} in discriminator.mapping.`);
                continue;
            }

            let schema: any;
            if (/^[a-zA-Z0-9._-]+$/.test(schemaNameOrRef)) {
                schema = this.resolveReference(this.spec, { $ref: `#/components/schemas/${schemaNameOrRef}` });
            }

            if (!schema) {
                schema = this.resolveReference(this.spec, { $ref: schemaNameOrRef });
            }

            if (schema) {
                schema['x-discriminator-value'] = payload;
                schema['x-ms-discriminator-value'] = payload;
            } else {
                console.warn(`Unable to resolve ${schemaNameOrRef} for ${payload} in discriminator.mapping.`);
            }
        }
    }

    private convertSecurityDefinitions(): void {
        this.spec.securityDefinitions = this.spec.components.securitySchemes;
        for (const secKey in this.spec.securityDefinitions) {
            const security = this.spec.securityDefinitions[secKey];
            if (security.type === 'http' && security.scheme === 'basic') {
                security.type = 'basic';
                delete security.scheme;
            } else if (security.type === 'http' && security.scheme === 'bearer') {
                security.type = 'apiKey';
                security.name = 'Authorization';
                security.in = 'header';
                delete security.scheme;
                delete security.bearerFormat;
            } else if (security.type === 'oauth2') {
                const flowName = Object.keys(security.flows)[0];
                const flow = security.flows[flowName];

                security.flow = this.getOAuth2FlowName(flowName);
                security.authorizationUrl = flow.authorizationUrl;
                security.tokenUrl = flow.tokenUrl;
                security.scopes = flow.scopes;
                delete security.flows;
            }
        }
        delete this.spec.components.securitySchemes;
    }

    private getOAuth2FlowName(flowName: string): string {
        switch (flowName) {
            case 'clientCredentials':
                return 'application';
            case 'authorizationCode':
                return 'accessCode';
            default:
                return flowName;
        }
    }

    private getCollectionFormat(style: string, explode: boolean): string | undefined {
        switch (style) {
            case 'matrix':
                return explode ? undefined : 'csv';
            case 'label':
                return undefined;
            case 'simple':
                return 'csv';
            case 'spaceDelimited':
                return 'ssv';
            case 'pipeDelimited':
                return 'pipes';
            case 'deepObject':
                return 'multi';
            case 'form':
                return explode === false ? 'csv' : 'multi';
            default:
                return undefined;
        }
    }
}

function fixRef(ref: string): string {
    return ref
        .replace('#/components/schemas/', '#/definitions/')
        .replace('#/components/', '#/x-components/');
}

function fixRefs(obj: any): void {
    if (Array.isArray(obj)) {
        obj.forEach(fixRefs);
    } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
            if (key === '$ref') {
                obj.$ref = fixRef(obj.$ref);
            } else {
                fixRefs(obj[key]);
            }
        }
    }
}

function isJsonMimeType(type: string): boolean {
    return APPLICATION_JSON_REGEX.test(type);
}

function getSupportedMimeTypes(content: any): string[] {
    const MIME_VALUES = Object.values(SUPPORTED_MIME_TYPES);
    return Object.keys(content).filter(key => {
        return MIME_VALUES.includes(key) || isJsonMimeType(key);
    });
}