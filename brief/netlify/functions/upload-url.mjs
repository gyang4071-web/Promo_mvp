// Netlify Functions: POST /api/upload-url
import { handleUploadUrl } from '../../server/upload-url.js';

export default (request) => handleUploadUrl(request, process.env);

export const config = { path: '/api/upload-url' };
