/**
 * Convert a number to Hindi (Devanagari) words using the Indian numbering system
 * (हज़ार / लाख / करोड़).
 *
 * Examples:
 *   3000  -> "तीन हज़ार"
 *   2575  -> "दो हज़ार पाँच सौ पचहत्तर"
 *   100000 -> "एक लाख"
 */

// 0–99 in Hindi (index 0 is empty so it can be skipped in composition)
const HINDI: string[] = [
  '', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ',
  'दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस',
  'बीस', 'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस',
  'तीस', 'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस',
  'चालीस', 'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास',
  'पचास', 'इक्यावन', 'बावन', 'तिरपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ',
  'साठ', 'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सड़सठ', 'अड़सठ', 'उनहत्तर',
  'सत्तर', 'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उन्यासी',
  'अस्सी', 'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी',
  'नब्बे', 'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे',
];

/** Convert 0–999 to Hindi words */
const belowThousand = (n: number): string => {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  let words = '';
  if (hundred) words += `${HINDI[hundred]} सौ`;
  if (rest) words += (words ? ' ' : '') + HINDI[rest];
  return words;
};

/**
 * Convert a whole number to Hindi words (Indian system). Returns "शून्य" for 0.
 */
export const numberToWords = (value: number): string => {
  let num = Math.floor(Math.abs(value));
  if (num === 0) return 'शून्य';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const rest = num; // 0–999

  const parts: string[] = [];
  if (crore) parts.push(`${numberToWords(crore)} करोड़`);
  if (lakh) parts.push(`${HINDI[lakh]} लाख`);
  if (thousand) parts.push(`${HINDI[thousand]} हज़ार`);
  if (rest) parts.push(belowThousand(rest));

  return parts.join(' ').trim();
};

/**
 * Format a rupee amount as Hindi words, e.g. 2575 -> "दो हज़ार पाँच सौ पचहत्तर रुपये मात्र".
 * Handles paise too: 2575.50 -> "... रुपये और पचास पैसे मात्र".
 */
export const numberToWordsRupees = (value: number | string): string => {
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  if (!amount || isNaN(amount) || amount <= 0) return 'शून्य रुपये मात्र';

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = `${numberToWords(rupees)} रुपये`;
  if (paise > 0) {
    result += ` और ${HINDI[paise]} पैसे`;
  }
  return `${result} मात्र`;
};

export default numberToWordsRupees;
