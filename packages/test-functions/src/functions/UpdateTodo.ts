import { app } from "@azure/functions";
import { ErrorResponseSchema } from "../models/errors";
import { TodoParamIDSchema, TodoSchema, UpdateTodoSchema } from "../models/todo";
import { TodoService } from "../services/TodoService";

/**
 * Updates an existing todo item using a typed handler.
 * Both route parameters and request body are automatically validated and typed.
 * Validation errors return 400 Bad Request automatically.
 */
app.openapiPath('UpdateTodo', 'Update Single Todo', {
    typedHandler: async ({ params, body, context }) => {
        // params and body are already validated and typed!
        // Type inference: params.id: string (UUID), body: UpdateTodo
        context.log(`Processing request to update todo: ${params.id}`);

        const todo = await TodoService.updateTodo(params.id, body);
        return { status: 200, jsonBody: todo };
    },
    methods: ['PUT', 'PATCH'],
    route: 'todos/{id}',
    params: TodoParamIDSchema,
    body: UpdateTodoSchema,
    responses: [
        { httpCode: 200, schema: TodoSchema, description: 'Todo updated successfully' },
        { httpCode: 400, schema: ErrorResponseSchema, description: 'Invalid request parameters or body' },
        { httpCode: 404, schema: ErrorResponseSchema, description: 'Todo not found' }
    ],
    tags: ['Todos'],
    description: 'Update single todo by ID. Both route parameters and body are automatically validated.',
    operationId: 'UpdateTodo'
});