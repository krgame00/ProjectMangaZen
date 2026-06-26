import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isAuth = !!req.nextauth.token;
    const isAdmin = req.nextauth.token?.role === "admin";
    const isAccessingAdmin = req.nextUrl.pathname.startsWith("/admin");

    if (isAccessingAdmin && !isAdmin) {
      // ถ้าพยายามเข้า /admin แต่ไม่ใช่ admin ให้เด้งไปหน้าแรก
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

// กำหนดว่า Path ไหนบ้างที่ต้องการการล็อกอิน
export const config = {
  matcher: [
    "/profile/:path*",
    "/admin/:path*",
  ],
};
