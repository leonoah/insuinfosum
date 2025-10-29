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

    // Build a concise product list for the AI
    const productSummary = products.map(p => ({
      company: p.company,
      category: p.product_type,
      trackName: p.track_name,
      productCode: p.product_code,
    }));

    // Limit to first 200 for token efficiency
    const limitedProducts = productSummary.slice(0, 200);

    const systemPrompt = `אתה עוזר שמנתח טקסט של פרטי מוצר פיננסי ומוצא את המוצר המתאים ביותר מרשימה קיימת.

רשימת המוצרים הזמינים (חלקית):
${JSON.stringify(limitedProducts, null, 2)}

המשימה שלך:
1. לנתח את הטקסט ולזהות:
   - סוג המוצר (קופת גמל, קרן השתלמות, פנסיה, ביטוח וכו')
   - שם החברה (מגדל, הפניקס, מנורה, הראל, מיטב, אלטשולר שחם, מור וכו')
   - מסלול ההשקעה (מניות, אג"ח, כללי, משולב וכו')
   - סכום (אם מוזכר)
   - דמי ניהול (אם מוזכרים)

2. למצוא את המוצר הכי מתאים מהרשימה לפי:
   - התאמה מדויקת של סוג המוצר (product_type)
   - התאמה מדויקת של החברה
   - התאמה הכי קרובה של מסלול ההשקעה (track_name)

3. להחזיר JSON בפורמט:
{
  "matchedProduct": {
    "company": "שם החברה המדויק מהרשימה",
    "category": "סוג המוצר המדויק מהרשימה",
    "trackName": "שם המסלול המדויק מהרשימה",
    "productCode": "קוד המוצר מהרשימה"
  },
  "extractedInfo": {
    "amount": סכום אם מוזכר או 0,
    "managementFeeOnDeposit": דמי ניהול מהפקדה או 0,
    "managementFeeOnAccumulation": דמי ניהול מצבירה או 0,
    "notes": "הערות נוספות"
  },
  "confidence": מספר בין 0 ל-1 המציין רמת הוודאות בהתאמה
}

חשוב: אם אין התאמה ברורה, החזר confidence נמוך (מתחת ל-0.5).
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

    // Fetch the full product details from database
    const { data: fullProduct, error: productError } = await supabase
      .from('products_information')
      .select('*')
      .eq('company', matchResult.matchedProduct.company)
      .eq('product_type', matchResult.matchedProduct.category)
      .eq('track_name', matchResult.matchedProduct.trackName)
      .maybeSingle();

    if (productError) {
      console.error('⚠️ Error fetching full product:', productError);
    }

    console.log('📦 Full product details:', fullProduct);

    return new Response(
      JSON.stringify({ 
        matchResult,
        fullProduct: fullProduct || null
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
