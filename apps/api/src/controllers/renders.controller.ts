import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { createRender, findRenderById } from "../services/render.service.js";

const createRenderSchema = z.object({
  composition: z.record(z.unknown())
});

const renderParamsSchema = z.object({
  id: z.string().uuid()
});

export const postRenderController = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsedBody = createRenderSchema.parse(request.body);
    const createdRender = await createRender(parsedBody.composition);

    response.status(201).json(createdRender);
  } catch (error) {
    next(error);
  }
};

export const getRenderController = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = renderParamsSchema.parse(request.params);
    const render = await findRenderById(id);

    response.status(200).json(render);
  } catch (error) {
    next(error);
  }
};
