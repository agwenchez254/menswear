/** Endpoints that need the customer's access token. Public catalogue calls never carry it. */
export const AUTHED_ENDPOINTS: ReadonlySet<string> = new Set(["getMe", "updateMe", "placeOrder", "getMyOrders", "getMyOrder", "resendPrompt", "getAddresses", "createAddress", "updateAddress", "deleteAddress"]);

export const needsAuthHeader = (endpoint: string | undefined): boolean => endpoint !== undefined && AUTHED_ENDPOINTS.has(endpoint);

/** Refresh once when an authenticated call is rejected and we hold a refresh token. */
export const shouldRefresh = (status: unknown, endpoint: string | undefined, hasRefreshToken: boolean): boolean =>
  status === 401 && hasRefreshToken && needsAuthHeader(endpoint);
