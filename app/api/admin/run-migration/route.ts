import { NextResponse } from "next/server";
import { exec } from "child_process";

export const dynamic = 'force-dynamic';

export async function GET() {
  return new Promise((resolve) => {
    exec("node migrate-to-telegram.js", { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        resolve(NextResponse.json({ success: false, error: error.message, stdout, stderr }));
        return;
      }
      resolve(NextResponse.json({ success: true, stdout }));
    });
  });
}
