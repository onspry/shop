/**
 * Calculate password strength on a scale of 0-100
 */
export function getPasswordStrength(password: string): number {
    if (!password) return 0;

    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 25;

    // Character type checks
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;

    return strength;
}

/**
 * Get user-friendly text description of password strength
 */
export function getPasswordStrengthText(strength: number): string {
    if (strength === 0) return 'Enter a password';
    if (strength < 50) return 'Weak';
    if (strength < 100) return 'Medium';
    return 'Strong';
}

/**
 * Get CSS class for password strength indicator
 */
export function getPasswordStrengthColor(strength: number): string {
    if (strength === 0) return 'bg-gray-200';
    if (strength < 50) return 'bg-red-500';
    if (strength < 100) return 'bg-yellow-500';
    return 'bg-green-500';
} 