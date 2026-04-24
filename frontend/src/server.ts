/**
 * Functions for communicating with the backend server
 *
 */
import axios from "axios";
import { Navigator } from "@solidjs/router";
import { paths } from "./backend_schema";
import { loadLocalConfig } from "./config";
import log from "./logger";
import { useNavigate } from "@solidjs/router";
import { getLocalAuthToken, setLocalAuthToken } from "./utils";
import axiosRetry from "axios-retry";
import { client } from "~/client/client.gen";
import { basicAuthHandlerV2 } from "~/client/sdk.gen";
import {} from "./generated/graphql";

axiosRetry(axios, {
  retries: 4,
  retryDelay: axiosRetry.exponentialDelay,
});

client.setConfig({
  baseURL: loadLocalConfig().backendUrl,
  axios: axios,
});

/**
 * Validate the JWT token with the server. If the token is invalid or expired, redirect to `/login`
 */
export async function validateJTWToken() {
  log.info("Checking if there is a JWT token present");
  const token = getLocalAuthToken();
  if (!token) {
    log.info("No JWT found...");
    return;
  }

  log.info("Found JTW token. Checking if token is still valid");
  const navigate = useNavigate();
  try {
    const response = await axios.get(
      `${loadLocalConfig().backendUrl}/auth/validate-token`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (response.status == 200) {
      log.info("Token is valid. Redirecting to home page");
      navigate("/", { replace: true });
    }
  } catch (e) {
    log.info("Token is no longer valid. Redirecting to login page");
    navigate("/login", { replace: true });
  }
}

/**
 * Performs basic auth. If authentication is successful, stores the resulting JWT token in local storage
 * @throws if authentication fails
 */
export async function basicAuthLogin(userName: string, password: string) {
  const base64Encoded = btoa(`${userName}:${password}`);
  const response = await basicAuthHandlerV2({
    headers: {
      Authorization: `Basic ${base64Encoded}`,
    },
  });

  if (response.error && response.isAxiosError) {
    throw response;
  }

  setLocalAuthToken(response.data ?? "");
}

export async function exportCSV(year: string, month: string): Promise<string> {
  const response = await axios.get(
    `${loadLocalConfig().backendUrl}/export/${year}/${month}/csv`,
    {
      headers: {
        Authorization: `Bearer ${getLocalAuthToken()}`,
      },
    },
  );
  return response.data;
}
