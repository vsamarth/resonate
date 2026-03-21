/**
 * Shape of `auth.api.getSession()` for `App.Locals` (avoid importing `$lib/server/auth` from app.d.ts).
 */
export type FullSession = {
	session: {
		id: string;
		createdAt: Date;
		updatedAt: Date;
		userId: string;
		expiresAt: Date;
		token: string;
		ipAddress?: string | null;
		userAgent?: string | null;
	};
	user: {
		id: string;
		createdAt: Date;
		updatedAt: Date;
		email: string;
		emailVerified: boolean;
		name: string;
		image?: string | null;
		resonateUserIdx?: number;
	};
};
