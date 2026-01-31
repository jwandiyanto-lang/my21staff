import { InsightsContent } from './insights-client'

interface Props {
  params: Promise<{ workspace: string }>
}

export default async function InsightsPage({ params }: Props) {
  const { workspace } = await params
  return <InsightsContent workspaceSlug={workspace} />
}
