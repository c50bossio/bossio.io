import { auth } from "@/lib/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";
import { withRateLimit } from "@/lib/with-rate-limit";

// Get the original handlers
const { POST: originalPOST, GET: originalGET } = toNextJsHandler(auth);

// Apply rate limiting to auth endpoints (5 requests per minute)
export const POST = withRateLimit(originalPOST, { type: 'auth' });
export const GET = withRateLimit(originalGET, { type: 'auth' });
