import { Form } from "solid-bootstrap";
import { createSignal, For, ResourceReturn, Show } from "solid-js";
import { SettingsPageDataV2Query } from "~/generated/graphql";

export function FireflySettingsForm(props: {
  data: ResourceReturn<SettingsPageDataV2Query | undefined, unknown>;
}) {
  /** If the API key should be shown to the user */
  const [showAPIKey, setShowAPIKey] = createSignal(false);
  const [data, { mutate }] = props.data;
  return (
    <div id="firefly-settings">
      <h2>Firefly integration</h2>
      <div id="firefly-toggle" class="switch">
        <Form.Group controlId="firefly-settings-toggle" class="mb-3">
          <Form.Check
            type="switch"
            label="Enable Firefly Settings"
            id="firefly-settings-toggle"
            checked={data()?.monthSettingsV2.settings.firefly?.enabled ?? false}
            onChange={(e) => {
              const toggled = e.currentTarget.checked;
              mutate((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  monthSettingsV2: {
                    ...prev.monthSettingsV2,
                    settings: {
                      ...prev.monthSettingsV2.settings,
                      firefly: {
                        ...prev.monthSettingsV2.settings.firefly, // spread existing firefly sub-settings
                        enabled: toggled,
                      },
                    },
                  },
                };
              });
            }}
          />
        </Form.Group>
      </div>

      {
        // Firefly specific settings
      }
      <Show when={data()?.monthSettingsV2.settings.firefly?.enabled}>
        <div id="api-key-form">
          <Form.Group controlId="api-key" class="mb-3">
            <Form.Label>API Key</Form.Label>
            <Form.Control
              required={data()?.monthSettingsV2.settings.firefly?.enabled}
              type={showAPIKey() ? "text" : "password"}
              placeholder="Enter Firefly API Key"
              value={data()?.monthSettingsV2.settings.firefly?.apiKey ?? ""}
              onInput={(e) => {
                const val = e.currentTarget.value;
                mutate((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    monthSettingsV2: {
                      ...prev.monthSettingsV2,
                      settings: {
                        ...prev.monthSettingsV2.settings,
                        firefly: {
                          ...prev.monthSettingsV2.settings.firefly,
                          apiKey: val,
                        },
                      },
                    },
                  };
                });
              }}
            />
            <Form.Check
              type="checkbox"
              id="check-api-key"
              label="Show me"
              class="mt-2"
              checked={showAPIKey()}
              onChange={(e) => setShowAPIKey(e.currentTarget.checked)}
            />
          </Form.Group>

          <Form.Group controlId="select-default-account" class="mb-3">
            <Form.Label>Default account</Form.Label>
            <Form.Select
              value={
                data()?.monthSettingsV2.settings.firefly?.sourceAccount ?? ""
              }
              onInput={(e) => {
                const val = e.currentTarget.value;
                mutate((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    monthSettingsV2: {
                      ...prev.monthSettingsV2,
                      settings: {
                        ...prev.monthSettingsV2.settings,
                        firefly: {
                          ...prev.monthSettingsV2.settings.firefly,
                          sourceAccount: val,
                        },
                      },
                    },
                  };
                });
              }}
            >
              <option value="">Select an account...</option>
              <For each={data()?.fireflyV2?.accounts ?? []}>
                {(item) => <option value={item}>{item}</option>}
              </For>
            </Form.Select>
          </Form.Group>
        </div>
      </Show>
    </div>
  );
}
