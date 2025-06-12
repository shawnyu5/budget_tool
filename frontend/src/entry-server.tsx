// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {
            // Have IOS treat this app as a native app, hide safari tab
          }
          <meta name="apple-mobile-web-app-capable" content="yes"></meta>
          {
             // Set app name on home page
          }
          <meta name="apple-mobile-web-app-title" content="Budget tool"></meta>

          {
             // Set IOS app icon
          }
          <link rel="apple-touch-icon" href="/logo.jpeg"></link>
          {
             // TODO: this startup image doesnt seem to show up for some reason
          }
          <link rel="apple-touch-startup-image" href="/logo.jpeg"></link>
          <link rel="icon" href="/favicon.ico" />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
