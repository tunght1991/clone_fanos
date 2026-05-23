export const CONTENT_STATUSES = ['draft', 'published', 'unpublished', 'archived'];
export const CHAPTER_STATUSES = ['draft', 'ready', 'published', 'archived'];
export function isNarratorRoleIndexValid(roleIndex) {
  return Number.isInteger(roleIndex) && roleIndex >= 1 && roleIndex <= 3;
}
