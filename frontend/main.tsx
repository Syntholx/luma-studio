import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./App";

const app = document.getElementById("app");
if (!(app instanceof HTMLElement)) {
  throw new Error("Element not found");
}

createRoot(app).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
