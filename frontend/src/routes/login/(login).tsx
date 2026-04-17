import { action, useNavigate } from "@solidjs/router";
import axios from "axios";
import { createSignal, onMount } from "solid-js";
import ErrorComponent from "~/components/ErrorComponent";
import { NewGraphQLSDK } from "~/graphql";
import log from "~/logger";
import { getNotificationSubscription } from "~/notification";
import { basicAuthLogin, validateJTWToken } from "~/server";

export default function Login() {
  const [userName, setUserName] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const navigate = useNavigate();
  onMount(async () => {
    await validateJTWToken();
  });

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    try {
      await basicAuthLogin(userName(), password()).then(async () => {
        navigate("/");

        getNotificationSubscription().then((subscription) => {
          if (!subscription) return;
          log.info("Saving push notification subscription to backend");
          const sdk = NewGraphQLSDK();
          const s = subscription.toJSON();
          sdk.saveSubscription({
            subscription: {
              auth: s.keys?.auth ?? "",
              endpoint: s.endpoint ?? "",
              p256Dh: s.keys?.p256dh ?? "",
            },
          });
        });
      });
    } catch (e) {
      log.error("Caught error in component");
      log.error(`Failed to login: ${e}`);
      if (axios.isAxiosError(e)) {
        if (e.response?.status == 403) {
          setErrorMessage("User does not have access");
        } else {
          setErrorMessage(e.message);
        }
      }
    }
  };

  return (
    <div id="login-form">
      <form onSubmit={onSubmit} method="post">
        <ErrorComponent errorMessage={errorMessage()} />

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
