export function validateVerificationCode(code: unknown): code is string {
    console.log('Validating code:', code);
    return typeof code === 'string' && /^[A-Z0-9]{8}$/.test(code);
} 