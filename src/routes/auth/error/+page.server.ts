import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
    return {
        error: url.searchParams.get('error'),
        email: url.searchParams.get('email'),
        provider: url.searchParams.get('provider'),
        attemptedProvider: url.searchParams.get('attempted_provider')
    };
}; 