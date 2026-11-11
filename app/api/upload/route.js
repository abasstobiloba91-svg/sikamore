import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // 1. AGGRESSIVE CREDENTIAL EXTRACTION
    // If the full URL was accidentally pasted into Vercel, this forces it to extract ONLY the 32-character ID.
    let rawAccountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
    let accountId = rawAccountId.trim();
    const idMatch = rawAccountId.match(/([a-fA-F0-9]{32})/);
    if (idMatch) {
      accountId = idMatch[1];
    }

    const accessKey = (process.env.CLOUDFLARE_ACCESS_KEY_ID || "").trim();
    const secretKey = (process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "").trim();

    if (!accountId || !accessKey || !secretKey) {
      throw new Error("Credentials missing from Vercel completely.");
    }

    // 2. INITIALIZE CLIENT
    const s3Client = new S3Client({
      region: "auto", // Cloudflare strictly uses 'auto'
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    // 3. PROCESS FILE
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Force a safe filename
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileName = `${Date.now()}-${randomString}.png`;

    // 4. SEND TO CLOUDFLARE
    await s3Client.send(
      new PutObjectCommand({
        Bucket: "ssikamore-assets", // Hardcoded safely
        Key: fileName,
        Body: buffer,
        ContentType: file.type || "image/png",
      })
    );

    // 5. GENERATE PUBLIC URL
    const publicUrlBase = (process.env.CLOUDFLARE_PUBLIC_URL || "").trim().replace(/\/$/, "");
    const finalUrl = `${publicUrlBase}/${fileName}`;

    return NextResponse.json({ url: finalUrl });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
