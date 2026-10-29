// Vercel Functions: POST /api/submit
import { handleSubmit } from '../server/submit.js';

export function POST(request) {
  return handleSubmit(request, process.env);
}
