import { action, redirect, useNavigate } from "@solidjs/router";
import axios from "axios";
import { createSignal, onMount } from "solid-js";
import ErrorComponent from "~/components/errorComponent";
import { loadConfig } from "~/config";
import log from "~/logger";

export default function () {
  const [userName, setUserName] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const navigate = useNavigate();
  onMount(async () => {
    // TODO: extract this into utils function. This should be called on a few pages on load
    log.info("Checking if there is a JWT token present");
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }
    log.info("Found JTW token. Checking if token is still valid");
    try {
      const response = await axios.get(`${loadConfig().backendUrl}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status == 200) {
        log.info("Token is valid. Redirecting to home page");
        navigate("/", { replace: true });
      }
    } catch (e) {
      log.info("Token is no longer valid");
    }
  });

  const onSubmit = action(async (_data: FormData) => {
    const base64Encoded = btoa(`${userName()}:${password()}`);
    try {
      const response = await axios.post(
        `${loadConfig().backendUrl}/login/basic`,
        {},
        {
          headers: {
            Authorization: `Basic ${base64Encoded}`,
          },
        },
      );

      log.info("Storing token in local storage");
      localStorage.setItem("token", response.data);
      return redirect("/");
    } catch (e) {
      log.error(`Failed to login: ${e}`);
      if (axios.isAxiosError(e)) {
        if (e.response?.status == 403) {
          setErrorMessage("User does not have access");
        } else {
          setErrorMessage(e.message);
        }
      }
    }
  });

  return (
    <div id="login-form">
      <form action={onSubmit} method="post">
        <ErrorComponent message={errorMessage()} />

        <label>Username</label>
        <input
          type="text"
          id="username"
          name="username"
          value={userName()}
          required
          onInput={(e: InputEvent) => {
            const input = e.target as HTMLInputElement;
            const username = input.value;
            setUserName(username);
          }}
        />
        <label>Password</label>
        <input
          type="password"
          id="password"
          name="password"
          autocomplete="password"
          value={password()}
          onInput={(e: InputEvent) => {
            const input = e.target as HTMLInputElement;
            const password = input.value;
            setPassword(password);
          }}
          required
        />
        <br />
        <br />
        <button class="submit success button">Login</button>
      </form>
    </div>
  );
}
