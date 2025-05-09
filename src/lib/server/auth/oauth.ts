import { GitHub } from "arctic";
import { env } from '$env/dynamic/private';

// Add debugging logs to verify environment variables
console.log('[SERVER] GitHub environment variables check:');
console.log('- GITHUB_CLIENT_ID exists:', !!env.GITHUB_CLIENT_ID);
console.log('- GITHUB_CLIENT_SECRET exists:', !!env.GITHUB_CLIENT_SECRET);
console.log('- GITHUB_REDIRECT_URI exists:', !!env.GITHUB_REDIRECT_URI);
console.log('- GITHUB_REDIRECT_URI value:', env.GITHUB_REDIRECT_URI);

export const github = new GitHub(
    env.GITHUB_CLIENT_ID,      // IDE shows type: string
    env.GITHUB_CLIENT_SECRET,  // IDE shows type: string
    env.GITHUB_REDIRECT_URI    // IDE shows type: string
);
