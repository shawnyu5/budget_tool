self.addEventListener("push", (event) => {
  if (!event.data) {
    console.error("Push event has no data");
    return;
  }

  try {
    const data = event.data.json();
    console.log("Push payload:", data);

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/logo.jpeg",
      }),
    );
  } catch (e) {
    console.error("Failed to parse push payload:", e);
  }
});
