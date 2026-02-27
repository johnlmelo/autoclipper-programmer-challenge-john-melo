import { z } from "zod";
import { uploadAsset } from "../services/assets.service.js";
const uploadAssetSchema = z.object({
    fileName: z.string().trim().min(1),
    contentType: z.string().trim().min(1),
    dataBase64: z.string().trim().min(1)
});
export const postAssetUploadController = async (request, response, next) => {
    try {
        const payload = uploadAssetSchema.parse(request.body);
        const result = await uploadAsset(payload);
        response.status(201).json(result);
    }
    catch (error) {
        next(error);
    }
};
