import { NextResponse } from "next/server";
import { authController } from "@/lib/controllers/authController";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // เรียกใช้ Logic จาก Controller (แยกโครงสร้างชัดเจน)
    const newUser = await authController.registerUser(name, email, password);

    // ตอบกลับเป็น JSON แจ้งผลลัพธ์สำเร็จ
    return NextResponse.json({
      success: true,
      message: "สมัครสมาชิกสำเร็จ",
      user: newUser
    }, { status: 201 });

  } catch (error: any) {
    // ดักจับ Error ที่มาจาก Controller แล้วตอบกลับเป็น JSON พร้อม Status 400
    return NextResponse.json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก"
    }, { status: 400 });
  }
}
