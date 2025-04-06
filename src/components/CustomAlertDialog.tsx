"use client";
import { buttonStyles, redButtonStyles } from "@/utils/styles";

interface CustomAlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  type?: 'success' | 'warning';
}

export default function CustomAlertDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  type = 'success'
}: CustomAlertDialogProps) {
  if (!isOpen) return null;

  const confirmButtonStyle = type === 'warning' ? redButtonStyles : buttonStyles;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          {onCancel && (
            <button onClick={onCancel} className={redButtonStyles}>
              {cancelLabel || "Cancel"}
            </button>
          )}
          <button onClick={onConfirm} className={confirmButtonStyle}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}