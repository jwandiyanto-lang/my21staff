/**
 * CMS query and mutation functions for Convex.
 *
 * These functions provide CMS data access for articles, webinars,
 * and webinar registrations, replacing Supabase-based CMS implementation.
 */

// @ts-nocheck - Schema types mismatch with generated Convex types
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// ARTICLES
// ============================================

/**
 * List articles for a workspace.
 *
 * @param workspaceId - The workspace ID
 * @returns Array of article documents ordered by creation date (newest first)
 */
export const listArticles = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("articles")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspaceId))
      .order("desc")
      .collect();
  },
});

/**
 * Get article by ID.
 *
 * @param articleId - The article ID
 * @returns Article document or null if not found
 */
export const getArticle = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.articleId);
  },
});

/**
 * Get published article by workspace and slug (for public pages).
 *
 * @param workspaceId - The workspace ID
 * @param slug - The article slug
 * @returns Published article or null if not found
 */
export const getPublishedArticle = query({
  args: { workspaceId: v.id("workspaces"), slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("articles")
      .withIndex("by_workspace_slug", (q) =>
        q.eq("workspace_id", args.workspaceId).eq("slug", args.slug)
      )
      .filter((q) => q.eq(q.field("status"), "published"))
      .first();
  },
});

/**
 * Create article.
 *
 * @param workspaceId - The workspace ID
 * @param title - Article title
 * @param slug - Article slug (unique per workspace)
 * @param excerpt - Optional excerpt
 * @param content - Optional content
 * @param cover_image_url - Optional cover image URL
 * @param status - Article status ('draft' or 'published')
 * @returns The created article ID
 */
export const createArticle = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    title: v.string(),
    slug: v.string(),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    cover_image_url: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("articles", {
      workspace_id: args.workspaceId,
      title: args.title,
      slug: args.slug,
      excerpt: args.excerpt,
      content: args.content,
      cover_image_url: args.cover_image_url,
      status: args.status,
      published_at: args.status === "published" ? now : undefined,
      created_at: now,
      updated_at: now,
    });
  },
});

/**
 * Update article.
 *
 * @param articleId - The article ID
 * @param title - Optional updated title
 * @param slug - Optional updated slug
 * @param excerpt - Optional updated excerpt
 * @param content - Optional updated content
 * @param cover_image_url - Optional updated cover image URL
 * @param status - Optional updated status
 * @returns The article ID
 */
export const updateArticle = mutation({
  args: {
    articleId: v.id("articles"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    cover_image_url: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { articleId, ...updates } = args;
    const now = Date.now();

    // Set published_at if status changed to published
    const article = await ctx.db.get(articleId);
    if (updates.status === "published" && article?.status !== "published") {
      updates.published_at = now;
    }

    await ctx.db.patch(articleId, {
      ...updates,
      updated_at: now,
    });
    return articleId;
  },
});

/**
 * Delete article.
 *
 * @param articleId - The article ID to delete
 */
export const deleteArticle = mutation({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.articleId);
  },
});

// ============================================
// WEBINARS
// ============================================

/**
 * List webinars for a workspace.
 *
 * @param workspaceId - The workspace ID
 * @returns Array of webinar documents ordered by scheduled date (newest first)
 */
export const listWebinars = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("webinars")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspaceId))
      .order("desc")
      .collect();
  },
});

/**
 * Get webinar by ID.
 *
 * @param webinarId - The webinar ID
 * @returns Webinar document or null if not found
 */
export const getWebinar = query({
  args: { webinarId: v.id("webinars") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.webinarId);
  },
});

/**
 * Get published webinar by workspace and slug (for public pages).
 *
 * @param workspaceId - The workspace ID
 * @param slug - The webinar slug
 * @returns Published webinar or null if not found
 */
export const getPublishedWebinar = query({
  args: { workspaceId: v.id("workspaces"), slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("webinars")
      .withIndex("by_workspace_slug", (q) =>
        q.eq("workspace_id", args.workspaceId).eq("slug", args.slug)
      )
      .filter((q) => q.eq(q.field("status"), "published"))
      .first();
  },
});

/**
 * Create webinar.
 *
 * @param workspaceId - The workspace ID
 * @param title - Webinar title
 * @param slug - Webinar slug (unique per workspace)
 * @param description - Optional description
 * @param cover_image_url - Optional cover image URL
 * @param scheduled_at - Scheduled date/time (timestamp)
 * @param duration_minutes - Duration in minutes (default: 60)
 * @param meeting_url - Optional meeting URL
 * @param max_registrations - Optional maximum registrations
 * @param status - Webinar status ('draft', 'published', 'completed', 'cancelled')
 * @returns The created webinar ID
 */
export const createWebinar = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    cover_image_url: v.optional(v.string()),
    scheduled_at: v.number(),
    duration_minutes: v.number(),
    meeting_url: v.optional(v.string()),
    max_registrations: v.optional(v.number()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("webinars", {
      workspace_id: args.workspaceId,
      title: args.title,
      slug: args.slug,
      description: args.description,
      cover_image_url: args.cover_image_url,
      scheduled_at: args.scheduled_at,
      duration_minutes: args.duration_minutes,
      meeting_url: args.meeting_url,
      max_registrations: args.max_registrations,
      status: args.status,
      published_at: args.status === "published" ? now : undefined,
      created_at: now,
      updated_at: now,
    });
  },
});

/**
 * Update webinar.
 *
 * @param webinarId - The webinar ID
 * @param title - Optional updated title
 * @param slug - Optional updated slug
 * @param description - Optional updated description
 * @param cover_image_url - Optional updated cover image URL
 * @param scheduled_at - Optional updated scheduled time
 * @param duration_minutes - Optional updated duration
 * @param meeting_url - Optional updated meeting URL
 * @param max_registrations - Optional updated max registrations
 * @param status - Optional updated status
 * @returns The webinar ID
 */
export const updateWebinar = mutation({
  args: {
    webinarId: v.id("webinars"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    cover_image_url: v.optional(v.string()),
    scheduled_at: v.optional(v.number()),
    duration_minutes: v.optional(v.number()),
    meeting_url: v.optional(v.string()),
    max_registrations: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { webinarId, ...updates } = args;
    const now = Date.now();

    // Set published_at if status changed to published
    const webinar = await ctx.db.get(webinarId);
    if (updates.status === "published" && webinar?.status !== "published") {
      updates.published_at = now;
    }

    await ctx.db.patch(webinarId, {
      ...updates,
      updated_at: now,
    });
    return webinarId;
  },
});

/**
 * Delete webinar.
 *
 * Note: Registrations should be manually deleted first or handled by
 * the application layer before calling this.
 *
 * @param webinarId - The webinar ID to delete
 */
export const deleteWebinar = mutation({
  args: { webinarId: v.id("webinars") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.webinarId);
  },
});

// ============================================
// WEBINAR REGISTRATIONS
// ============================================

/**
 * Register for webinar (public, no auth required).
 *
 * Checks for existing registration to prevent duplicates.
 *
 * @param webinarId - The webinar ID
 * @param contactId - The contact ID
 * @param workspaceId - The workspace ID
 * @returns The registration ID (existing or new)
 */
export const registerForWebinar = mutation({
  args: {
    webinarId: v.id("webinars"),
    contactId: v.id("contacts"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    // Check for existing registration
    const existing = await ctx.db
      .query("webinarRegistrations")
      .withIndex("by_webinar", (q) => q.eq("webinar_id", args.webinarId))
      .filter((q) => q.eq(q.field("contact_id"), args.contactId))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("webinarRegistrations", {
      webinar_id: args.webinarId,
      contact_id: args.contactId,
      workspace_id: args.workspaceId,
      registered_at: Date.now(),
      attended: false,
    });
  },
});

/**
 * Get registrations for a webinar.
 *
 * @param webinarId - The webinar ID
 * @returns Array of registration documents
 */
export const getWebinarRegistrations = query({
  args: { webinarId: v.id("webinars") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("webinarRegistrations")
      .withIndex("by_webinar", (q) => q.eq("webinar_id", args.webinarId))
      .collect();
  },
});

/**
 * Count registrations for a webinar.
 *
 * @param webinarId - The webinar ID
 * @returns Number of registrations
 */
export const countWebinarRegistrations = query({
  args: { webinarId: v.id("webinars") },
  handler: async (ctx, args) => {
    const registrations = await ctx.db
      .query("webinarRegistrations")
      .withIndex("by_webinar", (q) => q.eq("webinar_id", args.webinarId))
      .collect();

    return registrations.length;
  },
});

// ============================================
// PUBLIC MUTATIONS (for public webinar registration)
// ============================================

/**
 * Find or create contact by phone (PUBLIC - for webinar registration).
 *
 * This is used by the public webinar registration endpoint.
 * No authentication required.
 *
 * @param workspaceId - The workspace ID
 * @param phone - The phone number
 * @param name - Contact name
 * @param email - Optional email
 * @returns Contact ID (existing or newly created)
 */
export const findOrCreateContact = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    phone: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if contact exists
    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_workspace_phone", (q) =>
        q.eq("workspace_id", args.workspaceId).eq("phone", args.phone)
      )
      .first();

    if (existing) {
      // Update name/email if they were empty
      const updates: any = {};
      if (!existing.name && args.name) {
        updates.name = args.name;
      }
      if (!existing.email && args.email) {
        updates.email = args.email;
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existing._id, {
          ...updates,
          updated_at: Date.now(),
        });
      }

      return existing._id;
    }

    // Create new contact
    const now = Date.now();
    const contactId = await ctx.db.insert("contacts", {
      workspace_id: args.workspaceId,
      phone: args.phone,
      phone_normalized: args.phone, // Simple normalization for now
      name: args.name,
      kapso_name: undefined,
      email: args.email,
      lead_score: 50, // Default score for webinar registrations
      lead_status: "new",
      tags: ["webinar-lead"],
      assigned_to: undefined,
      source: "webinar_registration",
      metadata: {},
      cache_updated_at: undefined,
      created_at: now,
      updated_at: now,
      supabaseId: "", // No Supabase ID for new contacts
    });

    return contactId;
  },
});
