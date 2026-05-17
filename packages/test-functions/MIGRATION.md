# Test Functions — Migration Notes (v1.x → v2.x)

This document records the sample-specific migration applied when moving from
`@apvee/azure-functions-openapi` v1.x to v2.x. For the full library
migration guide, see
[`packages/azure-functions-openapi/README.md`](../azure-functions-openapi/README.md#migration-guide-v1x--v2x).

## TL;DR

- `convertHttpRequestParamsToObject(...)` ➜ `parseRouteParams(request.params, schema)`
- `convertURLSearchParamsToObject(...)` ➜ `parseQueryParams(request.query, schema)`
- Validation now throws `ValidationError` instead of returning `safeParse` results.
- Many handlers can be simplified further by using the new `typedHandler` form
  on `app.openAPIPath` / `app.openAPIWebhook`, which moves validation into the
  framework and exposes already-typed `params`, `query`, `body`, `headers`.

## Available validation helpers (v2.x)

All helpers throw `ValidationError` (with `.zodError` set for Zod failures).

| Helper                 | Use case                                  |
| ---------------------- | ----------------------------------------- |
| `parseRouteParams`     | Validate `request.params` against a Zod schema |
| `parseQueryParams`     | Validate `request.query` against a Zod schema |
| `parseBody`            | Validate JSON body (accepts `*+json` MIME types) |
| `parseHeaders`         | Validate request headers                  |
| `createTypedHandler`   | Wrap a handler with automatic validation  |

## Before / After

### Manual validation with the v1.x helpers

```typescript
import { convertHttpRequestParamsToObject } from '@apvee/azure-functions-openapi';

export async function MyFunction(request: HttpRequest): Promise<HttpResponseInit> {
    const params = ParamsSchema.safeParse(convertHttpRequestParamsToObject(request.params));
    if (!params.success) {
        return { status: 400, jsonBody: { code: 400, message: params.error.message } };
    }
    return { status: 200, jsonBody: await service.doSomething(params.data.id) };
}
```

### Manual validation with the v2.x helpers

```typescript
import { parseRouteParams, ValidationError } from '@apvee/azure-functions-openapi';

export async function MyFunction(request: HttpRequest): Promise<HttpResponseInit> {
    try {
        const params = parseRouteParams(request.params, ParamsSchema);
        return { status: 200, jsonBody: await service.doSomething(params.id) };
    } catch (error) {
        if (error instanceof ValidationError) {
            return { status: 400, jsonBody: { code: 400, message: error.message } };
        }
        throw error;
    }
}
```

### Preferred v2.x form — `typedHandler`

```typescript
app.openAPIPath('GetSingleTodo', 'Get Single Todo', {
    typedHandler: async ({ params, context }) => {
        // params.id is already validated and strongly typed
        const todo = await TodoService.getById(params.id);
        return { status: 200, jsonBody: todo };
    },
    methods: ['GET'],
    route: 'todos/{id}',
    params: TodoParamIDSchema,
    responses: [
        { httpCode: 200, schema: TodoSchema },
        { httpCode: 404, schema: ErrorResponseSchema },
    ],
});
```

## Files in this sample

| File                            | Pattern used in v2.x                                       |
| ------------------------------- | ---------------------------------------------------------- |
| `functions/AddTodo.ts`          | `typedHandler` (body)                                      |
| `functions/UpdateTodo.ts`       | `typedHandler` (params + body) with structured 404 mapping |
| `functions/AcceptTodo.ts`       | `typedHandler` (params) returning 204                      |
| `functions/TodoCreatedWebhook.ts` | `app.openAPIWebhook` with `typedHandler`                 |
| `functions/GetSingleTodo.ts`    | Manual `parseRouteParams` + `ValidationError`              |
| `functions/GetAllTodos.ts`      | Manual `parseQueryParams` with custom response headers     |
| `functions/ExportTodos.ts`      | Manual `parseQueryParams` + multi content-type response    |
| `functions/DeleteTodo.ts`       | Manual `parseRouteParams` + 204                            |
