import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { text } = await req.json();
    
    if (!text) {
      throw new Error('No text provided');
    }

    console.log('Analyzing product speech:', text);

    const systemPrompt = `אתה עוזר שמנתח טקסט של פרטי מוצר פיננסי ומחלץ מידע מובנה.

החזר תמיד JSON בפורמט הבא:
{
  "productName": "שם המוצר (למשל: קופת גמל, פנסיה, ביטוח חיים)",
  "company": "שם החברה (למשל: מגדל, הפניקס, מנורה)",
  "amount": מספר הסכום ללא פסיקים,
  "managementFeeOnDeposit": אחוז דמי ניהול מהפקדה (0 אם לא מוזכר),
  "managementFeeOnAccumulation": אחוז דמי ניהול מצבירה (0 אם לא מוזכר),
  "subType": "סוג משנה או מסלול אם מוזכר",
  "investmentTrack": "מסלול השקעה אם מוזכר",
  "notes": "הערות נוספות או פרטים שלא נכנסו לשדות אחרים"
}

דוגמאות:
- "קופת גמל של מגדל, סכום של 200000 שקל, ריבית 2.0%" -> productName: "קופת גמל", company: "מגדל", amount: 200000, managementFeeOnAccumulation: 2.0
- "פנסיה בהפניקס 150000 דמי ניהול 1.5%" -> productName: "פנסיה", company: "הפניקס", amount: 150000, managementFeeOnAccumulation: 1.5
- "ביטוח חיים במנורה 300000" -> productName: "ביטוח חיים", company: "מנורה", amount: 300000

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
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    const analysisText = result.choices[0].message.content;
    
    console.log('Raw analysis result:', analysisText);

    // Parse the JSON response
    let productData;
    try {
      productData = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      // Fallback: extract basic info manually
      productData = {
        productName: "מוצר",
        company: "לא זוהה",
        amount: 0,
        managementFeeOnDeposit: 0,
        managementFeeOnAccumulation: 0,
        subType: "",
        investmentTrack: "",
        notes: text
      };
    }

    console.log('Parsed product data:', productData);

    return new Response(
      JSON.stringify({ productData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-product-speech function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});