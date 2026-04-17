import { action, useNavigate } from "@solidjs/router";
import axios from "axios";
import { Button, Form } from "solid-bootstrap";
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
      <Form onSubmit={onSubmit} method="post">
        <ErrorComponent errorMessage={errorMessage()} />

        <Form.Group controlId="username" class="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            name="username"
            value={userName()}
            required
            onInput={(e) => setUserName(e.currentTarget.value)}
            placeholder="Enter username"
          />
        </Form.Group>

        <Form.Group controlId="password" class="mb-4">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            autocomplete="current-password"
            value={password()}
            required
            onInput={(e) => setPassword(e.currentTarget.value)}
            placeholder="Enter password"
          />
        </Form.Group>

        <Button variant="success" type="submit" class="w-100">
          Login
        </Button>
      </Form>
    </div>
  );
}
