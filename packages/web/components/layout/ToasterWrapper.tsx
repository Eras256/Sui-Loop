"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterWrapper() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "rgba(0, 0, 0, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#fff",
          backdropFilter: "blur(10px)",
          borderRadius: "12px",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "14px",
        },
        success: {
          iconTheme: {
            primary: "#00f3ff",
            secondary: "#000",
          },
          style: {
            border: "1px solid rgba(0, 243, 255, 0.3)",
            boxShadow: "0 0 20px rgba(0, 243, 255, 0.1)",
          },
        },
        error: {
          iconTheme: {
            primary: "#ff3366",
            secondary: "#fff",
          },
          style: {
            border: "1px solid rgba(255, 51, 102, 0.3)",
            boxShadow: "0 0 20px rgba(255, 51, 102, 0.1)",
          },
        },
      }}
    />
  );
}
