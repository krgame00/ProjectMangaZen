"use client";

import dynamic from "next/dynamic";

const ReaderUI = dynamic(() => import("./ReaderUI"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "var(--text2)", background: "var(--bg)" }}>
      กำลังโหลดหน้าอ่านมังงะ...
    </div>
  )
});

export default function ReaderUIClient(props: any) {
  return <ReaderUI {...props} />;
}
