import { parseRouteParams, ValidationError } from "@apvee/azure-functions-openapi";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ErrorResponse, ErrorResponseSchema } from "../models/errors";
import { TodoParamIDSchema, TodoSchema } from "../models/todo";
import { TodoService } from "../services/TodoService";

/**
 * Retrieves a single todo item by ID.
 * Returns 404 if the todo item is not found.
 */
export async function GetSingleTodo(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Processing GET request for single todo: "${request.url}"`);

    try {
        const params = parseRouteParams(request.params, TodoParamIDSchema);

        const todos = await TodoService.getToDoList();
        const todo = todos.find(todo => todo.id === params.id);

        if (!todo) {
            return { 
                status: 404, 
                jsonBody: { code: 404, message: 'Todo not found' } as ErrorResponse 
            };
        }

        return { status: 200, jsonBody: todo };
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

app.openapiPath('GetSingleTodo', 'Get Single Todo', {
    handler: GetSingleTodo,
    methods: ['GET'],
    route: 'todos/{id}',
    params: TodoParamIDSchema,
    responses: [
        { httpCode: 200, schema: TodoSchema },
        { httpCode: 400, schema: ErrorResponseSchema },
        { httpCode: 404, schema: ErrorResponseSchema }
    ],
    tags: ['Todos'],
    description: 'Get single todo by ID',
    operationId: 'GetSingleTodo'
});