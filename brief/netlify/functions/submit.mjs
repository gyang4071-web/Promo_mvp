// Netlify Functions: POST /api/submit
import { handleSubmit } from '../../server/submit.js';

export default (request) => handleSubmit(request, process.env);

export const config = { path: '/api/submit' };
