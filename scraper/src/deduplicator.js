/**
 * Deduplicator Module
 * Removes duplicate announcements based on ID.
 */

export function deduplicate(announcements) {
  const seenIds = new Set();
  const uniqueAnnouncements = [];
  let duplicateCount = 0;

  for (const item of announcements) {
    if (seenIds.has(item.id)) {
      duplicateCount++;
    } else {
      seenIds.add(item.id);
      uniqueAnnouncements.push(item);
    }
  }

  console.log(`[Deduplicator] Removed ${duplicateCount} duplicate items. Unique items: ${uniqueAnnouncements.length}`);
  return uniqueAnnouncements;
}
