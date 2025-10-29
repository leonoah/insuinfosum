import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, agentName } = await req.json();
    
    if (!transcript) {
      throw new Error('No transcript provided');
    }

    console.log('🎙️ Analyzing call transcript...');

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

    // Build a concise product list for the AI (limit to avoid token overflow)
    const productSummary = products.slice(0, 150).map(p => ({
      company: p.company,
      category: p.product_type,
      trackName: p.track_name,
      productCode: p.product_code,
    }));

    const systemPrompt = `אתה מומחה לניתוח שיחות ביטוח פנסיוני ולהפקת מידע מובנה. 
    מתפקידך לנתח תמליל של שיחה בין סוכן ביטוח ללקוח ולחלץ את המידע הבא:
    
    **רשימת מוצרים זמינים (חלקית):**
    ${JSON.stringify(productSummary, null, 2)}
    
    **חשוב מאוד:** כל מוצר שתזהה חייב להיות מהרשימה הזמינה למעלה!
    עבור כל מוצר:
    - מצא את החברה המדויקת מהרשימה
    - מצא את הקטגוריה המדויקת (product_type)
    - מצא את המסלול המדויק (track_name) שהכי קרוב למה שהלקוח אמר
    
    1. מצב הלקוח הנוכחי - תיאור קצר של מצבו הכלכלי והביטוחי
    2. מוצרי ביטוח קיימים של הלקוח (רק מהרשימה!)
    3. מוצרי ביטוח מומלצים על בסיס השיחה (רק מהרשימה!)
    4. סיכום השיחה עם הדגשות צבעוניות
    
    החזר תשובה בפורמט JSON בלבד עם המבנה הבא:
    {
      "customerStatus": "תיאור מצב הלקוח",
      "summary": "סיכום השיחה",
      "highlightedTranscript": "תמליל עם הדגשות HTML - שם מוצר ב-<span class='product-name'>שם מוצר</span>, חברה ב-<span class='company-name'>שם חברה</span>, מספרים ב-<span class='numbers'>מספר</span>",
      "currentProducts": [
        {
          "company": "שם החברה המדויק מהרשימה",
          "category": "סוג המוצר המדויק מהרשימה",
          "trackName": "שם המסלול המדויק מהרשימה",
          "productCode": "קוד המוצר אם מוזכר",
          "amount": מספר,
          "managementFeeOnDeposit": מספר,
          "managementFeeOnAccumulation": מספר,
          "notes": "הערות"
        }
      ],
      "suggestedProducts": [
        {
          "company": "שם החברה המדויק מהרשימה",
          "category": "סוג המוצר המדויק מהרשימה",
          "trackName": "שם המסלול המדויק מהרשימה",
          "productCode": "קוד המוצר אם מוזכר",
          "amount": מספר,
          "managementFeeOnDeposit": מספר,
          "managementFeeOnAccumulation": מספר,
          "notes": "הערות"
        }
      ]
    }
    
    אם אין מוצר מתאים ברשימה, דלג על המוצר!`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: `נתח את תמליל השיחה הבא:\n\n${transcript}` 
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    const analysisText = result.choices[0].message.content;
    
    console.log('📄 Raw AI response:', analysisText);

    // Parse the JSON response
    let analysisData;
    try {
      // Clean the response and extract JSON
      const cleanedText = analysisText.replace(/```json\n?|\n?```/g, '').trim();
      analysisData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('❌ Error parsing AI response:', parseError);
      // Fallback response
      analysisData = {
        customerStatus: "לא ניתן היה לזהות את מצב הלקוח מהתמליל",
        summary: "התמליל עובד אך לא ניתן היה לחלץ מידע מובנה",
        highlightedTranscript: transcript,
        currentProducts: [],
        suggestedProducts: []
      };
    }

    // Process products and enrich with full data from database
    const processProducts = async (productsList: any[], type: 'current' | 'recommended') => {
      const enrichedProducts = [];
      
      for (const product of productsList) {
        // Fetch full product details
        const { data: fullProduct } = await supabase
          .from('products_information')
          .select('*')
          .eq('company', product.company)
          .eq('product_type', product.category)
          .eq('track_name', product.trackName)
          .maybeSingle();

        if (fullProduct) {
          // Calculate total bonds
          const totalBonds = 
            (Number(fullProduct.exposure_government_bonds) || 0) +
            (Number(fullProduct.exposure_corporate_bonds_tradable) || 0) +
            (Number(fullProduct.exposure_corporate_bonds_non_tradable) || 0);

          enrichedProducts.push({
            id: `${type}-${Date.now()}-${Math.random()}`,
            category: product.category,
            subCategory: product.trackName,
            company: product.company,
            amount: product.amount || 0,
            managementFeeOnDeposit: product.managementFeeOnDeposit || 0,
            managementFeeOnAccumulation: product.managementFeeOnAccumulation || 0,
            productNumber: product.productCode || fullProduct.product_code,
            notes: product.notes || "",
            type: type,
            // Add exposure data
            exposureStocks: Number(fullProduct.exposure_stocks) || 0,
            exposureBonds: totalBonds,
            exposureForeignCurrency: Number(fullProduct.exposure_foreign_currency) || 0,
            exposureForeignInvestments: Number(fullProduct.exposure_foreign) || 0,
          });
          console.log(`✅ Enriched ${type} product:`, product.company, product.trackName);
        } else {
          console.log(`⚠️ No matching product found for: ${product.company} - ${product.trackName}`);
        }
      }
      
      return enrichedProducts;
    };

    const finalData = {
      customerStatus: analysisData.customerStatus || "מצב לקוח לא זוהה",
      summary: analysisData.summary || "סיכום לא זמין",
      highlightedTranscript: analysisData.highlightedTranscript || transcript,
      currentProducts: await processProducts(analysisData.currentProducts || [], 'current'),
      suggestedProducts: await processProducts(analysisData.suggestedProducts || [], 'recommended')
    };

    console.log('✅ Analysis completed successfully');
    
    return new Response(
      JSON.stringify(finalData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in analyze-call-transcript function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});