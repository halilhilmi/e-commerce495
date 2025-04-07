import { logInfo, logError } from './logger';

// Email functionality is disabled.
logInfo("Email functionality is currently disabled in src/utils/email.ts.");

interface MailOptions {
    to: string; 
    subject: string; 
    text?: string; 
    html?: string; 
}

// Function kept for compatibility, but does nothing.
export const sendEmail = async (options: MailOptions): Promise<boolean> => {
    logError('Attempted to call sendEmail, but email functionality is disabled.');
    return false;
}; 