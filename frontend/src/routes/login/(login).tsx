import { action, redirect } from "@solidjs/router";
import axios from "axios";
import { createSignal, onMount } from "solid-js";
import ErrorComponent from "~/components/errorComponent";
import { loadServerConfig } from "~/config";
import log from "~/logger";
import { basicAuthLogin, validateJTWToken } from "~/server";

export default function Login() {
  const [userName, setUserName] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  onMount(async () => {
    await validateJTWToken();
  });

  const onSubmit = action(async (_data: FormData) => {
    try {
      await basicAuthLogin(userName(), password());
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
