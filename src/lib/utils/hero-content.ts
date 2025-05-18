/**
 * Parse hero tagline to add emphasis to the part after the dash
 * @param tagline The hero tagline text
 * @returns Formatted HTML with proper emphasis
 */
export function parseHeroTagline(tagline: string): string {
    // Find the part after the dash to emphasize
    const parts = tagline.split('—');

    if (parts.length < 2) {
        return tagline; // No dash found, return as is
    }

    const beforeDash = parts[0].trim();
    const afterDash = parts[1].trim();

    // Create HTML with emphasis on the part after the dash
    return `${beforeDash} — <span class="font-semibold not-italic text-primary">${afterDash}</span>`;
}

/**
 * Combines all hero content with proper formatting
 * @param title The hero title
 * @param description The hero description
 * @param emphasis The emphasized text
 * @param tagline The tagline with formatting
 * @returns Object with formatted content
 */
export function formatHeroContent(
    title: string,
    description: string,
    emphasis: string,
    tagline: string
) {
    return {
        title: title,
        description: description,
        emphasis: emphasis,
        tagline: parseHeroTagline(tagline)
    };
} 