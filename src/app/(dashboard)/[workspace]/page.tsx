import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Workspace: {workspace}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Workspace content will be added in Phase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
