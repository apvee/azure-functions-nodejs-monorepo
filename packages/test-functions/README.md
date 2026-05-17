# Test Functions — Sample app

This package is the **runnable sample** for `@apvee/azure-functions-openapi` v2.x.
It is **not published to npm**. The package exists to:

- demonstrate the library's public API end-to-end (`openAPISetup`, `openAPIPath`,
  `openAPIWebhook`, `openAPISchema`, `openAPIAzureFunctionKey`),
- exercise the OpenAPI document generation against a realistic CRUD-style API,
- give contributors a fast feedback loop when changing the library.

## Quickstart

Prerequisites: Node.js ≥ 18, [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local).

From the repository root:

```bash
npm install
npm --workspace test-functions run build
npm --workspace test-functions start
```

The first request after `start` will trigger Azure Functions to load the
generated bundle. Useful URLs once the host is running on the default port:

| URL                                                       | Description                          |
| --------------------------------------------------------- | ------------------------------------ |
| `http://localhost:7071/api/openapi-3.1.0.json`            | OpenAPI 3.1.0 JSON document          |
| `http://localhost:7071/api/openapi-3.0.3.json`            | OpenAPI 3.0.3 JSON document          |
| `http://localhost:7071/api/openapi-2.0.json`              | Swagger 2.0 JSON document            |
| `http://localhost:7071/api/openapi-3.1.0.yaml`            | OpenAPI 3.1.0 YAML document          |
| `http://localhost:7071/api/swagger-ui`                    | Interactive Swagger UI                |
| `http://localhost:7071/api/todos`                         | List Todos (`GET`) / create (`POST`)  |
| `http://localhost:7071/api/todos/{id}`                    | Get / update / delete a single Todo   |
| `http://localhost:7071/api/todos/export?accept=text/csv`  | Multi-content-type export demo        |
| `http://localhost:7071/api/webhooks/todo-created`         | Webhook documentation example         |

## Endpoints overview

| Function                      | Method(s)   | Highlights                                          |
| ----------------------------- | ----------- | --------------------------------------------------- |
| `AddTodo`                     | `POST`      | `typedHandler` with body validation                 |
| `UpdateTodo`                  | `PUT`/`PATCH` | Multi-method endpoint (operationId disambiguated)  |
| `AcceptTodo`                  | `POST`      | 204 No Content with `typedHandler`                  |
| `GetSingleTodo`               | `GET`       | Manual `parseRouteParams` usage                     |
| `GetAllTodos`                 | `GET`       | Pagination + custom response headers                |
| `ExportTodos`                 | `GET`       | Content negotiation (`application/json`/`text/csv`/`application/xml`) |
| `DeleteTodo`                  | `DELETE`    | 204 No Content                                      |
| `TodoCreatedWebhook`          | `POST`      | `app.openAPIWebhook` documentation                  |

## Authentication

The sample uses **Azure Function keys** by default. To call any endpoint
locally you do not need a key (the Core Tools accept anonymous requests for
`authLevel: 'function'`). When deployed to Azure, supply the key via the
`code` query parameter or the `x-functions-key` header.

## Migration

If you are coming from a v1.x sample, read [`MIGRATION.md`](./MIGRATION.md).
