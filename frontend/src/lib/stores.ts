import { writable } from 'svelte/store';
import { users } from '$lib/data/users';

export const activeUser = writable(users[0]);
