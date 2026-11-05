import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export interface ConfirmOptions {
  title: string;
  message: string;
  /** Confirm button text, e.g. "Delete" */
  confirmLabel?: string;
  /** Red confirm button; Cancel gets focus so Enter doesn't destroy anything */
  danger?: boolean;
}

interface DialogApi {
  /** In-app replacement for window.confirm(); resolves true when confirmed */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** In-app replacement for window.alert() for error messages */
  showError: (message: string, title?: string) => void;
}

type OpenDialog =
  | { kind: 'confirm'; options: ConfirmOptions; resolve: (ok: boolean) => void }
  | { kind: 'error'; title: string; message: string };

const DialogContext = createContext<DialogApi | null>(null);

export function useDialogs(): DialogApi {
  const api = useContext(DialogContext);
  if (!api) throw new Error('useDialogs must be used inside <DialogProvider>');
  return api;
}

/**
 * Renders confirm and error dialogs above everything else, including other
 * modals. Lives outside the app's component tree so clicks inside a dialog
 * never reach the modal underneath.
 */
export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const dialogRef = useRef<OpenDialog | null>(null);
  dialogRef.current = dialog;

  const close = useCallback((ok: boolean) => {
    const current = dialogRef.current;
    if (current?.kind === 'confirm') current.resolve(ok);
    setDialog(null);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>(resolve => {
    // A new dialog replaces one that's still open; the old one counts as cancelled
    const current = dialogRef.current;
    if (current?.kind === 'confirm') current.resolve(false);
    setDialog({ kind: 'confirm', options, resolve });
  }), []);

  const showError = useCallback((message: string, title = 'Something went wrong') => {
    const current = dialogRef.current;
    if (current?.kind === 'confirm') current.resolve(false);
    setDialog({ kind: 'error', title, message });
  }, []);

  // Esc cancels
  useEffect(() => {
    if (!dialog) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close(false);
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [dialog, close]);

  return (
    <DialogContext.Provider value={{ confirm, showError }}>
      {children}
      {dialog && (
        <div className="modal-overlay dialog-overlay" onClick={() => close(false)}>
          <div
            className="modal dialog"
            role={dialog.kind === 'error' ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title" id="dialog-title">
                {dialog.kind === 'confirm' ? dialog.options.title : dialog.title}
              </h2>
            </div>
            <div className="modal-content">
              <p className="dialog-message">
                {dialog.kind === 'confirm' ? dialog.options.message : dialog.message}
              </p>
            </div>
            <div className="modal-footer">
              {dialog.kind === 'confirm' ? (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={() => close(false)}
                    autoFocus={dialog.options.danger}
                  >
                    Cancel
                  </button>
                  <button
                    className={`btn ${dialog.options.danger ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => close(true)}
                    autoFocus={!dialog.options.danger}
                  >
                    {dialog.options.confirmLabel ?? 'OK'}
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={() => close(false)} autoFocus>
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};
