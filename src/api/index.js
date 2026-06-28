// The one entry point the UI talks to.
//
// Screens call requestJson(url, options) exactly like before. Behind it we
// route to either the mock backend or the real server based on USE_MOCKS.
// When the real APIs are ready, set VITE_USE_MOCKS=false — no screen changes.

import { USE_MOCKS } from "./config";
import { httpRequestJson, readToken, storeToken } from "./http";
import { mockRequestJson } from "../mocks/server";

export { readToken, storeToken };

export async function requestJson(url, options = {}) {
  if (USE_MOCKS) {
    return mockRequestJson(url, options);
  }

  return httpRequestJson(url, options);
}
