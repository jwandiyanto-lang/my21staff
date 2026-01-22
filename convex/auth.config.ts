// @ts-nocheck - Schema mismatch, will fix later
import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      type: "customJwt",
      // Extract project name from NEXT_PUBLIC_SUPABASE_URL
      // URL format: https://[PROJECT-REF].supabase.co
      applicationID:
        process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0] ||
        "",
      issuer: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
      jwks: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/.well-known/jwks.json`,
      algorithm: "RS256",
    },
  ],
} satisfies AuthConfig;
