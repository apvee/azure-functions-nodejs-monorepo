import { parseQueryParams, ValidationError } from "@apvee/azure-functions-openapi";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { z } from "zod";
import { ErrorResponse, ErrorResponseSchema } from "../models/errors";
import { FilterParamsSchema } from "../models/params";
import { TodoListSchema } from "../models/todo";
import { TodoService } from "../services/TodoService";

/**
 * Retrieves a list of todos with optional pagination.
 * Supports skip and limit query parameters for pagination.
 */
export async function GetAllTodos(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Processing GET request for todos list: "${request.url}"`);

    try {
        const filterParams = parseQueryParams(request.query, FilterParamsSchema);

        const todos = await TodoService.getToDoList();
        const skip = filterParams.skip ?? 0;
        const limit = filterParams.limit ?? todos.length;
        const result = todos.slice(skip, Math.min(todos.length, skip + limit));

        return { 
            status: 200, 
            jsonBody: result,
            headers: {
                'X-Total-Count': todos.length.toString(),
                'X-Page-Offset': skip.toString(),
                'X-Page-Limit': limit.toString(),
                'X-Returned-Count': result.length.toString()
            }
        };
    } catch (error) {
        if (error instanceof ValidationError) {
            const errorMessage = error.zodError?.issues
                .map(err => `'${err.path.join('.')}': ${err.message}`)
                .join(', ') || error.message;

            return { 
                status: 400, 
                jsonBody: { code: 400, message: errorMessage } as ErrorResponse 
            };
        }
        throw error;
    }
}

app.openapiPath('GetAllTodos', 'Get All Todos', {
    handler: GetAllTodos,
    methods: ['GET'],
    route: 'todos',
    query: FilterParamsSchema,
    responses: [
        { 
            httpCode: 200, 
            schema: TodoListSchema,
            headers: z.object({
                'X-Total-Count': z.string().describe('Total number of todos available'),
                'X-Page-Offset': z.string().describe('Pagination offset (skip)'),
                'X-Page-Limit': z.string().describe('Pagination limit'),
                'X-Returned-Count': z.string().describe('Number of items returned in this response')
            }),
            description: 'Success - Returns paginated list with pagination headers'
        },
        { httpCode: 400, schema: ErrorResponseSchema }
    ],
    tags: ['Todos'],
    description: 'Get all todos with optional pagination. Returns custom headers with pagination metadata.',
    operationId: 'GetAllTodos'
});