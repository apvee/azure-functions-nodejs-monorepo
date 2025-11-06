import { app } from "@azure/functions";
import { ErrorResponseSchema } from "../models/errors";
import { TodoParamIDSchema } from "../models/todo";

/**
 * Accepts/acknowledges a todo item by ID using a typed handler.
 * Route parameters are automatically validated and typed.
 * Returns 204 No Content on success (no response body).
 * This demonstrates proper handling of responses without body with typed handlers.
 */
app.openapiPath('AcceptTodo', 'Accept/Acknowledge Todo', {
    typedHandler: async ({ params, context }) => {
        // params.id is already validated and typed as string (UUID)!
        context.log(`Processing POST request to accept todo: ${params.id}`);

        // Mock acceptance - in production would call TodoService.acceptTodo(params.id)
        // No content returned for 204
        return { status: 204 };
    },
    methods: ['POST'],
    route: 'todos/{id}/accept',
    params: TodoParamIDSchema,
    responses: [
        { httpCode: 204, description: 'Todo accepted successfully - No content returned' },
        { httpCode: 400, schema: ErrorResponseSchema, description: 'Invalid todo ID format' },
        { httpCode: 404, schema: ErrorResponseSchema, description: 'Todo not found' }
    ],
    tags: ['Todos'],
    description: 'Accept/acknowledge a todo item. Returns 204 No Content on success with no response body. Route parameters are automatically validated.',
    operationId: 'AcceptTodo'
});
