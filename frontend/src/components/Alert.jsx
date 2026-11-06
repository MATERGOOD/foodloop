import React from "react";

export const Alert = ({ type = "info", message, onClose }) => {
  if (!message) return null;

  return (
    <div className={`alert-banner alert-${type}`}>
      <span className="alert-text">{message}</span>
      {onClose && (
        <button className="alert-close-btn" onClick={onClose} aria-label="Dismiss alert">
          ✕
        </button>
      )}
    </div>
  );
};

export default Alert;
