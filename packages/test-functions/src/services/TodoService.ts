import { randTextRange, randUuid } from '@ngneat/falso';
import { NewTodo, Todo, UpdateTodo } from '../models/todo';

/**
 * In-memory Todo "service" used by the sample. Kept small on purpose:
 * the goal is to exercise the OpenAPI library, not to demonstrate
 * a production-grade persistence layer.
 */
const SEED_TODOS: Todo[] = [
    'a11d5114-f15d-458b-979d-d5efebb70fe0',
    '5a993fb8-5d4b-4735-8233-bbdab629048c',
    'fa385b12-b7ac-42a2-a24b-552408fe2786',
    'ed5197ec-3fe8-4f0c-ab8f-f5493632d386',
    'fa1f3837-1f85-4063-b768-69468076df0f',
    '7f96e799-9e2b-4210-9de0-e8cdef4518e5',
    '432c61da-74da-4c23-8987-8a1bb5f2df04',
    'f8b6c551-afb9-4b5f-ae57-cd11875655ef',
    '47dc4261-95fa-4b4a-8c20-360fd4aaa8f8',
    '992f0d65-9069-44f5-b225-2bba5b2dd894',
].map((id, i) => ({
    id,
    title: randTextRange({ min: 10, max: 20 }),
    description: randTextRange({ min: 100, max: 200 }),
    isDone: i % 3 !== 0,
}));

/**
 * Error raised when a Todo cannot be located by id. Function handlers map
 * this to a `404 Not Found` response, which is the semantically correct
 * status code for "resource lookup failed".
 */
export class TodoNotFoundError extends Error {
    public readonly code = 'TODO_NOT_FOUND';
    constructor(public readonly id: string) {
        super(`Todo with id '${id}' was not found`);
        this.name = 'TodoNotFoundError';
    }
}

export const TodoService = {
    addTodo: async (todo: NewTodo): Promise<Todo> => {
        return {
            id: randUuid(),
            ...todo,
            isDone: false,
        };
    },

    updateTodo: async (id: string, todo: UpdateTodo): Promise<Todo> => {
        const todos = await TodoService.getTodoList();
        const existing = todos.find((t) => t.id === id);
        if (!existing) {
            throw new TodoNotFoundError(id);
        }
        return {
            ...existing,
            ...todo,
            id: existing.id,
        };
    },

    getTodoList: async (): Promise<Todo[]> => {
        return [...SEED_TODOS];
    },
};
