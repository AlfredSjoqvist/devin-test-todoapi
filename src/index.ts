import express from "express";
import { buildRouter } from "./router";
import { TodoStore } from "./store";

const port = Number(process.env.PORT ?? 3000);
const app = express();
const store = new TodoStore();

app.use(buildRouter(store));

if (require.main === module) {
  app.listen(port, () => {
    console.log(`todoapi listening on :${port}`);
  });
}

export { app, store };
