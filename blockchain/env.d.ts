// src/env.d.ts

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test'
    ADMIN_PRIVATE_KEY: string
    SUPABASE_URL: string
    SUPABASE_SERVICE_ROLE_KEY: string
    TICKET_MANAGER_ADDRESS: string
    // 여기에 추가 ENV 키들 선언...
  }
}
