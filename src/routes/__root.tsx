import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Humanizer Bot — Make AI Text Sound Natural" },
      { name: "description", content: "Transform AI-generated text into natural, human-sounding writing in seconds." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Humanizer Bot — Make AI Text Sound Natural" },
      { property: "og:description", content: "Transform AI-generated text into natural, human-sounding writing in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Humanizer Bot — Make AI Text Sound Natural" },
      { name: "twitter:description", content: "Transform AI-generated text into natural, human-sounding writing in seconds." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ae12de05-0221-45a7-bf30-cdc121251ddd/id-preview-1ffb2a7b--8c60ce5a-d437-4249-8af0-f11b7a6c1966.lovable.app-1777542910180.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ae12de05-0221-45a7-bf30-cdc121251ddd/id-preview-1ffb2a7b--8c60ce5a-d437-4249-8af0-f11b7a6c1966.lovable.app-1777542910180.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
