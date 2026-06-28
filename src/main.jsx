import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { OwnerAuthProvider } from "./context/OwnerAuthContext";
import { StaffAuthProvider } from "./context/StaffAuthContext";
import { CustomerAuthProvider } from "./context/CustomerAuthContext";
import App from "./App";
import "./index.css";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000, // 1 min default; individual queries can override
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OwnerAuthProvider>
          <StaffAuthProvider>
            <CustomerAuthProvider>
              <App />
            </CustomerAuthProvider>
          </StaffAuthProvider>
        </OwnerAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
