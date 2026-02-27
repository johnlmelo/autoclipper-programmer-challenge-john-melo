import { Router } from "express";
import { postAssetUploadController } from "../controllers/assets.controller.js";
export const assetsRouter = Router();
assetsRouter.post("/assets/upload", postAssetUploadController);
