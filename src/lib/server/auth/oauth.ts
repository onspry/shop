import { GitHub } from "arctic";
import { env } from '$env/dynamic/private';

export const github = new GitHub(
    env.GITHUB_CLIENT_ID,      // IDE shows type: string
    env.GITHUB_CLIENT_SECRET,  // IDE shows type: string
    env.GITHUB_REDIRECT_URI    // IDE shows type: string
);
