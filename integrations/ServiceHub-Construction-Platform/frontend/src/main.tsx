import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";
import { reportWebVitals } from "./reportWebVitals.ts";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import { useAuthStore } from "./stores/authStore.ts";

if (import.meta.env.VITE_MOCK_MODE === "true") {
  useAuthStore.getState().setAuth("mock-access-token", "mock-refresh-token", {
    id: "22222222-0001-0000-0000-000000000001",
    email: "admin@servicehub.jp",
    full_name: "山田 太郎",
    role: "ADMIN",
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

// Collect Core Web Vitals (LCP, INP, CLS, TTFB, FCP)
reportWebVitals();
