import * as XLSX from 'xlsx';

// Map exposure field names to SelectedProduct fields based on the image
export interface ExposureMapping {
  exposureStocks?: number;  // e - חשיפה למניות
  exposureBonds?: number;  // Will be calculated from other fields
  exposureForeignCurrency?: number;  // g - חשיפה למט"ח
  exposureForeignInvestments?: number;  // f - חשיפה לחו"ל
  exposureIsrael?: number;  // Will be calculated
  exposureIlliquidAssets?: number;  // k - נכסים לא סחירים
}

/**
 * Find product link from Excel file based on category and product name
 */
export async function findProductLink(
  category: string,
  productName: string
): Promise<string | null> {
  try {
    const response = await fetch('/src/data/product_exposure_links.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Map category to sheet name
    const sheetMapping: Record<string, string> = {
      'קרן השתלמות': 'קרן השתלמות',
      'קופת גמל': 'קופת גמל',
      'גמל להשקעה': 'גמל להשקעה',
      'חסכון פנסיוני': 'חסכון פנסיוני',
      'פנסיה': 'חסכון פנסיוני',
      'קופת גמל להשקעה': 'גמל להשקעה',
    };

    const sheetName = sheetMapping[category] || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      console.error(`Sheet not found for category: ${category}`);
      return null;
    }

    // Convert to JSON to search
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Search for product name in second column (index 1)
    // Normalize search by removing special characters and spaces
    const normalizedSearch = normalizeProductName(productName);

    for (const row of data) {
      if (row.length >= 2) {
        const rowProductName = String(row[1] || '');
        const normalizedRow = normalizeProductName(rowProductName);

        if (normalizedRow.includes(normalizedSearch) || normalizedSearch.includes(normalizedRow)) {
          const link = String(row[0] || '');
          if (link && link.startsWith('http')) {
            return link;
          }
        }
      }
    }

    console.log(`No link found for product: ${productName} in category: ${category}`);
    return null;
  } catch (error) {
    console.error('Error finding product link:', error);
    return null;
  }
}

/**
 * Normalize product name for matching
 */
function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\u0590-\u05FF\w]/g, '') // Keep Hebrew and alphanumeric
    .trim();
}

/**
 * Extract exposure data from webpage content
 * Based on the mapping image provided by user
 */
export function extractExposureFromPageContent(htmlContent: string): ExposureMapping | null {
  try {
    // Parse the HTML to extract percentages
    // Looking for specific patterns based on the reference image
    
    const exposureData: ExposureMapping = {};

    // Extract percentages - looking for the donut charts and table data
    // Pattern: looking for percentage values in the format XX.X%
    
    // e - חשיפה למניות (Stocks exposure)
    const stocksMatch = htmlContent.match(/חשיפה למניות[^\d]*(\d+\.?\d*)%/i);
    if (stocksMatch) {
      exposureData.exposureStocks = parseFloat(stocksMatch[1]);
    }

    // f - חשיפה לחו"ל (Foreign investments)
    const foreignMatch = htmlContent.match(/חשיפה לחו["']ל[^\d]*(\d+\.?\d*)%/i);
    if (foreignMatch) {
      exposureData.exposureForeignInvestments = parseFloat(foreignMatch[1]);
    }

    // g - חשיפה למט"ח (Foreign currency)
    const currencyMatch = htmlContent.match(/חשיפה למט["']ח[^\d]*(\d+\.?\d*)%/i);
    if (currencyMatch) {
      exposureData.exposureForeignCurrency = parseFloat(currencyMatch[1]);
    }

    // h - חשיפה לחו"ל (Alternative pattern)
    if (!exposureData.exposureForeignInvestments) {
      const altForeignMatch = htmlContent.match(/השקעה ליאג["']ר[^\d]*(\d+\.?\d*)%/i);
      if (altForeignMatch) {
        exposureData.exposureForeignInvestments = parseFloat(altForeignMatch[1]);
      }
    }

    // j - נכסים סחירים (Traded assets)
    const tradedMatch = htmlContent.match(/נכסים סחירים[^\d]*(\d+\.?\d*)%/i);
    
    // k - נכסים לא סחירים (Non-traded assets)
    const nonTradedMatch = htmlContent.match(/נכסים לא סחירים[^\d]*(\d+\.?\d*)%/i);
    if (nonTradedMatch) {
      exposureData.exposureIlliquidAssets = parseFloat(nonTradedMatch[1]);
    }

    // Calculate bonds as complement if we have stocks
    if (exposureData.exposureStocks !== undefined && tradedMatch) {
      const tradedAssets = parseFloat(tradedMatch[1]);
      exposureData.exposureBonds = tradedAssets - exposureData.exposureStocks;
    }

    // Calculate Israel exposure as complement of foreign
    if (exposureData.exposureForeignInvestments !== undefined) {
      exposureData.exposureIsrael = 100 - exposureData.exposureForeignInvestments;
    }

    // Check if we found any data
    const hasData = Object.values(exposureData).some(v => v !== undefined && !isNaN(v));
    return hasData ? exposureData : null;

  } catch (error) {
    console.error('Error extracting exposure data:', error);
    return null;
  }
}

/**
 * Enhanced extraction using table data from the detailed breakdown
 * Based on the 9 asset groups shown in the image (L-T)
 */
export function extractExposureFromTableData(htmlContent: string): ExposureMapping | null {
  try {
    const exposureData: ExposureMapping = {};

    // Look for the asset allocation table with specific categories
    // L - אג"ח ממשלתיות סחירות (Government bonds)
    // M - אג"ח קונצרניות סחירות ותעודות סל אג"ח (Corporate bonds)
    // N - אג"ח קונצרניות לא סחירות (Non-traded bonds)
    // O - מניות, אופציות ותעודות סל מניותיות (Stocks)
    // P - פיקדונות (Deposits)
    // Q - הלוואות (Loans)
    // R - מוהנים ושווי מזומנים (Cash equivalents)
    // S - קרנות נאמנות (Mutual funds)
    // T - נכסים אחרים (Other assets)

    const categories = {
      governmentBonds: /אג["']ח\s+ממשלתיות\s+סחירות[^\d]*(\d+\.?\d*)%/i,
      corporateBonds: /אג["']ח\s+קונצרניות\s+סחירות[^\d]*(\d+\.?\d*)%/i,
      nonTradedBonds: /אג["']ח\s+קונצרניות\s+לא\s+סחירות[^\d]*(\d+\.?\d*)%/i,
      stocks: /מניות[^\d]*(\d+\.?\d*)%/i,
      deposits: /פיקדונות[^\d]*(\d+\.?\d*)%/i,
      loans: /הלוואות[^\d]*(\d+\.?\d*)%/i,
      cash: /מוהנים[^\d]*(\d+\.?\d*)%/i,
      mutualFunds: /קרנות\s+נאמנות[^\d]*(\d+\.?\d*)%/i,
      otherAssets: /נכסים\s+אחרים[^\d]*(\d+\.?\d*)%/i,
    };

    const values: Record<string, number> = {};

    for (const [key, regex] of Object.entries(categories)) {
      const match = htmlContent.match(regex);
      if (match) {
        values[key] = parseFloat(match[1]);
      }
    }

    // Calculate aggregated exposures
    // Stocks = O (stocks category)
    if (values.stocks) {
      exposureData.exposureStocks = values.stocks;
    }

    // Bonds = L + M + N (all bond categories)
    const totalBonds = (values.governmentBonds || 0) + 
                       (values.corporateBonds || 0) + 
                       (values.nonTradedBonds || 0);
    if (totalBonds > 0) {
      exposureData.exposureBonds = totalBonds;
    }

    // Illiquid assets = N (non-traded bonds) - if significant
    if (values.nonTradedBonds) {
      exposureData.exposureIlliquidAssets = values.nonTradedBonds;
    }

    const hasData = Object.values(exposureData).some(v => v !== undefined && !isNaN(v));
    return hasData ? exposureData : null;

  } catch (error) {
    console.error('Error extracting table data:', error);
    return null;
  }
}
