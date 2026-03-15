import { writable } from 'svelte/store';
import type { User } from '$lib/types';

/** Set by layout from DB default; updated when user switches in Navbar. */
export const activeUser = writable<User | null>(null);

/** Simple toast notifications */
let nextId = 0;
const AUTO_DISMISS_MS = 3_500;

export const toastMessages = writable<{ id: number; message: string }[]>([]);

export const toastStore = {
	show(message: string) {
		const id = ++nextId;
		toastMessages.update((list) => [...list, { id, message }]);
		setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
		return id;
	},
	dismiss(id: number) {
		toastMessages.update((list) => list.filter((t) => t.id !== id));
	}
};
