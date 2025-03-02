import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
    // locals.user is specific to this request/user session
    return {
        user: locals.user
    };
}; 