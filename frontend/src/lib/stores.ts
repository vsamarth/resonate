import { writable } from 'svelte/store';
import type { User } from '$lib/types';

/** Set by layout from DB default; updated when user switches in Navbar. */
export const activeUser = writable<User | null>(null);
