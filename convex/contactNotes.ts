/**
 * Contact Notes queries and mutations for Convex
 */

// @ts-nocheck - Schema types mismatch with generated Convex types
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all notes for a contact
 */
export const getByContact = query({
  args: {
    contact_id: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("contactNotes")
      .withIndex("by_contact", (q) => q.eq("contact_id", args.contact_id))
      .order("desc")
      .collect();

    return notes;
  },
});

/**
 * Create a new note for a contact
 */
export const create = mutation({
  args: {
    contact_id: v.id("contacts"),
    content: v.string(),
    user_id: v.string(),
    due_date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get contact to verify it exists and get workspace_id
    const contact = await ctx.db.get(args.contact_id);
    if (!contact) {
      throw new Error("Contact not found");
    }

    const noteId = await ctx.db.insert("contactNotes", {
      workspace_id: contact.workspace_id,
      contact_id: args.contact_id,
      user_id: args.user_id,
      content: args.content,
      created_at: Date.now(),
      supabaseId: "", // Empty for new notes created after migration
    });

    return await ctx.db.get(noteId);
  },
});

/**
 * Delete a note
 */
export const deleteNote = mutation({
  args: {
    note_id: v.id("contactNotes"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.note_id);
    return { success: true };
  },
});
