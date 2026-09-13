/**
 * Storage entry point. Metro resolves `./repository` to `repository.native.ts`
 * (expo-sqlite) on iOS/Android and to `repository.ts` (persisted JSON) on web.
 */
export { repository } from './repository';
export type * from './types';
