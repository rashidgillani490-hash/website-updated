"use client";

/**
 * Last-resort boundary for errors thrown in the root layout itself. Next only
 * renders this in production, and it must ship its own <html>/<body> because it
 * replaces the root layout. Keep it dependency-free and inline-styled so it
 * cannot fail for the same reason the app did.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          padding: "0 1.5rem",
          textAlign: "center",
          background: "#0a0a0b",
          color: "#f5f1e8",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <p
          style={{
            fontSize: "0.6875rem",
            fontWeight: 500,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#c7ac7c",
            margin: 0,
          }}
        >
          Something went wrong
        </p>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', 'Times New Roman', serif",
            fontWeight: 300,
            fontSize: "2rem",
            margin: 0,
          }}
        >
          The maison is briefly unreachable
        </h1>
        {error?.digest ? (
          <p style={{ fontSize: "0.75rem", color: "#8a867d", margin: 0 }}>
            Reference: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            border: "1px solid #2a2a2f",
            background: "transparent",
            color: "#f5f1e8",
            padding: "0.75rem 1.5rem",
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
