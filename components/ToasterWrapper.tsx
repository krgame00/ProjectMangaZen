"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterWrapper() {
  return (
    <Toaster 
      position="bottom-right" 
      toastOptions={{
        style: {
          background: "var(--surface)",
          color: "var(--fg)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(12px)",
        },
        success: {
          iconTheme: {
            primary: "var(--accent)",
            secondary: "var(--surface)",
          },
        },
      }}
    />
  );
}
