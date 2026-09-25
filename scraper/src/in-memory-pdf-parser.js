import { PDFParse } from 'pdf-parse';
import { KEYWORDS } from './keywords.js';
import { PROVINCES } from './province-extractor.js';

/**
 * Targeted Vee Rubber procurement keywords to look for inside BOQ / TOR / PR.4 / Attachments.
 * Merges master keywords list with specific tire specs, certifications, and sizes.
 */
const SPECIFIC_MATERIAL_KEYWORDS = [
  // 1. Car & Pickup Specifications
  'ยางเรเดียล', 'ยาง radial', 'ยางรถยนต์', 'ยางรถเก๋ง', 'ยางรถกระบะ', 'ยางรถตู้', 'ยางรถตรวจการณ์',
  '195/65r15', '205/55r16', '215/60r16', '215/55r17', '215/45r17', '225/65r17', '265/65r17', '265/60r18',
  '195r14c', '205/70r15', '215/70r15', '245/70r16', '265/70r16',
  // 2. Commercial Truck & Bus
  'ยางรถบรรทุก', '11r22.5', '12r22.5', '295/80r22.5', '315/80r22.5', '9.00r20', '10.00r20', '11.00r20',
  '8.25r16', '7.50r16', 'ยาง tbr', 'ยางผ้าใบรถบรรทุก', 'ยางรถดับเพลิง', 'ยางรถบรรทุกน้ำ', 'ยางรถขยะ',
  // 3. Motorcycle & Patrol
  'ยางรถจักรยานยนต์', 'ยางมอเตอร์ไซค์', 'ยางสายตรวจ', '70/90-17', '80/90-17', '90/90-14', '100/90-14',
  '110/70-12', '120/70-12', '130/70-12', '120/70-17', '160/60-17',
  // 4. OTR, Tractors & Heavy Machinery
  'ยาง otr', 'ยางเครื่องจักรกล', 'ยางรถแทรกเตอร์', 'ยางรถไถ', 'ยางรถตัก', 'ยางรถเกลี่ยดิน', 'ยางรถบด',
  'ยางรถยก', 'ยาง forklift', 'ยางตัน', 'ยางลมรถยก', '17.5-25', '20.5-25', '23.5-25', '14.00-24',
  // 5. Tubes, Flaps & Tire Services
  'ยางใน', 'ยางในบิวทิล', 'ยางในรถยนต์', 'ยางในรถบรรทุก', 'ยางในรถจักรยานยนต์', 'ยางรองคอด', 'rim flap', 'จุ๊บลม',
  'ถ่วงล้อ', 'ตั้งศูนย์ถ่วงล้อ', 'บริการเปลี่ยนยาง',
  // 6. Quality Certifications & Standards
  'มอก.', 'มอก. 2718', 'มอก. 2719', 'มอก. 2720', 'มอก. 1042', 'มอก. 887', 'tis', 'dot', 'ece', 'iatf 16949'
];

export const TARGET_SPEC_KEYWORDS = Array.from(new Set([...KEYWORDS, ...SPECIFIC_MATERIAL_KEYWORDS]));

/**
 * Scan a PDF binary array in memory without saving ANY file to disk.
 * 
 * @param {Uint8Array} uint8Data - Binary PDF data held strictly in RAM
 * @param {Array<string>} customKeywords - Optional override keywords
 * @returns {Promise<{ hasMatch: boolean, matchedKeywords: string[], summary: string, snippets: Array<{ keyword: string, page: number, snippet: string }> }>}
 */
export async function scanPdfBuffer(uint8Data, customKeywords = TARGET_SPEC_KEYWORDS) {
  if (!uint8Data || !(uint8Data instanceof Uint8Array)) {
    return { hasMatch: false, matchedKeywords: [], summary: '', snippets: [] };
  }

  let parser = null;
  try {
    parser = new PDFParse(uint8Data);
    const parsed = await parser.getText();
    const pages = parsed.pages || [];
    
    const matchedKeywordsSet = new Set();
    const snippets = [];

    // Scan each page for target keywords and extract contextual snippet
    pages.forEach((pageObj, pageIdx) => {
      const pageNum = pageIdx + 1;
      const pageText = pageObj.text || '';
      const lowerPage = pageText.toLowerCase();

      for (const kw of customKeywords) {
        const lowerKw = kw.toLowerCase();
        let searchIndex = 0;
        
        while ((searchIndex = lowerPage.indexOf(lowerKw, searchIndex)) !== -1) {
          matchedKeywordsSet.add(kw);
          
          // Extract sentence / line context (~40 chars before and after)
          const start = Math.max(0, searchIndex - 40);
          const end = Math.min(pageText.length, searchIndex + kw.length + 50);
          let rawSnippet = pageText.substring(start, end).replace(/\s+/g, ' ').trim();
          
          // Add ellipsis if truncated
          if (start > 0) rawSnippet = '...' + rawSnippet;
          if (end < pageText.length) rawSnippet = rawSnippet + '...';

          // Avoid duplicate snippets for the same keyword on the same page
          const isDuplicate = snippets.some(s => s.keyword === kw && s.page === pageNum);
          if (!isDuplicate) {
            snippets.push({
              keyword: kw,
              page: pageNum,
              snippet: rawSnippet
            });
          }

          searchIndex += kw.length + 1;
        }
      }
    });

    // Extract province from PDF header/cover if present
    let detectedProvince = null;
    for (let i = 0; i < Math.min(pages.length, 3); i++) {
      const pText = pages[i].text || '';
      const m = pText.match(/(?:จังหวัด|จ\.)\s*([ก-๙]+)/);
      if (m && m[1]) {
        const candidate = m[1].replace(/นคราชสีมา/, 'นครราชสีมา').trim();
        if (PROVINCES.includes(candidate)) {
          detectedProvince = candidate;
          break;
        }
      }
    }

    const matchedKeywords = Array.from(matchedKeywordsSet);
    const hasMatch = matchedKeywords.length > 0;

    let summary = '';
    if (hasMatch) {
      const topSnippet = snippets[0];
      summary = `พบสเปกยาง/อุปกรณ์ "${topSnippet.keyword.toUpperCase()}" ที่หน้า ${topSnippet.page} ("${topSnippet.snippet.slice(0, 70)}")`;
    }

    return {
      hasMatch,
      matchedKeywords,
      summary,
      detectedProvince,
      snippets: snippets.slice(0, 8) // Limit to top 8 findings to keep payload lightweight
    };

  } catch (err) {
    console.error('[Vee Rubber In-Memory PDF Scanner] Error during PDF buffer scan:', err.message);
    return { hasMatch: false, matchedKeywords: [], summary: '', snippets: [], error: err.message };
  } finally {
    // Explicitly release resources from RAM
    if (parser && typeof parser.destroy === 'function') {
      try {
        await parser.destroy();
      } catch (e) {
        // Ignore destruction errors
      }
    }
    parser = null;
  }
}
