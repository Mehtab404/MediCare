import { existsSync } from "node:fs";
import path from "node:path";
import express, { type NextFunction, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";
import { config } from "./config.ts";
import { pool } from "./db.ts";
import { migrate } from "./migrate.ts";
import { seedDoctorsIfEmpty } from "./seed.ts";
import { HttpError } from "./lib/http.ts";
import { authRouter } from "./routes/auth.ts";
import { doctorsRouter } from "./routes/doctors.ts";
import { appointmentsRouter } from "./routes/appointments.ts";

const app = express();

// Render (and most hosts) put the app behind one proxy. Needed for secure cookies and rate limiting by IP.
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

app.get("/api/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true });
});
app.use("/api/auth", authRouter);
app.use("/api/doctors", doctorsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api", (_req, _res) => {
  throw new HttpError(404, "Not found.");
});

// In production, serve the built frontend and let react-router handle unknown paths.
const distDir = path.resolve(import.meta.dirname, "..", "dist");
if (existsSync(distDir)) {
  app.use(express.static(distDir, { index: false, maxAge: "1h" }));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: err.issues[0]?.message ?? "Invalid request." });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Request body must be valid JSON." });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

async function start() {
  await migrate();
  await seedDoctorsIfEmpty();
  app.listen(config.port, (err?: Error) => {
    if (err) {
      console.error(`Could not listen on port ${config.port}:`, err.message);
      process.exit(1);
    }
    console.log(`MediCare API listening on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
