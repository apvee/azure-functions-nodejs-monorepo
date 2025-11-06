import { app } from "@azure/functions";
import { ErrorResponseSchema } from "../models/errors";
import { NewTodoSchema, TodoSchema } from "../models/todo";
import { TodoService } from "../services/TodoService";

/**
 * Creates a new todo item using a typed handler.
 * Request body is automatically validated and typed from NewTodoSchema.
 * Validation errors return 400 Bad Request automatically.
 */
app.openapiPath('AddToDo', 'Add a new todo', {
    typedHandler: async ({ body, context }) => {
        // body is already validated and typed as NewTodo!
        // Type inference: body.title: string, body.description: string
        context.log(`Processing POST request to create todo with title: "${body.title}"`);

        const newTodo = await TodoService.addToDo(body);
        return { status: 200, jsonBody: newTodo };
    },
    methods: ['POST'],
    route: 'todos',
    body: NewTodoSchema,
    responses: [
        { httpCode: 200, schema: TodoSchema, description: 'Todo created successfully' },
        { httpCode: 400, schema: ErrorResponseSchema, description: 'Invalid request body' }
    ],
    tags: ['Todos'],
    description: 'Add a new todo item. Request body is automatically validated.',
    operationId: 'addTodo'
});