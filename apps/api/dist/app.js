import express from "express";
import { assetsRouter } from "./routes/assets.routes.js";
import { rendersRouter } from "./routes/renders.routes.js";
import { errorHandlerMiddleware, notFoundMiddleware } from "./middlewares/error.middleware.js";
export const app = express();
app.use((request, response, next) => {
    response.header("Access-Control-Allow-Origin", process.env.CORS_ORIGIN ?? "*");
    response.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    if (request.method === "OPTIONS") {
        response.status(204).end();
        return;
    }
    next();
});
app.use(express.json({ limit: "50mb" }));
app.use("/renders", express.static("/tmp/renders"));
app.use(assetsRouter);
app.use(rendersRouter);
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);
