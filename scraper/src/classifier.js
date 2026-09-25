import { classifyAnnouncement } from './keywords.js';

/**
 * Filter announcements and tag them with product groups based on keywords
 * @param {Array} announcements - Array of announcement objects
 * @returns {Array} Filtered and tagged announcements
 */
export function classifyAndFilter(announcements) {
  const filtered = [];

  for (const ann of announcements) {
    const classifications = classifyAnnouncement(ann.title);
    
    // If it matches at least one keyword/group, keep it
    if (classifications.length > 0) {
      // Create a tagged copy
      const taggedAnn = {
        ...ann,
        product_groups: classifications.map(c => c.group),
        matched_keywords: classifications.flatMap(c => c.matchedKeywords)
      };
      
      filtered.push(taggedAnn);
    }
  }

  return filtered;
}
