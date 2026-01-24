/**
 * Convex file storage functions.
 *
 * Handles file uploads, retrieval, and deletion for the application.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generate an upload URL for file upload.
 *
 * Client uploads file to this URL, then gets back a storage ID.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get the serving URL for a stored file.
 *
 * @param storageId - The storage ID returned from upload
 * @returns The public URL to access the file
 */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

/**
 * Delete a file from storage.
 *
 * @param storageId - The storage ID to delete
 */
export const deleteById = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    await ctx.storage.delete(storageId);
  },
});
