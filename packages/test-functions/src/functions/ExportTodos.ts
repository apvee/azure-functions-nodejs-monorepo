import { parseQueryParams, ValidationError } from "@apvee/azure-functions-openapi";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { z } from "zod";
import { ErrorResponseSchema } from "../models/errors";
import { FilterParamsSchema } from "../models/params";
import { Todo, TodoListSchema } from "../models/todo";
import { TodoService } from "../services/TodoService";

/**
 * Converts todos array to CSV format.
 */
function todosToCSV(todos: Todo[]): string {
    if (todos.length === 0) return 'id,title,description,isDone\n';
    
    const header = 'id,title,description,isDone\n';
    const rows = todos.map(todo => 
        `${todo.id},"${todo.title}","${todo.description || ''}",${todo.isDone}`
    ).join('\n');
    
    return header + rows;
}

/**
 * Converts todos array to XML format.
 */
function todosToXML(todos: Todo[]): string {
    const items = todos.map(todo => `
  <todo>
    <id>${todo.id}</id>
    <title>${todo.title}</title>
    <description>${todo.description || ''}</description>
    <isDone>${todo.isDone}</isDone>
  </todo>`).join('');
    
    return `<?xml version="1.0" encoding="UTF-8"?>\n<todos>${items}\n</todos>`;
}

/**
 * Exports todos in multiple formats based on Accept header.
 * Supports JSON, CSV, and XML formats for content negotiation.
 * Demonstrates multi-content-type response handling.
 */
export async function ExportTodos(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Processing GET request for todos export: "${request.url}"`);

    try {
        const filterParams = parseQueryParams(request.query, FilterParamsSchema);

        const todos = await TodoService.getToDoList();
        const skip = filterParams.skip ?? 0;
        const limit = filterParams.limit ?? todos.length;
        const result = todos.slice(skip, Math.min(todos.length, skip + limit));

        // Content negotiation based on Accept header
        const acceptHeader = request.headers.get('accept') || 'application/json';
        
        if (acceptHeader.includes('text/csv')) {
            return {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="todos.csv"'
                },
                body: todosToCSV(result)
            };
        }
        
        if (acceptHeader.includes('application/xml') || acceptHeader.includes('text/xml')) {
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/xml'
                },
                body: todosToXML(result)
            };
        }
        
        // Default to JSON
        return { 
            status: 200, 
            jsonBody: result 
        };
    } catch (error) {
        if (error instanceof ValidationError) {
            const errorMessage = error.zodError?.issues
                .map(err => `'${err.path.join('.')}': ${err.message}`)
                .join(', ') || error.message;

            return { 
                status: 400, 
                jsonBody: { code: 400, message: errorMessage }
            };
        }
        throw error;
    }
}

app.openapiPath('ExportTodos', 'Export Todos in Multiple Formats', {
    handler: ExportTodos,
    methods: ['GET'],
    route: 'todos/export',
    query: FilterParamsSchema,
    responses: [
        {
            httpCode: 200,
            description: 'Todos exported successfully in requested format',
            content: [
                { 
                    mediaType: 'application/json', 
                    schema: TodoListSchema 
                },
                { 
                    mediaType: 'text/csv', 
                    schema: z.string().describe('CSV formatted todo list')
                },
                { 
                    mediaType: 'application/xml', 
                    schema: z.string().describe('XML formatted todo list')
                }
            ]
        },
        { httpCode: 400, schema: ErrorResponseSchema }
    ],
    tags: ['Todos'],
    description: 'Export all todos with optional pagination. Supports multiple formats (JSON, CSV, XML) ' +
                 'via Accept header content negotiation. Use Accept: application/json for JSON, ' +
                 'Accept: text/csv for CSV, or Accept: application/xml for XML.',
    operationId: 'ExportTodos'
});
