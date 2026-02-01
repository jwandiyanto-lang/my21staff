'use client';

import { useState, useEffect } from 'react';
import type { Id } from 'convex/_generated/dataModel';

interface InboxContentProps {
  workspaceId: Id<'workspaces'>;
}

export function InboxContent({ workspaceId }: InboxContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Kapso Inbox Embed Token
  const KAPSO_EMBED_TOKEN = process.env.NEXT_PUBLIC_KAPSO_INBOX_EMBED_TOKEN || 'YOUR_EMBED_TOKEN_HERE';

  useEffect(() => {
    // Set a timeout to hide loading after 3 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (KAPSO_EMBED_TOKEN === 'YOUR_EMBED_TOKEN_HERE') {
    return (
      <div className="h-screen flex items-center justify-center p-8">
        <div className="max-w-2xl space-y-4 text-center">
          <h2 className="text-2xl font-semibold">Kapso Inbox Setup Required</h2>
          <div className="text-left space-y-2 bg-muted/50 p-6 rounded-lg font-mono text-sm">
            <p className="font-sans font-medium">To enable the inbox, create an embed token:</p>
            <ol className="list-decimal list-inside space-y-1 font-sans">
              <li>Go to <a href="https://app.kapso.ai/projects/1fda0f3d-a913-4a82-bc1f-a07e1cb5213c" target="_blank" rel="noopener noreferrer" className="text-primary underline">Kapso Dashboard</a></li>
              <li>Navigate to <strong>Project → Inbox Embeds</strong></li>
              <li>Click <strong>Create Access Token</strong></li>
              <li>Choose scope: <strong>Project</strong> (for all conversations)</li>
              <li>Copy the embed token</li>
              <li>Add to Vercel environment variables</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-background">
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading inbox...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="max-w-md text-center space-y-4">
            <h3 className="text-lg font-semibold">Unable to load inbox</h3>
            <p className="text-sm text-muted-foreground">
              The Kapso inbox failed to load. Please check your connection and try again.
            </p>
            <button
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Kapso Inbox Iframe */}
      <iframe
        src={`https://inbox.kapso.ai/embed/${KAPSO_EMBED_TOKEN}`}
        className="w-full h-full border-0"
        title="WhatsApp Inbox"
        allow="clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        onLoad={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}
