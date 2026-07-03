import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BootGate } from "./components/BootGate";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BootGate>
      <App />
    </BootGate>
  </React.StrictMode>,
);
