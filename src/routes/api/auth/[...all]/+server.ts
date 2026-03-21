import { auth } from '$lib/server/auth';
import type { RequestHandler } from '@sveltejs/kit';

const serve: RequestHandler = ({ request }) => auth.handler(request);

export const GET = serve;
export const POST = serve;
