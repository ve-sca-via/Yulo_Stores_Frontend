// Central switches for the data layer.
//
// VITE_USE_MOCKS controls whether the app talks to the in-app mock backend
// (src/mocks) or the real server. It defaults to ON so the frontend works
// with zero backend running — flip it to "false" once the real APIs are ready.
//
//   .env / .env.local:
//     VITE_USE_MOCKS=true     -> use mock JSON (default)
//     VITE_USE_MOCKS=false    -> use the real backend
//     VITE_MOCK_LATENCY=250   -> fake network delay in ms
//     VITE_API_BASE=          -> prefix for real requests (proxy handles "" )

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

export const MOCK_LATENCY_MS = Number(import.meta.env.VITE_MOCK_LATENCY ?? 250);

export const API_BASE = import.meta.env.VITE_API_BASE ?? "";
