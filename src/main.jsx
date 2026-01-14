import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./components/context/AuthContext.jsx";
import { GlobalAlertProvider } from "./components/shared/GlobalAlert.jsx";
import { GlobalPromptProvider } from "./components/shared/GlobalPrompt.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <GlobalAlertProvider>
        <GlobalPromptProvider>
          <App />
        </GlobalPromptProvider>{" "}
      </GlobalAlertProvider>{" "}
    </AuthProvider>
  </StrictMode>
);
