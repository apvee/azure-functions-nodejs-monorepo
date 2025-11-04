import { app } from "@azure/functions";
import { z } from "zod";
import { ErrorResponseSchema } from "../models/errors";
import { TodoSchema } from "../models/todo";

/**
 * Webhook event schema for todo creation notifications.
 * Sent to external systems when a new todo is created.
 */
const TodoEventSchema = z.object({
    event: z.literal('todo.created'),
    timestamp: z.string().datetime(),
    data: TodoSchema
});

/**
 * Acknowledgment schema returned by webhook consumers.
 */
const WebhookAckSchema = z.object({
    received: z.boolean(),
    processedAt: z.string().datetime().optional()
});

/**
 * Webhook handler for todo creation events using a typed handler.
 * Request body is automatically validated against TodoEventSchema.
 * This demonstrates how external systems should handle our webhook notifications.
 * In a real scenario, this would be implemented by the webhook consumer, not us.
 */
app.openapiWebhook('TodoCreated', 'Todo Creation Webhook', {
    typedHandler: async ({ body, context }) => {
        // body is already validated and typed as TodoEvent!
        // Type inference: body.event: 'todo.created', body.data: Todo
        context.log(`Webhook received: ${body.event} for todo ${body.data.id} at ${body.timestamp}`);

        // Mock webhook processing
        return {
            status: 200,
            jsonBody: {
                received: true,
                processedAt: new Date().toISOString()
            }
        };
    },
    methods: ['POST'],
    route: 'webhooks/todo-created',
    body: TodoEventSchema,
    responses: [
        { 
            httpCode: 200, 
            schema: WebhookAckSchema,
            description: 'Webhook received and acknowledged successfully' 
        },
        { 
            httpCode: 400, 
            schema: ErrorResponseSchema,
            description: 'Invalid webhook payload - automatic validation failed' 
        },
        { 
            httpCode: 500, 
            schema: ErrorResponseSchema,
            description: 'Webhook processing failed' 
        }
    ],
    tags: ['Webhooks'],
    description: 'Webhook endpoint that notifies external systems when a new todo is created. ' +
                 'External systems should implement this endpoint to receive notifications. ' +
                 'Request body is automatically validated.',
    operationId: 'TodoCreatedWebhook'
});
