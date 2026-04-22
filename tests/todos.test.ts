import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import { buildRouter } from "../src/router";
import { TodoStore } from "../src/store";

function buildApp() {
  const app = express();
  const store = new TodoStore();
  app.use(buildRouter(store));
  return { app, store };
}

describe("POST /todos", () => {
  it("creates a todo and returns 201", async () => {
    const { app } = buildApp();
    const r = await request(app).post("/todos").send({ title: "buy milk" });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ title: "buy milk", completed: false });
    expect(typeof r.body.id).toBe("number");
  });

  it("rejects empty title with 400", async () => {
    const { app } = buildApp();
    const r = await request(app).post("/todos").send({ title: "" });
    expect(r.status).toBe(400);
  });

  it("rejects whitespace-only title with 400", async () => {
    const { app } = buildApp();
    const r = await request(app).post("/todos").send({ title: "   " });
    expect(r.status).toBe(400);
  });

  it("rejects missing title with 400", async () => {
    const { app } = buildApp();
    const r = await request(app).post("/todos").send({});
    expect(r.status).toBe(400);
  });
});

describe("GET /todos/:id", () => {
  it("returns 404 for unknown id", async () => {
    const { app } = buildApp();
    const r = await request(app).get("/todos/9999");
    expect(r.status).toBe(404);
  });

  it("returns the todo for a known id", async () => {
    const { app } = buildApp();
    const create = await request(app)
      .post("/todos")
      .send({ title: "x" });
    const r = await request(app).get(`/todos/${create.body.id}`);
    expect(r.status).toBe(200);
    expect(r.body.title).toBe("x");
  });
});

describe("DELETE /todos/:id", () => {
  it("returns 204 on successful delete", async () => {
    const { app } = buildApp();
    const create = await request(app)
      .post("/todos")
      .send({ title: "x" });
    const r = await request(app).delete(`/todos/${create.body.id}`);
    expect(r.status).toBe(204);
    expect(r.body).toEqual({});
  });

  it("returns 404 when deleting unknown id", async () => {
    const { app } = buildApp();
    const r = await request(app).delete("/todos/9999");
    expect(r.status).toBe(404);
  });
});

describe("PATCH /todos/:id", () => {
  it("updates only the title and returns 200", async () => {
    const { app } = buildApp();
    const create = await request(app).post("/todos").send({ title: "old" });
    const r = await request(app)
      .patch(`/todos/${create.body.id}`)
      .send({ title: "new" });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      id: create.body.id,
      title: "new",
      completed: false,
    });
  });

  it("updates only completed and returns 200", async () => {
    const { app } = buildApp();
    const create = await request(app).post("/todos").send({ title: "x" });
    const r = await request(app)
      .patch(`/todos/${create.body.id}`)
      .send({ completed: true });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      id: create.body.id,
      title: "x",
      completed: true,
    });
  });

  it("updates both title and completed and returns 200", async () => {
    const { app } = buildApp();
    const create = await request(app).post("/todos").send({ title: "x" });
    const r = await request(app)
      .patch(`/todos/${create.body.id}`)
      .send({ title: "y", completed: true });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ title: "y", completed: true });
  });

  it("returns 404 for unknown id", async () => {
    const { app } = buildApp();
    const r = await request(app).patch("/todos/9999").send({ title: "x" });
    expect(r.status).toBe(404);
  });

  it("returns 400 for empty-string title", async () => {
    const { app } = buildApp();
    const create = await request(app).post("/todos").send({ title: "x" });
    const r = await request(app)
      .patch(`/todos/${create.body.id}`)
      .send({ title: "" });
    expect(r.status).toBe(400);
  });

  it("returns 400 for whitespace-only title", async () => {
    const { app } = buildApp();
    const create = await request(app).post("/todos").send({ title: "x" });
    const r = await request(app)
      .patch(`/todos/${create.body.id}`)
      .send({ title: "   " });
    expect(r.status).toBe(400);
  });

  it("returns 400 for non-boolean completed", async () => {
    const { app } = buildApp();
    const create = await request(app).post("/todos").send({ title: "x" });
    const r = await request(app)
      .patch(`/todos/${create.body.id}`)
      .send({ completed: "yes" });
    expect(r.status).toBe(400);
  });

  it("returns 400 for empty patch body", async () => {
    const { app } = buildApp();
    const create = await request(app).post("/todos").send({ title: "x" });
    const r = await request(app).patch(`/todos/${create.body.id}`).send({});
    expect(r.status).toBe(400);
  });

  it("ignores unknown fields and updates only title/completed", async () => {
    const { app } = buildApp();
    const create = await request(app).post("/todos").send({ title: "x" });
    const r = await request(app)
      .patch(`/todos/${create.body.id}`)
      .send({ title: "y", foo: "bar" });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ title: "y", completed: false });
    expect(r.body.foo).toBeUndefined();
  });
});

describe("GET /todos (pagination)", () => {
  async function seed(app: express.Express, n: number) {
    for (let i = 1; i <= n; i++) {
      await request(app).post("/todos").send({ title: `t${i}` });
    }
  }

  it("page 1 returns first N items", async () => {
    const { app } = buildApp();
    await seed(app, 25);
    const r = await request(app).get("/todos?page=1&limit=10");
    expect(r.status).toBe(200);
    expect(r.body.items).toHaveLength(10);
    expect(r.body.items[0].title).toBe("t1");
    expect(r.body.items[9].title).toBe("t10");
    expect(r.body.total).toBe(25);
  });

  it("page 2 returns next N items", async () => {
    const { app } = buildApp();
    await seed(app, 25);
    const r = await request(app).get("/todos?page=2&limit=10");
    expect(r.body.items[0].title).toBe("t11");
    expect(r.body.items).toHaveLength(10);
  });

  it("page beyond end returns empty items", async () => {
    const { app } = buildApp();
    await seed(app, 5);
    const r = await request(app).get("/todos?page=99&limit=10");
    expect(r.body.items).toEqual([]);
    expect(r.body.total).toBe(5);
  });
});
