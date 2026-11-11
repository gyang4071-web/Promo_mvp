// Vercel Functions: POST /api/upload-url
import { handleUploadUrl } from '../server/upload-url.js';

export function POST(request) {
  return handleUploadUrl(request, process.env);
}
