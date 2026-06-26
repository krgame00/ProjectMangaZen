import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("กรุณากรอกอีเมลและรหัสผ่าน");
        }

        // 1. ค้นหาผู้ใช้จากฐานข้อมูล
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("ไม่พบผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        }

        // 2. ตรวจสอบความถูกต้องของรหัสผ่าน
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("รหัสผ่านไม่ถูกต้อง");
        }

        // 3. คืนค่าผู้ใช้ (จะถูกแปลงเป็น JWT)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: "jwt", // ใช้ JWT สำหรับ Session
    maxAge: 30 * 24 * 60 * 60, // 30 วัน
  },
  callbacks: {
    // นำข้อมูล role จาก User ใส่เข้า JWT Token
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "user";
      }

      // ตรวจสอบกรณีล็อกอินด้วย Google ว่ามีในฐานข้อมูลหรือไม่ (ถ้าไม่มีให้สร้าง)
      if (account?.provider === "google" && user?.email) {
        let dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              name: user.name || "Google User",
              email: user.email,
              role: "user",
              // สร้างบัญชีด้วย Google ไม่ต้องใช้ password
            }
          });
        }
        token.id = dbUser.id;
        token.role = dbUser.role;
      }

      return token;
    },
    // นำข้อมูลจาก JWT Token ไปใส่ใน Session ฝั่ง Client
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login", // ไปที่หน้า /login แทนหน้า Default ของ NextAuth
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
