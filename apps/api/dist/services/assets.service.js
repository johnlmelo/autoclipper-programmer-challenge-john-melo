import { CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { s3Client } from "../lib/s3.js";
import { AppError } from "./render.service.js";
const bucketName = process.env.MINIO_BUCKET;
const minioEndpoint = process.env.MINIO_ENDPOINT;
const minioPort = process.env.MINIO_PORT;
let bucketReady = false;
const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "_");
const ensureBucket = async () => {
    if (bucketReady) {
        return;
    }
    if (!s3Client || !bucketName) {
        throw new AppError("Storage is not configured", 500);
    }
    try {
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    }
    catch {
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
    }
    const publicReadPolicy = JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Sid: "AllowPublicReadObjects",
                Effect: "Allow",
                Principal: "*",
                Action: ["s3:GetObject"],
                Resource: [`arn:aws:s3:::${bucketName}/*`]
            }
        ]
    });
    await s3Client.send(new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: publicReadPolicy
    }));
    bucketReady = true;
};
export const uploadAsset = async ({ fileName, contentType, dataBase64 }) => {
    if (!s3Client || !bucketName || !minioEndpoint || !minioPort) {
        throw new AppError("Storage is not configured", 500);
    }
    await ensureBucket();
    const key = `assets/${uuidv4()}-${sanitizeFileName(fileName)}`;
    const body = Buffer.from(dataBase64, "base64");
    await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: contentType
    }));
    return {
        key,
        sourceUrl: `http://${minioEndpoint}:${minioPort}/${bucketName}/${key}`
    };
};
