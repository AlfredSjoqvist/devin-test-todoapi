# devin-test-todoapi

A tiny TypeScript/Express HTTP API backing a todo list. In-memory store, no
persistence, suitable for demos.

## Install

```bash
npm install
```

## Run

```bash
npm start                 # compiles and starts the server on :3000
npm run dev               # tsx watch-mode
```

## Test

```bash
npm test
```

## Endpoints

- `POST   /todos`                       create a todo
- `GET    /todos?page=<n>&limit=<m>`    list todos, paginated
- `GET    /todos/:id`                   fetch a single todo
- `DELETE /todos/:id`                   delete a todo

Request / response shapes are documented in
[`docs/API.md`](docs/API.md).

## Status

CI is currently red — the TypeScript build fails and several tests fail. See
the test output for details.
