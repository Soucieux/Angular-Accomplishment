/*
 * Backup configuration.
 *
 * COLLECTIONS mirrors the DATABASE_* collection names in
 * src/app/common/constants.ts. This is standalone Node tooling and cannot import
 * the Angular TypeScript constants, so the names are duplicated here — keep the
 * two lists in sync when a collection is added or renamed.
 *
 * The Firebase-only `preferences` node is intentionally excluded: it does not
 * exist in CloudBase.
 */
const COLLECTIONS = [
	'history',
	'movies',
	'recipes',
	'patch_notes',
	'release_notes',
	'quotes',
	'date_calculator',
	'debt_sonata',
	'reminder',
	'statistics',
	'users',
	'useful_links',
	'vault'
];

/* CloudBase caps a single query at 1000 documents; 1000 minimises round-trips
   while staying within the limit. */
const PAGE_SIZE = 1000;

/* All backup data is written under this root node, never at the top level, so
   the tooling can never overwrite a live-serving collection node — even if it is
   accidentally pointed at the app's Firebase project instead of a dedicated
   backup project. The restore reads from the same root. */
const BACKUP_ROOT = 'backup';

module.exports = { COLLECTIONS, PAGE_SIZE, BACKUP_ROOT };
