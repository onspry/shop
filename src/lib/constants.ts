/**
 * Authentication providers
 *
 * These values match the Prisma Provider enum but are defined separately
 * to maintain separation between UI and database layers.
 *
 * When using these values in server-side code that interacts with Prisma,
 * you may need to cast or map them to the Prisma Provider enum.
 */
export const Providers = {
    email: 'email',
    google: 'google',
    github: 'github',
    microsoft: 'microsoft',
    facebook: 'facebook'
} as const;

export type Provider = typeof Providers[keyof typeof Providers];