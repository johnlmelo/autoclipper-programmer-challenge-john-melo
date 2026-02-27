import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
const getRequiredEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};
const minioEndpoint = getRequiredEnv("MINIO_ENDPOINT");
const minioPort = getRequiredEnv("MINIO_PORT");
const bucketName = getRequiredEnv("MINIO_BUCKET");
const s3 = new S3Client({
    region: "us-east-1",
    endpoint: `http://${minioEndpoint}:${minioPort}`,
    credentials: {
        accessKeyId: getRequiredEnv("MINIO_ACCESS_KEY"),
        secretAccessKey: getRequiredEnv("MINIO_SECRET_KEY")
    },
    forcePathStyle: true
});
export async function uploadFile(key, filePath) {
    const fileStream = fs.createReadStream(filePath);
    await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileStream,
        ContentType: "video/mp4"
    }));
    return `http://localhost:9000/${bucketName}/${key}`;
}
export const toSignedMinioUrl = async (originalUrl) => {
    let key = "";
    try {
        const parsed = new URL(originalUrl);
        const normalizedPath = parsed.pathname.replace(/^\/+/, "");
        const bucketPrefix = `${bucketName}/`;
        if (!normalizedPath.startsWith(bucketPrefix)) {
            return originalUrl;
        }
        key = normalizedPath.slice(bucketPrefix.length);
    }
    catch {
        return originalUrl;
    }
    if (!key) {
        return originalUrl;
    }
    return getSignedUrl(s3, new GetObjectCommand({
        Bucket: bucketName,
        Key: key
    }), {
        expiresIn: 3600
    });
};
