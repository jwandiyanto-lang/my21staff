'use client';

import type { Id } from 'convex/_generated/dataModel';

interface InboxContentProps {
  workspaceId: Id<'workspaces'>;
}

export function InboxContent({ workspaceId }: InboxContentProps) {
  // Kapso Inbox Embed Token
  // Get this from: https://app.kapso.ai/projects/1fda0f3d-a913-4a82-bc1f-a07e1cb5213c
  // Navigate to: Project → Inbox Embeds → Create Access Token
  const KAPSO_EMBED_TOKEN = process.env.NEXT_PUBLIC_KAPSO_INBOX_EMBED_TOKEN || 'YOUR_EMBED_TOKEN_HERE';

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
              <li>Add to <code className="bg-background px-1">.env.local</code>:</li>
            </ol>
            <pre className="bg-background p-3 rounded mt-2 overflow-x-auto">
              NEXT_PUBLIC_KAPSO_INBOX_EMBED_TOKEN=your_token_here
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <iframe
        src={`https://inbox.kapso.ai/embed/${KAPSO_EMBED_TOKEN}`}
        style={{ width: '100%', height: '100%', border: 0 }}
        title="Kapso Inbox"
        allow="clipboard-write"
      />
    </div>
  );
}
