/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_MAP_PROVIDER: string;
  readonly VITE_MAP_API_KEY: string;
  readonly VITE_MAP_STYLE_URL: string;
  readonly VITE_TRANSPORT_MODE: string;
  readonly VITE_POLLING_INTERVAL_MS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
