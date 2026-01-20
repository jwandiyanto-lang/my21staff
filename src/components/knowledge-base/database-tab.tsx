'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Trash2,
  Loader2,
  Database,
  FolderOpen,
  MoreVertical,
  Pencil,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import type { KnowledgeCategory, KnowledgeEntry } from '@/lib/ari/types'

interface DatabaseTabProps {
  workspaceId: string
}

export function DatabaseTab({ workspaceId }: DatabaseTabProps) {
  const [categories, setCategories] = useState<KnowledgeCategory[]>([])
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  // Dialog states
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false)
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false)
  const [isEditEntryDialogOpen, setIsEditEntryDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form states
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const [editCategory, setEditCategory] = useState<KnowledgeCategory | null>(null)
  const [newEntry, setNewEntry] = useState({ title: '', content: '', category_id: '' })
  const [editEntry, setEditEntry] = useState<KnowledgeEntry | null>(null)

  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [workspaceId])

  async function fetchData() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/knowledge`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCategories(data.categories || [])
      setEntries(data.entries || [])
    } catch (error) {
      console.error('Failed to fetch knowledge data:', error)
      toast.error('Failed to load knowledge base')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter entries by selected category
  const filteredEntries = useMemo(() => {
    if (selectedCategoryId === null) {
      return entries // Show all
    }
    if (selectedCategoryId === 'uncategorized') {
      return entries.filter(e => e.category_id === null)
    }
    return entries.filter(e => e.category_id === selectedCategoryId)
  }, [entries, selectedCategoryId])

  // Count entries per category
  const entryCounts = useMemo(() => {
    const counts: Record<string, number> = { uncategorized: 0 }
    entries.forEach(e => {
      if (e.category_id === null) {
        counts.uncategorized++
      } else {
        counts[e.category_id] = (counts[e.category_id] || 0) + 1
      }
    })
    return counts
  }, [entries])

  // Category CRUD
  async function handleAddCategory() {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'category',
          name: newCategory.name.trim(),
          description: newCategory.description.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create')
      }

      const data = await res.json()
      setCategories([...categories, data.category])
      setIsCategoryDialogOpen(false)
      setNewCategory({ name: '', description: '' })
      toast.success('Category created')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create category'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdateCategory() {
    if (!editCategory) return
    if (!editCategory.name.trim()) {
      toast.error('Category name is required')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/knowledge`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: editCategory.id,
          name: editCategory.name.trim(),
          description: editCategory.description?.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update')
      }

      const data = await res.json()
      setCategories(categories.map(c => c.id === editCategory.id ? data.category : c))
      setIsEditCategoryDialogOpen(false)
      setEditCategory(null)
      toast.success('Category updated')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update category'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    const count = entryCounts[categoryId] || 0
    const confirmMsg = count > 0
      ? `Delete this category and ${count} entries?`
      : 'Delete this category?'

    if (!confirm(confirmMsg)) return

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/knowledge?categoryId=${categoryId}`,
        { method: 'DELETE' }
      )

      if (!res.ok) throw new Error('Failed to delete')

      const data = await res.json()
      setCategories(categories.filter(c => c.id !== categoryId))
      setEntries(entries.filter(e => e.category_id !== categoryId))
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(null)
      }
      toast.success(`Category deleted${data.entriesDeleted > 0 ? ` (${data.entriesDeleted} entries removed)` : ''}`)
    } catch (error) {
      toast.error('Failed to delete category')
    }
  }

  // Entry CRUD
  async function handleAddEntry() {
    if (!newEntry.title.trim()) {
      toast.error('Entry title is required')
      return
    }
    if (!newEntry.content.trim()) {
      toast.error('Entry content is required')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'entry',
          title: newEntry.title.trim(),
          content: newEntry.content.trim(),
          category_id: newEntry.category_id || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create')
      }

      const data = await res.json()
      setEntries([data.entry, ...entries])
      setIsEntryDialogOpen(false)
      setNewEntry({ title: '', content: '', category_id: '' })
      toast.success('Entry created')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create entry'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdateEntry() {
    if (!editEntry) return
    if (!editEntry.title.trim()) {
      toast.error('Entry title is required')
      return
    }
    if (!editEntry.content.trim()) {
      toast.error('Entry content is required')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/knowledge/${editEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editEntry.title.trim(),
          content: editEntry.content.trim(),
          category_id: editEntry.category_id || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update')
      }

      const data = await res.json()
      setEntries(entries.map(e => e.id === editEntry.id ? data.entry : e))
      setIsEditEntryDialogOpen(false)
      setEditEntry(null)
      toast.success('Entry updated')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update entry'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteEntry(entryId: string) {
    if (!confirm('Delete this entry?')) return

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/knowledge/${entryId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete')

      setEntries(entries.filter(e => e.id !== entryId))
      toast.success('Entry deleted')
    } catch (error) {
      toast.error('Failed to delete entry')
    }
  }

  function getCategoryName(categoryId: string | null): string {
    if (!categoryId) return 'Uncategorized'
    return categories.find(c => c.id === categoryId)?.name || 'Unknown'
  }

  function truncateContent(content: string, maxLength = 100): string {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Two-column layout */}
      <div className="grid grid-cols-[240px_1fr] gap-6">
        {/* Categories Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Categories</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsCategoryDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-1">
            {/* All entries option */}
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                selectedCategoryId === null
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                All
              </span>
              <Badge variant="secondary" className="text-xs">
                {entries.length}
              </Badge>
            </button>

            {/* Uncategorized option */}
            {entryCounts.uncategorized > 0 && (
              <button
                onClick={() => setSelectedCategoryId('uncategorized')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedCategoryId === 'uncategorized'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Uncategorized
                </span>
                <Badge variant="secondary" className="text-xs">
                  {entryCounts.uncategorized}
                </Badge>
              </button>
            )}

            {/* Category list */}
            {categories.map(cat => (
              <div
                key={cat.id}
                className={`group flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedCategoryId === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <button
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span className="truncate">{cat.name}</span>
                </button>
                <div className="flex items-center gap-1">
                  <Badge
                    variant={selectedCategoryId === cat.id ? 'outline' : 'secondary'}
                    className="text-xs"
                  >
                    {entryCounts[cat.id] || 0}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 opacity-0 group-hover:opacity-100 ${
                          selectedCategoryId === cat.id ? 'text-primary-foreground hover:text-primary-foreground' : ''
                        }`}
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditCategory(cat)
                        setIsEditCategoryDialogOpen(true)
                      }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <p className="text-xs text-muted-foreground px-3">
              Create your first category to organize knowledge
            </p>
          )}
        </div>

        {/* Entries List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">
                {selectedCategoryId === null
                  ? 'All Entries'
                  : selectedCategoryId === 'uncategorized'
                  ? 'Uncategorized Entries'
                  : `${getCategoryName(selectedCategoryId)} Entries`}
              </h3>
              <p className="text-sm text-muted-foreground">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
            <Button onClick={() => {
              setNewEntry({
                title: '',
                content: '',
                category_id: selectedCategoryId && selectedCategoryId !== 'uncategorized'
                  ? selectedCategoryId
                  : '',
              })
              setIsEntryDialogOpen(true)
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No entries yet</p>
              <p className="text-sm text-muted-foreground">
                Add entries to build your intern&apos;s knowledge base
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Title</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead className="w-[140px]">Category</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {truncateContent(entry.content)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoryName(entry.category_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditEntry(entry)
                              setIsEditEntryDialogOpen(true)
                            }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Info card */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How It Works</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Create categories to organize your knowledge (e.g., &quot;Universities&quot;, &quot;FAQ&quot;)</li>
          <li>Add entries with title and content your intern can reference</li>
          <li>Your intern uses this knowledge to answer questions accurately</li>
        </ul>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a category to organize knowledge entries
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Name</Label>
              <Input
                id="categoryName"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g., Universities"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Description (optional)</Label>
              <Textarea
                id="categoryDescription"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="What kind of entries belong here?"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editCategory && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editCategoryName">Name</Label>
                <Input
                  id="editCategoryName"
                  value={editCategory.name}
                  onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCategoryDescription">Description (optional)</Label>
                <Textarea
                  id="editCategoryDescription"
                  value={editCategory.description || ''}
                  onChange={(e) => setEditCategory({ ...editCategory, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Entry Dialog */}
      <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Entry</DialogTitle>
            <DialogDescription>
              Add knowledge your intern can use to answer questions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="entryCategory">Category (optional)</Label>
              <Select
                value={newEntry.category_id || 'none'}
                onValueChange={(v) => setNewEntry({ ...newEntry, category_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entryTitle">Title</Label>
              <Input
                id="entryTitle"
                value={newEntry.title}
                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                placeholder="e.g., University of Melbourne"
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entryContent">Content</Label>
              <Textarea
                id="entryContent"
                value={newEntry.content}
                onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                placeholder="Add detailed information your intern should know..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEntryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={isEditEntryDialogOpen} onOpenChange={setIsEditEntryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
          </DialogHeader>
          {editEntry && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editEntryCategory">Category</Label>
                <Select
                  value={editEntry.category_id || 'none'}
                  onValueChange={(v) => setEditEntry({ ...editEntry, category_id: v === 'none' ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEntryTitle">Title</Label>
                <Input
                  id="editEntryTitle"
                  value={editEntry.title}
                  onChange={(e) => setEditEntry({ ...editEntry, title: e.target.value })}
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEntryContent">Content</Label>
                <Textarea
                  id="editEntryContent"
                  value={editEntry.content}
                  onChange={(e) => setEditEntry({ ...editEntry, content: e.target.value })}
                  rows={6}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditEntryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEntry} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
