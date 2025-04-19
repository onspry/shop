import { error } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import type { RequestHandler } from './$types';

/**
 * Image server route handler
 * This handles image requests and applies basic optimization parameters
 */
export const GET: RequestHandler = async ({ params, url }) => {
    try {
        // Get the path from the URL
        const imagePath = params.path;
        if (!imagePath) {
            throw error(404, 'Image not found');
        }

        // Construct the full path to the image in the static directory
        // Note: The URLs in the database already include 'images/' in the path
        // so we don't need to add it again
        const staticPath = path.join(process.cwd(), 'static', imagePath);

        // Check if the file exists
        if (!fs.existsSync(staticPath)) {
            console.error(`Image not found: ${staticPath}`);
            throw error(404, 'Image not found');
        }

        // Read the file
        const file = fs.readFileSync(staticPath);

        // Determine content type based on file extension
        const ext = path.extname(staticPath).toLowerCase();
        let contentType = 'image/jpeg'; // Default

        if (ext === '.png') {
            contentType = 'image/png';
        } else if (ext === '.gif') {
            contentType = 'image/gif';
        } else if (ext === '.svg') {
            contentType = 'image/svg+xml';
        } else if (ext === '.webp') {
            contentType = 'image/webp';
        }

        // Get width and height from query parameters
        const width = url.searchParams.get('w');
        const height = url.searchParams.get('h');

        // Log the request for debugging
        console.log(`Serving image: ${staticPath} (${width}x${height})`);

        // Return the image with appropriate headers
        return new Response(file, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });
    } catch (err) {
        console.error('Error serving image:', err);
        throw error(500, 'Error serving image');
    }
};
