export {
    ExternalDocumentationObject as OpenAPI3ExternalDocumentationObject,
    InfoObject as OpenAPI3InfoObject,
    OpenAPIObject as OpenAPI3OpenAPIObject,
    SecurityRequirementObject as OpenAPI3SecurityRequirementObject,
    ServerObject as OpenAPI3ServerObject,
    TagObject as OpenAPI3TagObject
} from 'openapi3-ts/oas30';
export { extendZodWithOpenApi, ZodRequestBody, } from '@asteasolutions/zod-to-openapi';
export { RouteParameter } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";