import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

/**
 * A singleton instance of the OpenAPIRegistry.
 * 
 * This registry is used to manage and store OpenAPI definitions
 * for the application. It provides methods to register and retrieve
 * OpenAPI components such as schemas, paths, and responses.
 */
export const openAPIRegistry = new OpenAPIRegistry();