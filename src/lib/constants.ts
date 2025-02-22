export const Providers = {
    email: 'email',
    microsoft: 'microsoft',
    google: 'google',
    github: 'github',
    facebook: 'facebook'
} as const;

export type Provider = typeof Providers[keyof typeof Providers]; 