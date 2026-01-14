import React, { createContext, useContext, useState, useCallback } from "react";
import { MdHelp, MdClose } from "react-icons/md";

const PromptContext = createContext();

export function GlobalPromptProvider({ children }) {
  const [prompt, setPrompt] = useState(null);

  const showPrompt = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setPrompt({
        message,
        confirmLabel: options.confirmLabel || "Confirm",
        cancelLabel: options.cancelLabel || "Cancel",
        onConfirm: () => {
          setPrompt(null);
          resolve(true);
        },
        onCancel: () => {
          setPrompt(null);
          resolve(false);
        },
      });
    });
  }, []);

  return (
    <PromptContext.Provider value={{ showPrompt }}>
      {children}
     {prompt && (
  <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4">
    <div className="bg-white border-2 border-amber-400 rounded-xl shadow-xl flex flex-col items-center gap-4 px-6 py-5 animate-fade-in">
        <div className="flex ">
      <MdHelp className="text-amber-500 text-2xl mr-4" />
      <div className="flex-1 text-base text-slate-800 font-semibold">{prompt.message}</div>
      {/* <button
        onClick={prompt.onCancel}
        className="ml-2 text-slate-400 text-right hover:text-slate-700"
        aria-label="Cancel"
      >
        <MdClose />
      </button> */}
      </div>
      {/* Buttons inside the main container */}
      <div className="flex gap-3 ml-6">
        <button
          onClick={prompt.onCancel}
          className="px-5 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-300 hover:bg-slate-200"
        >
          {prompt.cancelLabel}
        </button>
        <button
          onClick={prompt.onConfirm}
          className="px-5 py-2 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600"
        >
          {prompt.confirmLabel}
        </button>
      </div>
    </div>
  </div>
)}
    </PromptContext.Provider>
  );
}

export function useGlobalPrompt() {
  return useContext(PromptContext);
}