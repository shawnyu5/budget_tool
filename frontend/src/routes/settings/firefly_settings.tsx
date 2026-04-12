import { createSignal, For, ResourceReturn, Show } from "solid-js";
import { Settings, SettingsPageDataV2Query } from "~/generated/graphql";
import { SettingsPageDataSuccess } from "~/server";

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
        <input
          class="switch-input"
          id="firefly-settings-toggle"
          type="checkbox"
          name="firefly-settings-toggle"
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
                      enabled: toggled,
                    },
                  },
                },
              };
            });
          }}
        />
        <label class="switch-paddle" for="firefly-settings-toggle">
          <span class="show-for-sr">Toggle firefly settings</span>
        </label>
      </div>

      {
        // Firefly specific settings
      }
      <Show when={data()?.monthSettingsV2.settings.firefly?.enabled}>
        <label for="api-key">Firefly API key:</label>
        <div id="api-key-form">
          <input
            required={data()?.monthSettingsV2.settings.firefly?.enabled}
            type={showAPIKey() ? "text" : "password"}
            id="api-key"
            name="api-key"
            value={data()?.monthSettingsV2.settings.firefly?.apiKey ?? ""}
            onBlur={() => {
              if (data()?.monthSettingsV2.settings.firefly?.apiKey == null) {
                return;
              }
            }}
            onInput={(e: InputEvent) => {
              const input = e.target as HTMLInputElement;
              const apiKey = input.value;
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
                        apiKey: apiKey,
                      },
                    },
                  },
                };
              });
            }}
          />
          <label class="form-check-label" for="check-api-key">
            <input
              type="checkbox"
              class="form-check-input"
              id="check-api-key"
              checked={showAPIKey()}
              onchange={(e: Event) => {
                const input = e.target as HTMLInputElement;
                setShowAPIKey(input.checked);
              }}
            ></input>
            Show me
          </label>
        </div>
        <div id="select-default-account">
          <label>
            Default account
            <select
              // required={data()?.me.firefly?.enabled}
              value={
                data()?.monthSettingsV2.settings.firefly?.sourceAccount ?? ""
              }
              onInput={(e) =>
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
                          sourceAccount: e.target.value,
                        },
                      },
                    },
                  };
                })
              }
            >
              <For each={data()?.fireflyV2.accounts ?? []}>
                {(item) => <option value={item}>{item}</option>}
              </For>
            </select>
          </label>
        </div>
      </Show>
    </div>
  );
}
