import { MSGraphMailService } from './ms-graph';

export async function sendEmail(
    to: string | string[],
    subject: string,
    body: string,
    options: {
        from?: 'noreply' | 'support';
        replyTo?: string;
    } = {}
) {
    const emailService = MSGraphMailService.getInstance();
    const toAddresses = Array.isArray(to) ? to : [to];

    try {
        await emailService.sendMail({
            to: toAddresses,
            subject,
            body,
            from: options.from,
            replyTo: options.replyTo
        });
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
} 