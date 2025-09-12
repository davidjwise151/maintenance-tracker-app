import React from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = "success", onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        right: 32,
        background: type === "error" ? "#f44336" : "#4caf50",
        color: "#fff",
        padding: "1em 2em",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        zIndex: 9999,
        minWidth: 200,
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        gap: "1em"
      }}
    >
      <span>{message}</span>
      <button
        style={{
          background: "transparent",
          border: "none",
          color: "#fff",
          fontSize: "1.2em",
          cursor: "pointer"
        }}
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
