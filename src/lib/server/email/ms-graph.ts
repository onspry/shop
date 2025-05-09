import { env } from '$env/dynamic/private';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';
import { readFileSync } from 'fs';

// Add debugging logs to verify environment variables
console.log('[SERVER] MS Graph environment variables check:');
console.log('- MS_GRAPH_TENANT_ID exists:', !!env.MS_GRAPH_TENANT_ID);
console.log('- MS_GRAPH_CLIENT_ID exists:', !!env.MS_GRAPH_CLIENT_ID);
console.log('- MS_GRAPH_CLIENT_SECRET exists:', !!env.MS_GRAPH_CLIENT_SECRET);

interface EmailOptions {
    to: string[];
    subject: string;
    body: string;
    from?: 'noreply' | 'support';
    replyTo?: string;
    attachments?: Array<{
        filename: string;
        path: string;
        cid?: string;
    }>;
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
        replyTo,
        attachments
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
            }),
            ...(attachments && {
                attachments: attachments.map(attachment => {
                    const fileBuffer = readFileSync(attachment.path);
                    return {
                        '@odata.type': '#microsoft.graph.fileAttachment',
                        name: attachment.filename,
                        contentBytes: fileBuffer.toString('base64'),
                        contentId: attachment.cid,
                        isInline: true,
                        contentType: 'image/svg+xml'
                    };
                })
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