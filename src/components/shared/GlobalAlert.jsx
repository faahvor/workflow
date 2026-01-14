import React, { createContext, useContext, useState, useCallback } from "react";
import { MdCheckCircle, MdError, MdInfo, MdWarning, MdClose } from "react-icons/md";

const AlertContext = createContext();

const ICONS = {
  success: <MdCheckCircle className="text-emerald-500 text-2xl" />,
  error: <MdError className="text-red-500 text-2xl" />,
  info: <MdInfo className="text-emerald-500 text-2xl" />,
  warning: <MdWarning className="text-amber-500 text-2xl" />,
};

const BG = {
  success: "bg-emerald-50 border-emerald-400",
  error: "bg-red-50 border-red-400",
  info: "bg-emerald-50 border-emerald-400",
  warning: "bg-amber-50 border-amber-400",
};

export function GlobalAlertProvider({ children }) {
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((message, type = "info", duration = 4000) => {
    setAlert({ message, type });
    if (duration > 0) {
      setTimeout(() => setAlert(null), duration);
    }
  }, []);

  const hideAlert = useCallback(() => setAlert(null), []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alert && (
        <div
          className={`fixed top-6 right-6 z-[9999] max-w-xs w-full shadow-lg rounded-xl border-2 flex items-center gap-3 px-4 py-3 transition-all animate-fade-in cursor-pointer ${BG[alert.type] || BG.info}`}
          onClick={hideAlert}
          role="alert"
        >
          {ICONS[alert.type] || ICONS.info}
          <div className="flex-1 text-sm text-slate-800">{alert.message}</div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              hideAlert();
            }}
            className="ml-2 text-slate-400 hover:text-slate-700"
            aria-label="Dismiss"
          >
            <MdClose />
          </button>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useGlobalAlert() {
  return useContext(AlertContext);
}