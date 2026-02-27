import "dotenv/config";
import { app } from "./app.js";
import { initializeDatabase } from "./lib/db.js";

const getPort = (): number => {
  const rawPort = process.env.PORT ?? "4000";
  const parsedPort = Number(rawPort);

  if (Number.isNaN(parsedPort)) {
    throw new Error("PORT must be a valid number");
  }

  return parsedPort;
};

const start = async (): Promise<void> => {
  await initializeDatabase();

  const port = getPort();

  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
};

start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  console.error(message);
  process.exit(1);
});
