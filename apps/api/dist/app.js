import express from "express";
import { rendersRouter } from "./routes/renders.routes.js";
import { errorHandlerMiddleware, notFoundMiddleware } from "./middlewares/error.middleware.js";
export const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(rendersRouter);
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);
