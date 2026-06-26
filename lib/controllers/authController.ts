import { prisma } from "../prisma";
import bcrypt from "bcryptjs";

export const authController = {
  // ฟังก์ชันสำหรับการลงทะเบียนผู้ใช้ใหม่
  async registerUser(name: string, email: string, password: string) {
    // 1. Validation (ตรวจสอบความถูกต้องเบื้องต้น)
    if (!name || !email || !password) {
      throw new Error("กรุณากรอกข้อมูลให้ครบถ้วน (Name, Email, Password)");
    }
    
    if (password.length < 6) {
      throw new Error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
    }

    // 2. Check duplicate email (ตรวจสอบอีเมลซ้ำ)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น");
    }

    // 3. Hash password (เข้ารหัสผ่านด้วย bcryptjs)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Save to Database (บันทึกลงฐานข้อมูล)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // คืนค่าข้อมูลผู้ใช้กลับไป (ไม่ต้องส่ง password กลับไปเพื่อความปลอดภัย)
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };
  }
};
