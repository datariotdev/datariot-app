/**
 * Safely encodes a video URL for compatibility with native players (especially iOS).
 * Handles Cyrillic and other non-ASCII characters in the path and query.
 */
export function encodeVideoUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    // Skip encoding for local files (file://, assets-library://) 
    // and data URIs which should be used as-is.
    if (url.startsWith('file:') || url.startsWith('content:') || url.startsWith('assets-library:') || url.startsWith('data:')) {
        return url;
    }

    // If the URL already looks encoded (contains % followed by hex), 
    // we should be careful not to double-encode.
    // However, for simplicity and reliability, we'll parse and re-encode.

    try {
        // Use a regex-based approach if URL constructor behaves unexpectedly in some RN environments,
        // but URL is generally stable in modern Expo/RN.
        const urlObj = new URL(url);

        // Encode each segment of the path individually
        const pathSegments = urlObj.pathname.split('/');
        const encodedPath = pathSegments
            .map(segment => encodeURIComponent(decodeURIComponent(segment)))
            .join('/');

        // URL components
        const protocol = urlObj.protocol; // includes ':'
        const host = urlObj.host;
        const search = urlObj.search;
        const hash = urlObj.hash;

        // Reconstruct carefully to avoid double slashes
        // urlObj.host does NOT include trailing slash.
        // encodedPath starts with '/' because pathname starts with '/'.
        let result = `${protocol}//${host}${encodedPath}`;

        if (search) result += search;
        if (hash) result += hash;

        return result;
    } catch (e) {
        console.warn('[encodeVideoUrl] URL parsing failed, falling back to encodeURI:', e);
        try {
            return encodeURI(decodeURIComponent(url));
        } catch {
            return encodeURI(url);
        }
    }
}
