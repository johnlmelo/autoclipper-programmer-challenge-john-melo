import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { createRender, findRenderById } from "../services/render.service.js";

const timedElementSchema = z.object({
  startInSeconds: z.number().finite().min(0),
  endInSeconds: z.number().finite().min(0)
});

const textElementSchema = timedElementSchema.extend({
  type: z.literal("text"),
  content: z.string().trim().min(1),
  style: z.object({
    fontSize: z.number().finite().positive(),
    color: z.string().trim().min(1),
    x: z.number().finite(),
    y: z.number().finite()
  }).catchall(z.unknown())
});

const imageElementSchema = timedElementSchema.extend({
  type: z.literal("image"),
  assetId: z.string().trim().min(1),
  sourceUrl: z.string().url(),
  label: z.string().trim().min(1),
  style: z.object({
    x: z.number().finite(),
    y: z.number().finite()
  }).catchall(z.unknown())
});

const audioElementSchema = timedElementSchema.extend({
  type: z.literal("audio"),
  assetId: z.string().trim().min(1),
  sourceUrl: z.string().url(),
  label: z.string().trim().min(1),
  style: z.object({
    volume: z.number().finite()
  }).catchall(z.unknown())
});

const solidElementSchema = timedElementSchema.extend({
  type: z.literal("solid"),
  color: z.string().trim().min(1)
});

const elementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  imageElementSchema,
  audioElementSchema,
  solidElementSchema
]).superRefine((element, context) => {
  if (element.endInSeconds <= element.startInSeconds) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "endInSeconds must be greater than startInSeconds",
      path: ["endInSeconds"]
    });
  }
});

const createRenderSchema = z.object({
  durationInSeconds: z.number().finite().positive(),
  fps: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  elements: z.array(elementSchema).min(1),
  projectId: z.string().trim().min(1).optional(),
  projectName: z.string().trim().min(1).optional(),
  renderMode: z.string().trim().min(1).optional()
}).superRefine((composition, context) => {
  for (const [index, element] of composition.elements.entries()) {
    if (element.endInSeconds > composition.durationInSeconds) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endInSeconds cannot exceed durationInSeconds",
        path: ["elements", index, "endInSeconds"]
      });
    }
  }
});

const renderParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export const postRenderController = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsedBody = createRenderSchema.parse(request.body);
    const createdRender = await createRender(parsedBody);

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
