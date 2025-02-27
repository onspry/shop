import type { Config } from 'tailwindcss';

export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                foreground: 'hsl(var(--foreground))',
                background: 'hsl(var(--background))',
                // ... other colors
            }
        }
    },
    plugins: []
} satisfies Config; 