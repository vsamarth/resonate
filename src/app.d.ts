import type { FullSession } from '$lib/types/auth-session';

declare global {
	namespace App {
		interface Locals {
			session?: FullSession['session'];
			user?: FullSession['user'];
		}
	}
}

export {};
