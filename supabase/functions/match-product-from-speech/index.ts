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

    console.log(`📋 Unique companies: ${uniqueCompanies.length}, Product types: ${uniqueProductTypes.length}`);

    const systemPrompt = `אתה עוזר שמנתח טקסט של פרטי מוצר פיננסי ומזהה את החברה, סוג המוצר והמסלול.

רשימת כל החברות הזמינות במערכת (${uniqueCompanies.length} חברות):
${uniqueCompanies.join(', ')}

סוגי המוצרים הזמינים:
${uniqueProductTypes.join(', ')}

המשימה שלך:
1. לנתח את הטקסט ולזהות:
   - שם החברה - חייב להתאים בדיוק לאחת מהחברות ברשימה למעלה (לא להמציא שם חדש!)
   - סוג המוצר - חייב להתאים בדיוק לאחד מסוגי המוצרים למעלה
   - מסלול ההשקעה (מניות, אג"ח, כללי, משולב וכו')
   - סכום (אם מוזכר)
   - דמי ניהול (אם מוזכרים)

2. חשוב מאוד:
   - אם מוזכר שם חברה בטקסט, חפש את ההתאמה הכי קרובה ברשימת החברות
   - לדוגמה: "אנליסט" מתאים ל"אנליסט" מהרשימה
   - אם לא בטוח מה החברה, השתמש ב"אחר"
   
3. להחזיר JSON בפורמט:
{
  "companyIdentified": "שם החברה המזוהה מהטקסט",
  "companyMatched": "שם החברה המדויק מהרשימה",
  "productType": "סוג המוצר המדויק מהרשימה",
  "trackName": "שם המסלול שזוהה",
  "extractedInfo": {
    "amount": סכום אם מוזכר או 0,
    "managementFeeOnDeposit": דמי ניהול מהפקדה או 0,
    "managementFeeOnAccumulation": דמי ניהול מצבירה או 0,
    "notes": "הערות נוספות"
  },
  "confidence": מספר בין 0 ל-1
}

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
      // Try exact match first
      fullProduct = companyProducts.find(p => 
        p.track_name.toLowerCase() === matchResult.trackName.toLowerCase()
      );

      // If no exact match, try partial match
      if (!fullProduct) {
        fullProduct = companyProducts.find(p => 
          p.track_name.toLowerCase().includes(matchResult.trackName.toLowerCase()) ||
          matchResult.trackName.toLowerCase().includes(p.track_name.toLowerCase())
        );
      }

      // If still no match, take the first one
      if (!fullProduct && companyProducts.length > 0) {
        fullProduct = companyProducts[0];
        console.log('⚠️ No track match found, using first product');
      }
    }

    console.log('✅ Selected product:', fullProduct ? `${fullProduct.company} - ${fullProduct.track_name}` : 'null');

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
