/**
 * Parse winner information from RSS description field
 * @param {string} description - RSS description field
 * @param {number} budget - Optional budget to calculate discount
 */
export function parseWinnerInfo(description, budget = null) {
  if (!description) return null;

  const result = {
    winner_name: null,
    winner_price: null,
    winner_tax_id: null,
    discount_percent: null
  };

  // Extract winner name (ผู้ชนะการเสนอราคา/ผู้ได้รับการคัดเลือก)
  const nameMatch = description.match(/(?:ผู้ชนะการเสนอราคา|ผู้ได้รับการคัดเลือก)\s*(?:ได้แก่)?\s*([^(\n\r]+)/);
  if (nameMatch) {
    result.winner_name = nameMatch[1].trim();
  }

  // Extract tax ID (เลขประจำตัวผู้เสียภาษี)
  const taxMatch = description.match(/(?:เลขประจำตัวผู้เสียภาษีอากร|เลขประจำตัวผู้เสียภาษี)\s*(\d{13})/);
  if (taxMatch) {
    result.winner_tax_id = taxMatch[1].trim();
  }

  // Extract winner price (เป็นเงินทั้งสิ้น/ราคาที่เสนอ)
  const priceMatch = description.match(/(?:เป็นเงินทั้งสิ้น|ราคาที่เสนอ)\s*([\d,]+(?:\.\d{2})?)/);
  if (priceMatch) {
    // Remove commas and convert to float
    result.winner_price = parseFloat(priceMatch[1].replace(/,/g, ''));
  }

  // Calculate discount percentage if budget and price are available
  if (budget && result.winner_price) {
    const discountAmount = budget - result.winner_price;
    if (discountAmount > 0) {
      result.discount_percent = (discountAmount / budget) * 100;
      // Round to 2 decimal places
      result.discount_percent = Math.round(result.discount_percent * 100) / 100;
    } else {
      result.discount_percent = 0;
    }
  }

  return result;
}
