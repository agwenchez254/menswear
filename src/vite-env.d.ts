/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Secret the API uses to recognise requests signed by this app. Required in production builds. */
  readonly VITE_SIGNING_KEY?: string;
}
