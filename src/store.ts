import type { CreateTodoInput, ListOptions, Todo } from "./types";

export class TodoStore {
  private todos: Map<number, Todo> = new Map();
  private nextId = 1;

  create(input: CreateTodoInput): Todo {
    const todo: Todo = {
      id: this.nextId++,
      title: input.title,
      completed: input.completed ?? false,
      createdAt: Date.now(),
    };
    this.todos.set(todo.id, todo);
    return todo;
  }

  get(id: number): Todo | undefined {
    return this.todos.get(id);
  }

  delete(id: number): boolean {
    return this.todos.delete(id);
  }

  list(opts: ListOptions): { items: Todo[]; total: number } {
    const all = Array.from(this.todos.values()).sort(
      (a, b) => a.createdAt - b.createdAt
    );
    const start = opts.page * opts.limit;
    const end = start + opts.limit;
    return { items: all.slice(start, end), total: all.length };
  }

  clear(): void {
    this.todos.clear();
    this.nextId = 1;
  }
}
