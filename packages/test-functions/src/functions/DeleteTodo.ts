import { parseRouteParams, ValidationError } from "@apvee/azure-functions-openapi";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ErrorResponse, ErrorResponseSchema } from "../models/errors";
import { TodoParamIDSchema } from "../models/todo";

/**
 * Deletes an existing todo item by ID.
 * Validates route parameters before deletion.
 */
export async function DeleteTodo(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Processing ${request.method} request to delete todo: "${request.url}"`);

    try {
        const params = parseRouteParams(request.params, TodoParamIDSchema);

        // Mock deletion - in production would call TodoService.deleteTodo(params.id)
        return { status: 204 };
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

app.openapiPath('DeleteTodo', 'Delete Single Todo', {
    handler: DeleteTodo,
    methods: ['DELETE'],
    route: 'todos/{id}',
    params: TodoParamIDSchema,
    responses: [
        { httpCode: 204, description: 'No Content - Successfully deleted' },
        { httpCode: 400, schema: ErrorResponseSchema },
        { httpCode: 404, schema: ErrorResponseSchema }
    ],
    tags: ['Todos'],
    description: 'Delete single todo by ID',
    operationId: 'DeleteTodo'
});