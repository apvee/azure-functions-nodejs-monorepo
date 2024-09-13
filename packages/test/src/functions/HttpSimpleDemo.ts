import { registerFunction, registerTypeSchema, z } from "@apvee/azure-fx-openapi";
import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

const SimpleDemoRequestZodSchema = z.object({
    id: z.string().describe("The Id of the Object"),
    title: z.string().describe("The Title of the Object"),
    tags: z.array(z.string()).describe("The Tags of the Object"),
}).describe("The Simple Demo Request Object");
registerTypeSchema('SimpleDemoRequest', SimpleDemoRequestZodSchema);

const SimpleDemoResponseZodSchema = z.object({
    success: z.boolean().describe("The Success of the Response"),
    message: z.string().describe("The Message of the Response"),
}).describe("The Simple Demo Response Object");
type SimpleDemoResponse = z.infer<typeof SimpleDemoResponseZodSchema>;
registerTypeSchema('SimpleDemoResponse', SimpleDemoResponseZodSchema);

export async function HttpSimpleDemo(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const body = SimpleDemoRequestZodSchema.safeParse(await request.json());

    if (body.success)
        return { status: 200, body: JSON.stringify({ success: true, message: JSON.stringify(body.data) } as SimpleDemoResponse) };
    else
        return { status: 400, body: JSON.stringify({ success: true, message: JSON.stringify(body.error) } as SimpleDemoResponse) };
};

registerFunction(
    'HttpSimpleDemo', {
    handler: HttpSimpleDemo,
    authLevel: 'anonymous',
    routePrefix: 'api',
    route: {
        method: 'post',
        path: 'hello',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: SimpleDemoRequestZodSchema,
                    },
                },
                description: 'Object contains the request parameters.',
                required: true
            }
        },
        responses: {
            200: {
                description: 'Success',
                content: {
                    'application/json': {
                        schema: SimpleDemoResponseZodSchema,
                    }
                }
            },
            400: {
                description: 'Bad Request',
                content: {
                    'application/json': {
                        schema: SimpleDemoResponseZodSchema
                    }
                }
            }
        }
    }
})