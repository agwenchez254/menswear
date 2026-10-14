import type { AuthUser } from "@/store/authPersist";
import { sessionStarted, signedOut, userUpdated } from "@/store/authSlice";
import { baseApi } from "./baseApi";

export interface AuthResponse {
  customer: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresAt: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    register: b.mutation<AuthResponse, RegisterInput>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(sessionStarted({ user: data.customer, accessToken: data.accessToken, refreshToken: data.refreshToken }));
        } catch {
          /* the error is shown by the form */
        }
      },
    }),
    login: b.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(sessionStarted({ user: data.customer, accessToken: data.accessToken, refreshToken: data.refreshToken }));
        } catch {
          /* the error is shown by the form */
        }
      },
    }),
    /** Argument: the refresh token to revoke. Signs out locally even if the request fails. */
    logout: b.mutation<void, string>({
      query: (refreshToken) => ({ url: "/auth/logout", method: "POST", body: { refreshToken } }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          /* still sign out */
        }
        dispatch(signedOut());
        dispatch(baseApi.util.resetApiState());
      },
    }),
    getMe: b.query<AuthUser, void>({
      query: () => "/me",
      providesTags: ["Me"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(userUpdated(data));
        } catch {
          /* a failed refresh already signed the customer out */
        }
      },
    }),
    updateMe: b.mutation<AuthUser, { name?: string; phone?: string }>({
      query: (body) => ({ url: "/me", method: "PATCH", body }),
      invalidatesTags: ["Me"],
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation, useLogoutMutation, useGetMeQuery, useUpdateMeMutation } = authApi;
