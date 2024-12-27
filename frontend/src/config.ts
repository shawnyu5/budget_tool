interface Config {
  backendUrl: string;
}

/**
 * Load configuration
 */
export function loadConfig(): Config {
  if (import.meta.env) {
    return {
      backendUrl: import.meta.env.VITE_BACKEND_URL || "",
    };
  } else {
    return {
      backendUrl: "",
    };
  }
}
