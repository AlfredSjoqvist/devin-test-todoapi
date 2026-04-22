import express, { Request, Response, Router } from "express";
import { TodoStore } from "./store";
import type { CreateTodoInput, UpdateTodoInput } from "./types";

function isValidTitle(title: unknown): title is string {
  return typeof title === "string" && title.trim().length > 0;
}

export function buildRouter(store: TodoStore): Router {
  const router = Router();
  router.use(express.json());

  router.post("/todos", (req: Request, res: Response) => {
    const body = (req.body ?? {}) as Partial<CreateTodoInput>;
    if (!isValidTitle(body.title)) {
      res.status(400).json({ error: "title must be a non-empty string" });
      return;
    }
    if (body.completed !== undefined && typeof body.completed !== "boolean") {
      res.status(400).json({ error: "completed must be a boolean" });
      return;
    }
    const todo = store.create({
      title: body.title,
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
    const id = Number(req.params.id);
    const todo = store.get(id);
    if (!todo) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(todo);
  });

  router.patch("/todos/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "id must be an integer" });
      return;
    }
    const body = (req.body ?? {}) as Partial<UpdateTodoInput>;
    const patch: UpdateTodoInput = {};

    if (body.title !== undefined) {
      if (!isValidTitle(body.title)) {
        res.status(400).json({ error: "title must be a non-empty string" });
        return;
      }
      patch.title = body.title;
    }

    if (body.completed !== undefined) {
      if (typeof body.completed !== "boolean") {
        res.status(400).json({ error: "completed must be a boolean" });
        return;
      }
      patch.completed = body.completed;
    }

    if (patch.title === undefined && patch.completed === undefined) {
      res.status(400).json({ error: "at least one of title or completed must be provided" });
      return;
    }

    const updated = store.update(id, patch);
    if (!updated) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.status(200).json(updated);
  });

  router.delete("/todos/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ok = store.delete(id);
    if (!ok) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.status(204).end();
  });

  return router;
}
