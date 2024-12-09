interface Config {
   backendUrl: string;
}

/**
   * Load configuration
 */
export function loadConfig(): Config {
   return {
      backendUrl: import.meta.env.VITE_BACKEND_URL,
   }
}

