"use client";

export interface DialogState {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  submitting?: boolean;
}

export default function Dialog({ dialog, onClose }: { dialog: DialogState; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-6"
      onClick={onClose}
    >
      <div className="w-full max-w-sm bg-canvas p-8" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-medium text-ink">{dialog.title}</h3>
        <p className="mb-6 text-sm text-mute">{dialog.message}</p>
        <div className="flex gap-3">
          <button
            onClick={dialog.onConfirm}
            disabled={dialog.submitting}
            className="h-11 flex-1 rounded-[30px] bg-ink text-sm font-medium text-canvas transition active:scale-[0.98] active:opacity-50 disabled:opacity-50"
          >
            {dialog.submitting ? "Please wait…" : dialog.confirmLabel}
          </button>
          {dialog.cancelLabel && (
            <button
              onClick={onClose}
              disabled={dialog.submitting}
              className="h-11 flex-1 rounded-[30px] bg-soft-cloud text-sm font-medium text-ink transition active:scale-[0.98] active:opacity-50 disabled:opacity-50"
            >
              {dialog.cancelLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
