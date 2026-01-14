export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar will go here in Phase 2 */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
