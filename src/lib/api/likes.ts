const BASE = '/api';

export async function postArtistLike(userIdx: number, itemIdx: number): Promise<boolean> {
	const res = await fetch(`${BASE}/users/${userIdx}/likes`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify({ item_idx: itemIdx })
	});
	return res.ok;
}

export async function deleteArtistLike(userIdx: number, itemIdx: number): Promise<boolean> {
	const res = await fetch(`${BASE}/users/${userIdx}/likes/${itemIdx}`, {
		method: 'DELETE',
		credentials: 'include'
	});
	return res.ok;
}
