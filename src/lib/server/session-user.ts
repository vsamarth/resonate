/** Resolve Resonate `user_idx` from Better Auth user (additional field or synthetic email). */
export function getResonateUserIdx(user: {
	email: string;
	resonateUserIdx?: number | null;
}): number | null {
	if (typeof user.resonateUserIdx === 'number') {
		return user.resonateUserIdx;
	}
	const m = /^profile\+(\d+)@example\.com$/i.exec(user.email);
	return m ? Number(m[1]) : null;
}
