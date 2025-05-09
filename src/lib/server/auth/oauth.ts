import { GitHub, Google } from "arctic";
import { env } from '$env/dynamic/private';

export const github = new GitHub(
    env.GITHUB_CLIENT_ID,      // IDE shows type: string
    env.GITHUB_CLIENT_SECRET,  // IDE shows type: string
    env.GITHUB_CLIENT_REDIRECT_URI    // IDE shows type: string
);

export const google = new Google(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_CLIENT_REDIRECT_URI
);
