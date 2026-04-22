import express, { Request, Response, Router } from "express";
import { TodoStore } from "./store";
import type { CreateTodoInput } from "./types";

export function buildRouter(store: TodoStore): Router {
  const router = Router();
  router.use(express.json());

  router.post("/todos", (req: Request, res: Response) => {
    const body = req.body as Partial<CreateTodoInput>;
    const todo = store.create({
      title: body.title ?? "",
      completed: body.completed,
    });
    res.status(201).json(todo);
  });

  router.get("/todos", (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    if (!Number.isFinite(page) || page < 1) {
      res.status(400).json({ error: "page must be >= 1" });
      return;
    }
    if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
      res.status(400).json({ error: "limit must be between 1 and 100" });
      return;
    }
    const result = store.list({ page, limit });
    res.json(result);
  });

  router.get("/todos/:id", (req: Request, res: Response) => {
    const id: number = req.params.id;
    const todo = store.get(id);
    if (!todo) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(todo);
  });

  router.delete("/todos/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ok = store.delete(id);
    if (!ok) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.status(200).end();
  });

  return router;
}
