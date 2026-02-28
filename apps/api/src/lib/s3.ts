import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.MINIO_ENDPOINT;
const port = process.env.MINIO_PORT;
const accessKeyId = process.env.MINIO_ACCESS_KEY;
const secretAccessKey = process.env.MINIO_SECRET_KEY;
const bucketName = process.env.MINIO_BUCKET;

const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT ?? "localhost";
const publicPort = process.env.MINIO_PUBLIC_PORT ?? port;

export const s3Client = endpoint && port && accessKeyId && secretAccessKey
  ? new S3Client({
      region: "us-east-1",
      endpoint: `http://${endpoint}:${port}`,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    })
  : null;

const signerClient = publicPort && accessKeyId && secretAccessKey
  ? new S3Client({
      region: "us-east-1",
      endpoint: `http://${publicEndpoint}:${publicPort}`,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    })
  : null;

const toBucketAndKey = (urlOrPath: string): { bucket: string; key: string } | null => {
  if (!bucketName) {
    return null;
  }

  if (urlOrPath.startsWith("/renders/")) {
    const fileName = urlOrPath.slice("/renders/".length);
    if (!fileName) {
      return null;
    }

    return {
      bucket: bucketName,
      key: `renders/${fileName}`
    };
  }

  try {
    const parsed = new URL(urlOrPath);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      return null;
    }

    return {
      bucket: parts[0],
      key: parts.slice(1).join("/")
    };
  } catch {
    return null;
  }
};

export const getSignedObjectUrl = async (urlOrPath: string): Promise<string> => {
  if (!signerClient) {
    return urlOrPath;
  }

  const bucketAndKey = toBucketAndKey(urlOrPath);
  if (!bucketAndKey) {
    return urlOrPath;
  }

  return getSignedUrl(
    signerClient,
    new GetObjectCommand({
      Bucket: bucketAndKey.bucket,
      Key: bucketAndKey.key
    }),
    {
      expiresIn: 3600
    }
  );
};
