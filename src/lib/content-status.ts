export const articleStatuses = {
  draft: { label: 'Draft', color: 'bg-zinc-100 text-zinc-700' },
  published: { label: 'Published', color: 'bg-green-100 text-green-700' },
} as const

export const webinarStatuses = {
  draft: { label: 'Draft', color: 'bg-zinc-100 text-zinc-700' },
  published: { label: 'Published', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
} as const

export type ArticleStatus = keyof typeof articleStatuses
export type WebinarStatus = keyof typeof webinarStatuses
