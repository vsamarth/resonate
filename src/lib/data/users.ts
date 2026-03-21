/**
 * Users are loaded from the database via:
 * - Layout: getUsersWithProfiles(20), getUserWithTopArtists(0) for default
 * - API: GET /api/users, GET /api/users/[userIdx]
 * - Server: $lib/server/users.ts
 *
 * Use the layout data (data.users, data.defaultUser) or fetch from /api/users.
 */
