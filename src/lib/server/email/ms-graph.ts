import { env } from '$env/dynamic/private';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

interface EmailOptions {
    to: string[];
    subject: string;
    body: string;
    from?: 'noreply' | 'support';
    replyTo?: string;
}

export class MSGraphMailService {
    private client: Client;
    private static instance: MSGraphMailService;

    private constructor() {
        const credential = new ClientSecretCredential(
            env.MS_GRAPH_TENANT_ID,
            env.MS_GRAPH_CLIENT_ID,
            env.MS_GRAPH_CLIENT_SECRET
        );

        const authProvider = new TokenCredentialAuthenticationProvider(credential, {
            scopes: ['https://graph.microsoft.com/.default']
        });

        this.client = Client.initWithMiddleware({
            authProvider
        });
    }

    public static getInstance(): MSGraphMailService {
        if (!MSGraphMailService.instance) {
            MSGraphMailService.instance = new MSGraphMailService();
        }
        return MSGraphMailService.instance;
    }

    async sendMail({
        to,
        subject,
        body,
        from = 'noreply',
        replyTo
    }: EmailOptions): Promise<void> {
        const fromAddress = from === 'noreply' ?
            'noreply@loptech.cloud' :
            'support@loptech.cloud';

        const message = {
            subject,
            body: {
                contentType: 'HTML',
                content: body
            },
            toRecipients: to.map(email => ({
                emailAddress: { address: email }
            })),
            from: {
                emailAddress: { address: fromAddress }
            },
            ...(replyTo && {
                replyTo: [{
                    emailAddress: { address: replyTo }
                }]
            })
        };

        try {
            await this.client.api('/users/noreply@loptech.cloud/sendMail')
                .post({ message });
        } catch (error) {
            console.error('Failed to send email:', error);
            throw new Error('Failed to send email');
        }
    }
} 