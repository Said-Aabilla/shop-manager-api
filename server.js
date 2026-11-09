const path = require("path");
const express = require("express");
const cors = require("cors");
const { createStore } = require("./src/store");
const { HttpError, sendError } = require("./src/errors");
const { categoryRoutes } = require("./src/routes/categories");
const { productRoutes } = require("./src/routes/products");
const { reservationRoutes } = require("./src/routes/reservations");

const nodeMajor = Number(process.versions.node.split(".")[0]);

if (nodeMajor < 18) {
  console.error(`Node.js 18 or newer is required. This computer is running ${process.versions.node}.`);
  process.exit(1);
}

const HOST = "127.0.0.1";
const PORT = resolvePort(process.env.PORT);
const app = express();
const store = createStore();

app.disable("x-powered-by");
app.set("json spaces", 2);
app.set("query parser", "simple");

app.use(cors());
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use((req, res, next) => {
  res.on("finish", () => {
    if (req.originalUrl.startsWith("/api")) {
      console.log(`${res.statusCode} ${req.method} ${req.originalUrl}`);
    }
  });
  next();
});
app.use(express.json({ limit: "100kb" }));

app.get("/api", (req, res) => {
  res.json({
    name: "Shop practice API",
    message: "No login is required. Data resets when the server starts.",
    docs: `http://localhost:${PORT}/`,
    categories: "/api/categories",
    products: "/api/products",
    reservations: "/api/reservations",
    reset: "POST /api/reset",
  });
});

app.post("/api/reset", (req, res) => {
  store.reset();
  res.json({
    message: "Practice data has been reset to the original categories, products, and reservations.",
    categories: store.listCategories().length,
    products: store.listProducts({}).length,
    reservations: store.listReservations({}).length,
  });
});

app.use("/api/categories", categoryRoutes(store));
app.use("/api/products", productRoutes(store));
app.use("/api/reservations", reservationRoutes(store));

app.use(express.static(path.join(__dirname, "public")));

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.use((req, res) => {
  sendError(
    res,
    404,
    `Nothing is available at ${req.method} ${req.originalUrl}. Open http://localhost:${PORT}/ for the documentation.`
  );
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err.type === "entity.parse.failed" || (err instanceof SyntaxError && err.status === 400 && "body" in err)) {
    sendError(res, 400, "The request body is not valid JSON. Check commas, quotes, and brackets.");
    return;
  }

  if (err.type === "entity.too.large" || err.status === 413) {
    sendError(res, 413, "The request body is too large. Keep it under 100 KB.");
    return;
  }

  if (err instanceof HttpError) {
    sendError(res, err.status, err.message, err.details);
    return;
  }

  console.error(err);
  sendError(res, 500, "Something went wrong on the server. Restart it and try the request again.");
});

const server = app.listen(PORT, HOST, () => {
  console.log("");
  console.log("Shop practice API is running.");
  console.log(`Documentation  http://localhost:${PORT}`);
  console.log(`API            http://localhost:${PORT}/api`);
  console.log("Data is loaded again every time you start the server.");
  console.log("Press Ctrl+C to stop.");
  console.log("");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Close the other program, or start on another port: $env:PORT=3001; npm start`
    );
    process.exit(1);
  }

  console.error(err);
  process.exit(1);
});

function resolvePort(value) {
  if (value === undefined || value === "") return 3000;

  if (!/^\d+$/.test(String(value))) {
    console.error(`PORT must be a whole number. Received: ${value}`);
    process.exit(1);
  }

  const port = Number(value);

  if (port < 1 || port > 65535) {
    console.error(`PORT must be between 1 and 65535. Received: ${value}`);
    process.exit(1);
  }

  return port;
}
