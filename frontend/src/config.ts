import { z } from "zod/v4";
import { GraphQLClient } from "graphql-request";
import log from "./logger";
import { getSdk } from "./generated/graphql";

/**
 * Schema for local configuration
 */
const LocalConfigSchema = z.object({
  backendUrl: z.string(),
});
type LocalConfig = z.output<typeof LocalConfigSchema>;

const ServerConfigSchema = z.object({
  encryptionPublicKey: z.string(),
  vapidPublicKey: z.string(),
});
type ServerConfig = z.output<typeof ServerConfigSchema>;

/**
 * Load local configuration. This is a very cheap operation
 */
export function loadLocalConfig(): LocalConfig {
  let config = {
    backendUrl: import.meta.env.VITE_BACKEND_URL,
  };
  const result = LocalConfigSchema.safeParse(config);
  if (!result.success) {
    log.error(`Failed to load local config: ${result.error.message}`);
  }

  return result.data!;
}

/**
 * Loads configuration from server. This is more expensive call, as it involves an http call
 * @return promise containing server configuration. A rejected promise if the http call fails
 */
export async function loadServerConfig(): Promise<ServerConfig> {
  const client = new GraphQLClient(
    `${loadLocalConfig().backendUrl}/graphql`,
    {},
  );
  const sdk = getSdk(client);
  const { config } = await sdk.getConfig();
  const result = ServerConfigSchema.safeParse(config);
  console.log(JSON.stringify(result.data, null, 3))
  if (!result.success) {
    return Promise.reject(
      `Failed to load config from server: ${result.error.message}`,
    );
  }

  return result.data!;
}
