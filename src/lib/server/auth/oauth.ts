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

// Facebook OAuth2 implementation
export class FacebookOAuth2 {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    authBase = 'https://www.facebook.com/v18.0/dialog/oauth';
    tokenBase = 'https://graph.facebook.com/v18.0/oauth/access_token';

    constructor(clientId: string, clientSecret: string, redirectUri: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
    }

    createAuthorizationURL(state: string, scope: string[] = ["email", "public_profile"]): URL {
        const url = new URL(this.authBase);
        url.searchParams.set('client_id', this.clientId);
        url.searchParams.set('redirect_uri', this.redirectUri);
        url.searchParams.set('state', state);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', scope.join(','));
        return url;
    }

    async exchangeCodeForToken(code: string): Promise<{ access_token: string; token_type: string; expires_in: number }> {
        const url = new URL(this.tokenBase);
        url.searchParams.set('client_id', this.clientId);
        url.searchParams.set('redirect_uri', this.redirectUri);
        url.searchParams.set('client_secret', this.clientSecret);
        url.searchParams.set('code', code);
        const res = await fetch(url.toString(), { method: 'GET' });
        if (!res.ok) throw new Error('Failed to exchange code for token');
        return res.json();
    }
}

export const facebook = new FacebookOAuth2(
    env.FACEBOOK_CLIENT_ID,
    env.FACEBOOK_CLIENT_SECRET,
    env.FACEBOOK_CLIENT_REDIRECT_URI
);

// Microsoft OAuth2 implementation
export class MicrosoftOAuth2 {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    redirectUri: string;
    authBase: string;
    tokenBase: string;

    constructor(clientId: string, clientSecret: string, tenantId: string, redirectUri: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tenantId = tenantId;
        this.redirectUri = redirectUri;
        this.authBase = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;
        this.tokenBase = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    }

    createAuthorizationURL(state: string, scope: string[] = [
        "openid", "email", "profile", "User.Read"
    ]): URL {
        const url = new URL(this.authBase);
        url.searchParams.set('client_id', this.clientId);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('redirect_uri', this.redirectUri);
        url.searchParams.set('response_mode', 'query');
        url.searchParams.set('scope', scope.join(' '));
        url.searchParams.set('state', state);
        return url;
    }

    async exchangeCodeForToken(code: string): Promise<{
        access_token: string;
        token_type: string;
        expires_in: number;
        scope: string;
        id_token?: string;
        refresh_token?: string;
    }> {
        const params = new URLSearchParams();
        params.set('client_id', this.clientId);
        params.set('scope', 'openid email profile User.Read');
        params.set('code', code);
        params.set('redirect_uri', this.redirectUri);
        params.set('grant_type', 'authorization_code');
        params.set('client_secret', this.clientSecret);
        const res = await fetch(this.tokenBase, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        if (!res.ok) throw new Error('Failed to exchange code for token');
        return res.json();
    }
}

export const microsoft = new MicrosoftOAuth2(
    env.MS_GRAPH_CLIENT_ID,
    env.MS_GRAPH_CLIENT_SECRET,
    env.MS_GRAPH_TENANT_ID,
    env.MS_GRAPH_REDIRECT_URI
);
