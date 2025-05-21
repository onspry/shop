import { describe, it, expect } from 'vitest';
import { parseStructuredContent } from './content-parser';

describe('parseStructuredContent', () => {
    it('should extract title, intro and sections correctly', () => {
        const html = `
            <h1>Main Title</h1>
            <p>This is an introduction paragraph.</p>
            <h2>Section 1</h2>
            <p>Content for section 1.</p>
            <h2>Section 2</h2>
            <p>Content for section 2.</p>
        `;

        const result = parseStructuredContent(html);

        expect(result.title).toBe('Main Title');
        expect(result.intro).toContain('This is an introduction paragraph');
        expect(result.sections.length).toBe(2);
        expect(result.sections[0].title).toBe('Section 1');
        expect(result.sections[1].title).toBe('Section 2');
    });

    it('should handle nested sections properly', () => {
        const html = `
            <h1>Nested Sections Test</h1>
            <p>Top level introduction.</p>
            <h2>Top Level Section</h2>
            <p>Content for top level.</p>
            <h3>Nested Section Level 3</h3>
            <p>Content for level 3.</p>
            <h4>Deeply Nested Section</h4>
            <p>Content for level 4.</p>
            <h3>Another Level 3 Section</h3>
            <p>More content at level 3.</p>
            <h2>Second Top Level</h2>
            <p>Content for second top level.</p>
        `;

        const result = parseStructuredContent(html);

        // Basic structure checks
        expect(result.title).toBe('Nested Sections Test');
        expect(result.sections.length).toBe(2);

        // Check first top-level section
        const firstTopLevel = result.sections[0];
        expect(firstTopLevel.title).toBe('Top Level Section');
        expect(firstTopLevel.level).toBe(2);
        expect(firstTopLevel.children.length).toBe(2);

        // Check nested level 3 section
        const level3Section = firstTopLevel.children[0];
        expect(level3Section.title).toBe('Nested Section Level 3');
        expect(level3Section.level).toBe(3);
        expect(level3Section.children.length).toBe(1);

        // Check deeply nested level 4 section
        const level4Section = level3Section.children[0];
        expect(level4Section.title).toBe('Deeply Nested Section');
        expect(level4Section.level).toBe(4);

        // Check second level 3 section
        const secondLevel3 = firstTopLevel.children[1];
        expect(secondLevel3.title).toBe('Another Level 3 Section');
        expect(secondLevel3.level).toBe(3);

        // Check second top-level section
        const secondTopLevel = result.sections[1];
        expect(secondTopLevel.title).toBe('Second Top Level');
        expect(secondTopLevel.level).toBe(2);
    });

    it('should handle link localization and URL conversion', () => {
        const html = `
            <h1>Link Handling Test</h1>
            <p>This is a link: https://example.com and a <a href="/internal/path">internal link</a>.</p>
            <h2>Section with Links</h2>
            <p>Another external link www.test.com and an <a href="/products/123">internal product link</a>.</p>
        `;

        const result = parseStructuredContent(html);

        // Check link conversion in intro
        expect(result.intro).toContain('<a href="https://example.com"');
        expect(result.intro).toContain('<a href="/internal/path">');

        // Check link conversion in sections
        expect(result.sections[0].content).toContain('<a href="https://www.test.com"');
        expect(result.sections[0].content).toContain('<a href="/products/123">');
    });
}); 