import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบไฟล์สลิป",
        },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP",
        },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "ไฟล์ต้องมีขนาดไม่เกิน 5MB",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "slips");

    await mkdir(uploadDir, {
      recursive: true,
    });

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `slip-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extension}`;

    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/slips/${fileName}`;

    return NextResponse.json({
      success: true,
      message: "อัปโหลดสลิปสำเร็จ",
      url: publicUrl,
    });
  } catch (error) {
    console.error("UPLOAD SLIP ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถอัปโหลดสลิปได้",
      },
      { status: 500 }
    );
  }
}