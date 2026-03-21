import { invalidateAll } from '$app/navigation';
import type { User } from '$lib/types';
import { activeUser } from '$lib/stores';
import { toastStore } from '$lib/stores';

export async function impersonateAsUser(userIdx: number, displayName: string): Promise<User> {
	const res = await fetch('/api/session/impersonate', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ userIdx }),
		credentials: 'include'
	});
	if (!res.ok) {
		const t = await res.text();
		throw new Error(t || res.statusText);
	}
	const data = (await res.json()) as { user: User };
	activeUser.set(data.user);
	toastStore.show(`Now listening as ${displayName}`);
	await invalidateAll();
	return data.user;
}
