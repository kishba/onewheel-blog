import { Outlet } from "@remix-run/react";

export default function PostsRoute() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: { error: unknown }) {
  // Important: It's important that you not throw anymore errors within an ErrorBoundary
  // because it's the last line of defense and won't be caught again
  // Also know that errors within event handlers won't be caught -- they'll still go to the browser console
  if (error instanceof Error) {
    return (
      <div className="text-red-500">
        Oh no, something went wrong!
        <pre>{error.message}</pre>
      </div>
    );
  }
  return <div className="text-red-500">Oh no, something went wrong!</div>;
}
