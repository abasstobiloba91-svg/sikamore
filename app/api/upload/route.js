import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // 1. EXTRACT EXACTLY 32 CHARACTERS FOR ACCOUNT ID (Ignores accidental URLs or spaces)
    const rawAccountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
    let accountId = rawAccountId.replace(/[^a-zA-Z0-9]/g, ""); // Strip all non-alphanumerics
    const idMatch = rawAccountId.match(/([a-fA-F0-9]{32})/);
    if (idMatch) {
      accountId = idMatch[1]; 
    }

    // 2. RUTHLESSLY STRIP HIDDEN SPACES/NEWLINES FROM KEYS
    const accessKey = (process.env.CLOUDFLARE_ACCESS_KEY_ID || "").replace(/\s+/g, "");
    const secretKey = (process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "").replace(/\s+/g, "");

    if (!accountId || !accessKey || !secretKey) {
      throw new Error("Credentials missing from Vercel entirely.");
    }

    // 3. INITIALIZE S3 CLIENT WITH BULLETPROOF SETTINGS
    const s3Client = new S3Client({
      region: "us-east-1", // MUST be this to pass AWS strict pattern validation
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true, // Prevents AWS from breaking Cloudflare URLs
    });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 4. FORCE A 100% SAFE ALPHANUMERIC FILENAME
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileName = `${Date.now()}-${randomString}.jpg`;

    // 5. SEND TO CLOUDFLARE
    await s3Client.send(
      new PutObjectCommand({
        Bucket: "ssikamore-assets", // Hardcoded to prevent environment variable typos
        Key: fileName,
        Body: buffer,
        ContentType: "image/jpeg", // Hardcoded to prevent weird file types from crashing AWS
      })
    );

    // 6. CLEAN UP THE PUBLIC URL
    const publicUrlBase = (process.env.CLOUDFLARE_PUBLIC_URL || "").trim().replace(/\/$/, "");
    const finalUrl = `${publicUrlBase}/${fileName}`;

    return NextResponse.json({ url: finalUrl });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
