export default function setup() {
  Object.defineProperty(globalThis, "import", {
    value: {
      meta: {
        env: {
          VITE_BACKEND_URL: "https://mock-backend-url.com",
        },
      },
    },
  });

  // // @ts-ignore
  // globalThis.import = {
  //   meta: {
  //     env: {
  //       VITE_BACKEND_URL: "http://localhost:8000",
  //     },
  //   },
  // };
}
