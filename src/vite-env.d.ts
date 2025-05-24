/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_MAP_DEFAULT_LAT: string
  readonly VITE_MAP_DEFAULT_LNG: string
  readonly VITE_MAP_DEFAULT_ZOOM: string
  readonly VITE_ENABLE_PWA: string
  readonly VITE_ENABLE_DEBUG: string
  readonly VITE_ENABLE_MOCK_DATA: string
  readonly VITE_LOG_LEVEL: string
  readonly VITE_MAP_TILE_URL: string
  readonly VITE_MAP_TILE_ATTRIBUTION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
