import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import fs from "fs"

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!
  },
  forcePathStyle: true
})

export async function uploadFile(key: string, filePath: string) {
  const fileStream = fs.createReadStream(filePath)

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET!,
      Key: key,
      Body: fileStream,
      ContentType: "video/mp4"
    })
  )

  return `http://localhost:9000/${process.env.MINIO_BUCKET}/${key}`
}