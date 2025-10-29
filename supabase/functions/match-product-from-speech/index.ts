import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text) {
      throw new Error('No text provided');
    }

    console.log('🔍 Matching product from speech:', text);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all products from database
    const { data: products, error: dbError } = await supabase
      .from('products_information')
      .select('*')
      .order('company', { ascending: true });

    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw new Error('Failed to fetch products from database');
    }

    if (!products || products.length === 0) {
      throw new Error('No products found in database');
    }

    console.log(`✅ Loaded ${products.length} products from database`);

    // Get unique companies list for better AI matching
    const uniqueCompanies = [...new Set(products.map(p => p.company))].sort();
    
    // Get unique product types
    const uniqueProductTypes = [...new Set(products.map(p => p.product_type))].sort();

    // Build a map of tracks by company and product type for better matching
    const tracksByCompanyAndType: Record<string, string[]> = {};
    products.forEach(p => {
      const key = `${p.company}|${p.product_type}`;
      if (!tracksByCompanyAndType[key]) {
        tracksByCompanyAndType[key] = [];
      }
      if (!tracksByCompanyAndType[key].includes(p.track_name)) {
        tracksByCompanyAndType[key].push(p.track_name);
      }
    });

    console.log(`📋 Unique companies: ${uniqueCompanies.length}, Product types: ${uniqueProductTypes.length}`);

    const systemPrompt = `אתה עוזר שמנתח טקסט של פרטי מוצר פיננסי ומזהה את החברה, סוג המוצר והמסלול.

רשימת כל החברות הזמינות במערכת (${uniqueCompanies.length} חברות):
${uniqueCompanies.join(', ')}

סוגי המוצרים הזמינים:
${uniqueProductTypes.join(', ')}

מסלולים זמינים לפי חברה וסוג מוצר:
${Object.entries(tracksByCompanyAndType).map(([key, tracks]) => {
  const [company, productType] = key.split('|');
  return `${company} - ${productType}: ${tracks.join(', ')}`;
}).slice(0, 100).join('\n')}

המשימה שלך:
1. לנתח את הטקסט ולזהות:
   - שם החברה - חייב להתאים בדיוק לאחת מהחברות ברשימה למעלה
   - סוג המוצר - חייב להתאים בדיוק לאחד מסוגי המוצרים למעלה
   - מסלול ההשקעה - חייב להתאים בדיוק לאחד המסלולים הזמינים לחברה וסוג המוצר
   - סכום (אם מוזכר)
   - **דמי ניהול** - חפש בטקסט את המילים: "דמי ניהול", "דמי יעול", "דמיי ניהול", "ניהול", או כל וריאציה דומה

2. חשוב מאוד:
   - החברה והמסלול חייבים להיות מהרשימות למעלה בדיוק
   - לגבי המסלול: תמצא את ההתאמה הכי קרובה מרשימת המסלולים של החברה והמוצר הספציפיים
   - אם מוזכר "מניות" חפש "מניות" ברשימת המסלולים
   - אם מוזכר "אג\"ח" חפש מסלול אג\"ח ברשימה
   - תמיד חלץ את דמי הניהול גם אם הם נאמרים בצורה לא מדויקת (למשל "דמיי יעול" זה "דמי ניהול")
   
3. להחזיר JSON בפורמט:
{
  "companyIdentified": "שם החברה המזוהה מהטקסט",
  "companyMatched": "שם החברה המדויק מהרשימה",
  "productType": "סוג המוצר המדויק מהרשימה",
  "trackIdentified": "שם המסלול שזוהה מהטקסט",
  "trackName": "שם המסלול המדויק מרשימת המסלולים הזמינים",
  "extractedInfo": {
    "amount": סכום אם מוזכר או 0,
    "managementFeeOnDeposit": דמי ניהול מהפקדה אם מוזכר או 0,
    "managementFeeOnAccumulation": דמי ניהול מצבירה אם מוזכר או 0,
    "notes": "כל מידע נוסף שנמצא"
  },
  "confidence": מספר בין 0 ל-1
}

חשוב: תמיד תחפש וריאציות של "דמי ניהול" כמו "דמיי יעול", "דמי יעול", "ניהול" וכו'.
תמיד החזר JSON תקין בלבד, ללא טקסט נוסף.`;

    // Send to OpenAI for analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.1,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    const analysisText = result.choices[0].message.content;
    
    console.log('📄 Raw AI analysis:', analysisText);

    // Parse the JSON response
    let matchResult;
    try {
      matchResult = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      throw new Error('AI returned invalid JSON');
    }

    console.log('✅ Match result:', matchResult);

    // Now fetch all products for the matched company and product type to find the best track match
    const { data: companyProducts, error: companyError } = await supabase
      .from('products_information')
      .select('*')
      .eq('company', matchResult.companyMatched)
      .eq('product_type', matchResult.productType);

    if (companyError) {
      console.error('⚠️ Error fetching company products:', companyError);
      throw new Error('Failed to fetch company products');
    }

    console.log(`📦 Found ${companyProducts?.length || 0} products for ${matchResult.companyMatched} - ${matchResult.productType}`);

    // Find the best matching track
    let fullProduct = null;
    if (companyProducts && companyProducts.length > 0) {
      console.log(`🔎 Looking for track: "${matchResult.trackName}"`);
      console.log(`📋 Available tracks: ${companyProducts.map(p => `"${p.track_name}"`).join(', ')}`);
      
      // Try exact match first (case insensitive)
      fullProduct = companyProducts.find(p => 
        p.track_name.toLowerCase().trim() === matchResult.trackName.toLowerCase().trim()
      );
      
      if (fullProduct) {
        console.log(`✅ Found exact match: "${fullProduct.track_name}"`);
      }

      // If no exact match, try to find tracks that contain the keyword
      if (!fullProduct) {
        const trackKeyword = matchResult.trackName.toLowerCase().trim();
        console.log(`🔍 Searching for tracks containing: "${trackKeyword}"`);
        
        // Prioritize tracks that contain the exact keyword
        fullProduct = companyProducts.find(p => {
          const trackName = p.track_name.toLowerCase().trim();
          // Check if the track name contains the keyword as a whole word
          const wordMatch = new RegExp(`\\b${trackKeyword}\\b`).test(trackName);
          if (wordMatch) {
            console.log(`✅ Found word match: "${p.track_name}"`);
            return true;
          }
          return false;
        });
      }

      // If still no match, try partial contains
      if (!fullProduct) {
        console.log(`🔍 Trying partial match...`);
        fullProduct = companyProducts.find(p => {
          const trackName = p.track_name.toLowerCase().trim();
          const keyword = matchResult.trackName.toLowerCase().trim();
          const contains = trackName.includes(keyword) || keyword.includes(trackName);
          if (contains) {
            console.log(`✅ Found partial match: "${p.track_name}"`);
            return true;
          }
          return false;
        });
      }

      // If still no match, take the first one
      if (!fullProduct && companyProducts.length > 0) {
        fullProduct = companyProducts[0];
        console.log(`⚠️ No track match found for "${matchResult.trackName}", using first product: "${fullProduct.track_name}"`);
      }
    }

    console.log('✅ Final selected product:', fullProduct ? `${fullProduct.company} - ${fullProduct.track_name}` : 'null');

    return new Response(
      JSON.stringify({ 
        matchResult,
        fullProduct: fullProduct || null,
        availableTracks: companyProducts?.map(p => p.track_name) || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in match-product-from-speech:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
