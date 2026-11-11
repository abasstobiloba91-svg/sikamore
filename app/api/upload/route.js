import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const ACCOUNT_ID = "2d263036d773648a9cded2ab78408d4a";
    const ACCESS_KEY = "42b8b60ec9df919fa090984eb5c0ef64";
    const SECRET_KEY = "05af4da3eb7131fbc05fe0a51806a472646a36eae2b22129b4babaa1d58e584b";
    const PUBLIC_URL = "https://pub-3de2bdb34f894d6b9ddcb8b4ddb42ad5.r2.dev";
    const BUCKET_NAME = "ssikamore-assets"; 

    const s3Client = new S3Client({
      region: "us-east-1", 
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
      },
      forcePathStyle: true, 
    });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileName = `item-${Date.now()}-${randomString}.jpg`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: "image/jpeg", 
      })
    );

    const finalUrl = `${PUBLIC_URL.replace(/\/$/, "")}/${fileName}`;

    return NextResponse.json({ url: finalUrl });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: `AWS SDK Error: ${error.message}` }, { status: 500 });
  }
}
