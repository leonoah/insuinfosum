import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from 'npm:xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchExposureRequest {
  company: string;
  category: string;
  subCategory: string;
  investmentTrack?: string;
  productName: string;
}

interface ExposureData {
  exposureStocks?: number;
  exposureBonds?: number;
  exposureForeignCurrency?: number;
  exposureForeignInvestments?: number;
  exposureIsrael?: number;
  exposureIlliquidAssets?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company, category, subCategory, investmentTrack, productName }: SearchExposureRequest = await req.json();
    
    console.log('Searching exposure for:', { company, category, subCategory, investmentTrack, productName });

    // Step 1: Find the product link from Excel file
    const productLink = await findProductLink(category, productName);
    
    if (!productLink) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `לא נמצא לינק עבור המוצר: ${productName} בקטגוריה: ${category}`,
          exposureData: null
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    console.log('Found product link:', productLink);

    // Step 2: Fetch the webpage content
    try {
      const pageResponse = await fetch(productLink, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });

      if (!pageResponse.ok) {
        throw new Error(`Failed to fetch page: ${pageResponse.status}`);
      }

      const htmlContent = await pageResponse.text();
      console.log('Fetched page content, length:', htmlContent.length);

      // Step 3: Extract exposure data from the page
      const exposureData = extractExposureFromPage(htmlContent);

      if (!exposureData || Object.keys(exposureData).length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'לא הצלחנו לחלץ נתוני חשיפה מהדף',
            exposureData: null,
            link: productLink
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          exposureData,
          link: productLink,
          summary: `נתוני חשיפה נמצאו עבור: ${productName}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (fetchError) {
      console.error('Error fetching or parsing page:', fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'שגיאה בטעינת הדף או בחילוץ הנתונים',
          exposureData: null,
          link: productLink
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

  } catch (error) {
    console.error('Error in search-exposure function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Find product link from Excel file
 * The Excel should be uploaded to Supabase Storage at: product_exposure_links.xlsx
 */
async function findProductLink(category: string, productName: string): Promise<string | null> {
  try {
    console.log(`Looking for product: ${productName} in category: ${category}`);
    
    // Map category names to sheet names in Excel
    const sheetMap: Record<string, string> = {
      'קרן השתלמות': 'קרן השתלמות',
      'קופת גמל': 'קופת גמל',
      'גמל להשקעה': 'גמל להשקעה',
      'חסכון פנסיוני': 'חסכון פנסיוני'
    };
    
    const sheetName = sheetMap[category];
    if (!sheetName) {
      console.error(`Unknown category: ${category}`);
      return null;
    }
    
    // Fetch the Excel file from Supabase Storage
    const excelUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/assets/product_exposure_links.xlsx`;
    console.log(`Fetching Excel from: ${excelUrl}`);
    
    let excelResponse;
    try {
      excelResponse = await fetch(excelUrl);
      if (!excelResponse.ok) {
        throw new Error(`Failed to fetch Excel: ${excelResponse.status}`);
      }
    } catch (fetchError) {
      console.error('Error fetching Excel file:', fetchError);
      // Fallback: try to construct URL manually
      return constructFallbackUrl(productName);
    }
    
    const arrayBuffer = await excelResponse.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    
    // Check if the sheet exists
    if (!workbook.Sheets[sheetName]) {
      console.error(`Sheet "${sheetName}" not found in Excel. Available sheets:`, workbook.SheetNames);
      return constructFallbackUrl(productName);
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    console.log(`Searching in sheet "${sheetName}" with ${data.length} rows`);
    
    // Normalize product name for matching
    const normalizedSearch = normalizeProductName(productName);
    console.log(`Normalized search term: ${normalizedSearch}`);
    
    // Search for product name in column B (index 1) and get link from column C (index 2)
    for (let i = 1; i < data.length; i++) { // Start from 1 to skip header
      const row = data[i];
      if (row && row[1]) { // Column B (index 1) contains product name
        const cellValue = String(row[1]).trim();
        const normalizedCell = normalizeProductName(cellValue);
        
        // Check for match
        if (normalizedCell.includes(normalizedSearch) || normalizedSearch.includes(normalizedCell)) {
          const link = row[2]; // Column C (index 2) contains link
          if (link && String(link).trim()) {
            console.log(`Found match in row ${i + 1}: "${cellValue}" -> ${link}`);
            return String(link).trim();
          }
        }
      }
    }
    
    console.log(`No match found for "${productName}" in sheet "${sheetName}"`);
    return constructFallbackUrl(productName);
    
  } catch (error) {
    console.error('Error finding product link:', error);
    return constructFallbackUrl(productName);
  }
}

/**
 * Construct a fallback URL when Excel lookup fails
 */
function constructFallbackUrl(productName: string): string {
  const urlFriendlyName = productName
    .replace(/\s+/g, '-')
    .replace(/"/g, '')
    .replace(/'/g, '');
  
  return `https://www.igemel-net.co.il/kopot_gamel/${urlFriendlyName}`;
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
 * Extract exposure data from webpage HTML
 * Based on the mapping provided in the user's image
 */
function extractExposureFromPage(htmlContent: string): ExposureData {
  const exposureData: ExposureData = {};

  try {
    // Remove HTML tags for easier parsing
    const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    
    console.log('Parsing page content for exposure data...');

    // Extract percentages using various patterns
    // e - חשיפה למניות (Stocks exposure)
    const stocksPatterns = [
      /חשיפה למניות[^\d]*(\d+\.?\d*)%/i,
      /מניות[^\d]*(\d+\.?\d*)%/i,
    ];
    
    for (const pattern of stocksPatterns) {
      const match = textContent.match(pattern);
      if (match) {
        exposureData.exposureStocks = parseFloat(match[1]);
        console.log(`Found stocks exposure: ${exposureData.exposureStocks}%`);
        break;
      }
    }

    // f - חשיפה לחו"ל (Foreign investments)
    const foreignPatterns = [
      /חשיפה לחו["']ל[^\d]*(\d+\.?\d*)%/i,
      /השקעות חו["']ל[^\d]*(\d+\.?\d*)%/i,
    ];
    
    for (const pattern of foreignPatterns) {
      const match = textContent.match(pattern);
      if (match) {
        exposureData.exposureForeignInvestments = parseFloat(match[1]);
        console.log(`Found foreign investments: ${exposureData.exposureForeignInvestments}%`);
        break;
      }
    }

    // g - חשיפה למט"ח (Foreign currency)
    const currencyPatterns = [
      /חשיפה למט["']ח[^\d]*(\d+\.?\d*)%/i,
      /מט["']ח[^\d]*(\d+\.?\d*)%/i,
    ];
    
    for (const pattern of currencyPatterns) {
      const match = textContent.match(pattern);
      if (match) {
        exposureData.exposureForeignCurrency = parseFloat(match[1]);
        console.log(`Found foreign currency: ${exposureData.exposureForeignCurrency}%`);
        break;
      }
    }

    // j - נכסים סחירים (Traded assets)
    const tradedMatch = textContent.match(/נכסים סחירים[^\d]*(\d+\.?\d*)%/i);
    let tradedAssets: number | undefined;
    if (tradedMatch) {
      tradedAssets = parseFloat(tradedMatch[1]);
      console.log(`Found traded assets: ${tradedAssets}%`);
    }

    // k - נכסים לא סחירים (Non-traded assets / illiquid)
    const nonTradedMatch = textContent.match(/נכסים לא סחירים[^\d]*(\d+\.?\d*)%/i);
    if (nonTradedMatch) {
      exposureData.exposureIlliquidAssets = parseFloat(nonTradedMatch[1]);
      console.log(`Found illiquid assets: ${exposureData.exposureIlliquidAssets}%`);
    }

    // Calculate bonds if we have traded assets and stocks
    if (exposureData.exposureStocks !== undefined && tradedAssets !== undefined) {
      exposureData.exposureBonds = Math.max(0, tradedAssets - exposureData.exposureStocks);
      console.log(`Calculated bonds: ${exposureData.exposureBonds}%`);
    }

    // Calculate Israel exposure as complement of foreign
    if (exposureData.exposureForeignInvestments !== undefined) {
      exposureData.exposureIsrael = Math.max(0, 100 - exposureData.exposureForeignInvestments);
      console.log(`Calculated Israel exposure: ${exposureData.exposureIsrael}%`);
    }

    // Alternative: Extract from detailed asset breakdown table
    if (Object.keys(exposureData).length === 0) {
      console.log('Trying detailed table extraction...');
      extractFromDetailedTable(textContent, exposureData);
    }

  } catch (error) {
    console.error('Error extracting exposure data:', error);
  }

  return exposureData;
}

/**
 * Extract from detailed asset allocation table
 */
function extractFromDetailedTable(textContent: string, exposureData: ExposureData): void {
  // Look for the 9 asset categories from the image
  const categories = [
    { name: 'governmentBonds', pattern: /אג["']ח\s+ממשלתיות\s+סחירות[^\d]*(\d+\.?\d*)%/i },
    { name: 'corporateBonds', pattern: /אג["']ח\s+קונצרניות\s+סחירות[^\d]*(\d+\.?\d*)%/i },
    { name: 'nonTradedBonds', pattern: /אג["']ח.*?לא\s+סחירות[^\d]*(\d+\.?\d*)%/i },
    { name: 'stocks', pattern: /מניות.*?ותעודות[^\d]*(\d+\.?\d*)%/i },
  ];

  const values: Record<string, number> = {};

  for (const { name, pattern } of categories) {
    const match = textContent.match(pattern);
    if (match) {
      values[name] = parseFloat(match[1]);
      console.log(`Found ${name}: ${values[name]}%`);
    }
  }

  // Aggregate the data
  if (values.stocks && !exposureData.exposureStocks) {
    exposureData.exposureStocks = values.stocks;
  }

  const totalBonds = (values.governmentBonds || 0) + 
                     (values.corporateBonds || 0) + 
                     (values.nonTradedBonds || 0);
  
  if (totalBonds > 0 && !exposureData.exposureBonds) {
    exposureData.exposureBonds = totalBonds;
  }

  if (values.nonTradedBonds && !exposureData.exposureIlliquidAssets) {
    exposureData.exposureIlliquidAssets = values.nonTradedBonds;
  }
}
