export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface CreateTodoInput {
  title: string;
  completed?: boolean;
}

export interface ListOptions {
  page: number;
  limit: number;
}
