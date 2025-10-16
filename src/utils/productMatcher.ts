/**
 * Product Matcher Utility
 * Provides smart matching functionality for products, subcategories, and companies
 * with scoring system to find best matches
 */

interface MatchResult {
  value: string;
  score: number;
  originalInput: string;
}

/**
 * Calculate similarity score between two strings
 * Returns a score between 0 and 1 where 1 is a perfect match
 */
function calculateSimilarity(input: string, target: string): number {
  const normalizedInput = normalizeText(input);
  const normalizedTarget = normalizeText(target);
  
  // Exact match
  if (normalizedInput === normalizedTarget) {
    return 1.0;
  }
  
  // Contains match (full word)
  if (normalizedTarget.includes(normalizedInput)) {
    return 0.9;
  }
  
  if (normalizedInput.includes(normalizedTarget)) {
    return 0.85;
  }
  
  // Split into words and check word matching
  const inputWords = normalizedInput.split(/\s+/);
  const targetWords = normalizedTarget.split(/\s+/);
  
  let matchingWords = 0;
  for (const inputWord of inputWords) {
    for (const targetWord of targetWords) {
      if (inputWord === targetWord || inputWord.includes(targetWord) || targetWord.includes(inputWord)) {
        matchingWords++;
        break;
      }
    }
  }
  
  const wordMatchScore = matchingWords / Math.max(inputWords.length, targetWords.length);
  
  // Character-level similarity (Levenshtein-like simple approach)
  const charScore = calculateCharacterSimilarity(normalizedInput, normalizedTarget);
  
  // Weighted combination
  return wordMatchScore * 0.6 + charScore * 0.4;
}

/**
 * Calculate character-level similarity
 */
function calculateCharacterSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      matches++;
    }
  }
  
  return matches / longer.length;
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['"״׳]/g, '') // Remove quotes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Match category with scoring
 */
export function matchCategory(
  input: string,
  availableCategories: string[],
  threshold: number = 0.5
): string {
  if (!input || input.trim() === '') {
    console.log('⚠️ Category matching: Empty input, returning empty string');
    return '';
  }
  
  const results: MatchResult[] = availableCategories.map(category => ({
    value: category,
    score: calculateSimilarity(input, category),
    originalInput: input
  }));
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  const bestMatch = results[0];
  
  if (bestMatch && bestMatch.score >= threshold) {
    console.log(`✅ Category matched: "${input}" → "${bestMatch.value}" (score: ${bestMatch.score.toFixed(2)})`);
    return bestMatch.value;
  }
  
  console.log(`⚠️ Category matching: No match found for "${input}" (best score: ${bestMatch?.score.toFixed(2) || 0}), keeping original`);
  return input; // Keep original if no good match found
}

/**
 * Match subcategory with scoring
 */
export function matchSubCategory(
  input: string,
  availableSubCategories: string[],
  threshold: number = 0.5
): string {
  if (!input || input.trim() === '') {
    console.log('⚠️ SubCategory matching: Empty input, defaulting to "מסלול כללי"');
    return 'מסלול כללי';
  }
  
  const results: MatchResult[] = availableSubCategories.map(subCategory => ({
    value: subCategory,
    score: calculateSimilarity(input, subCategory),
    originalInput: input
  }));
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  const bestMatch = results[0];
  
  if (bestMatch && bestMatch.score >= threshold) {
    console.log(`✅ SubCategory matched: "${input}" → "${bestMatch.value}" (score: ${bestMatch.score.toFixed(2)})`);
    return bestMatch.value;
  }
  
  // If no match and input looks generic, default to "מסלול כללי"
  const genericTerms = ['כללי', 'רגיל', 'סטנדרטי', 'בסיסי'];
  if (genericTerms.some(term => normalizeText(input).includes(term))) {
    console.log(`⚠️ SubCategory matching: "${input}" seems generic, defaulting to "מסלול כללי"`);
    return 'מסלול כללי';
  }
  
  console.log(`⚠️ SubCategory matching: No match found for "${input}" (best score: ${bestMatch?.score.toFixed(2) || 0}), keeping original`);
  return input; // Keep original if no good match found
}

/**
 * Match company with scoring
 */
export function matchCompany(
  input: string,
  availableCompanies: string[],
  threshold: number = 0.5
): string {
  if (!input || input.trim() === '') {
    console.log('⚠️ Company matching: Empty input, returning empty string');
    return '';
  }
  
  const results: MatchResult[] = availableCompanies.map(company => ({
    value: company,
    score: calculateSimilarity(input, company),
    originalInput: input
  }));
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  const bestMatch = results[0];
  
  if (bestMatch && bestMatch.score >= threshold) {
    console.log(`✅ Company matched: "${input}" → "${bestMatch.value}" (score: ${bestMatch.score.toFixed(2)})`);
    return bestMatch.value;
  }
  
  console.log(`⚠️ Company matching: No match found for "${input}" (best score: ${bestMatch?.score.toFixed(2) || 0}), keeping original`);
  return input; // Keep original if no good match found
}

/**
 * Batch match multiple products at once
 */
export function batchMatchProducts(
  products: Array<{
    category?: string;
    subCategory?: string;
    company?: string;
  }>,
  taxonomy: {
    categories: string[];
    subCategories: string[];
    companies: string[];
  }
) {
  return products.map(product => ({
    ...product,
    category: product.category ? matchCategory(product.category, taxonomy.categories) : '',
    subCategory: product.subCategory ? matchSubCategory(product.subCategory, taxonomy.subCategories) : 'מסלול כללי',
    company: product.company ? matchCompany(product.company, taxonomy.companies) : ''
  }));
}
