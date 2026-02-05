/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_R2_S3_API: string
  readonly APP_R2_ACCESS_ID: string
  readonly APP_R2_SECRET_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
