import { Router } from "express";
import { getRenderController, postRenderController } from "../controllers/renders.controller.js";

export const rendersRouter = Router();

rendersRouter.post("/renders", postRenderController);
rendersRouter.get("/renders/:id", getRenderController);
