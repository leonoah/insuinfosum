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
    const { transcript, agentName } = await req.json();
    
    if (!transcript) {
      throw new Error('No transcript provided');
    }

    console.log('Analyzing call transcript...');

    const systemPrompt = `אתה מומחה לניתוח שיחות ביטוח ולהפקת מידע מובנה. 
    מתפקידך לנתח תמליל של שיחה בין סוכן ביטוח ללקוח ולחלץ את המידע הבא:
    
    חברות ביטוח מוכרות בישראל:
    - מגדל, כלל, הפניקס, מנורה מבטחים, הכשרה, איילון, מגדלור, AIG, הלמן אלדובי, 
    - עמיתים, אלטשולר שחם, הראל, ביטוח ישיר, לאומי, בנק הפועלים, מזרחי טפחות,
    - כלל פנסיה וגמל, מנורה פנסיה, מגדל פנסיה, הפניקס פנסיה, הכשרה פנסיה
    
    מוצרי ביטוח נפוצים:
    - פנסיה תקציבית, פנסיה כללית, ביטוח מנהלים, קופת גמל להשקעה,
    - ביטוח חיים, בריאות פרטית, ביטוח סיעוד, ביטוח אובדן כושר עבודה,
    - ביטוח רכב, ביטוח דירה, ביטוח נסיעות לחו"ל, ביטוח אחריות מקצועית
    
    1. מצב הלקוח הנוכחי - תיאור קצר של מצבו הכלכלי והביטוחי
    2. מוצרי ביטוח קיימים של הלקוח (השתמש רק בחברות מהרשימה)
    3. מוצרי ביטוח מומלצים על בסיס השיחה (השתמש רק בחברות מהרשימה)
    4. סיכום השיחה עם הדגשות צבעוניות
    
    החזר תשובה בפורמט JSON בלבד עם המבנה הבא:
    {
      "customerStatus": "תיאור מצב הלקוח",
      "summary": "סיכום השיחה",
      "highlightedTranscript": "תמליל עם הדגשות HTML - שם מוצר ב-<span class='product-name'>שם מוצר</span>, חברה ב-<span class='company-name'>שם חברה</span>, מספרים ב-<span class='numbers'>מספר</span>",
      "currentProducts": [
        {
          "id": "unique-id",
          "company": "שם חברת הביטוח מהרשימה בלבד",
          "productName": "שם המוצר",
          "subType": "תת סוג",
          "amount": מספר,
          "managementFeeOnDeposit": מספר,
          "managementFeeOnAccumulation": מספר,
          "investmentTrack": "כללי",
          "notes": "הערות",
          "type": "current"
        }
      ],
      "suggestedProducts": [
        {
          "id": "unique-id",
          "company": "שם חברת הביטוח מהרשימה בלבד",
          "productName": "שם המוצר",
          "subType": "תת סוג", 
          "amount": מספר,
          "managementFeeOnDeposit": מספר,
          "managementFeeOnAccumulation": מספר,
          "investmentTrack": "כללי",
          "notes": "הערות",
          "type": "recommended"
        }
      ]
    }
    
    חשוב: השתמש אך ורק בחברות ביטוח מהרשימה שלמעלה. אם מוזכרת חברה שלא ברשימה, מצא את החברה הקרובה ביותר או השתמש ב"מגדל" כברירת מחדל.`;

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
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    const analysisText = result.choices[0].message.content;
    
    console.log('Raw AI response:', analysisText);

    // Parse the JSON response
    let analysisData;
    try {
      // Clean the response and extract JSON
      const cleanedText = analysisText.replace(/```json\n?|\n?```/g, '').trim();
      analysisData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback response
      analysisData = {
        customerStatus: "לא ניתן היה לזהות את מצב הלקוח מהתמליל",
        summary: "התמליל עובד אך לא ניתן היה לחלץ מידע מובנה",
        highlightedTranscript: transcript,
        currentProducts: [],
        suggestedProducts: []
      };
    }

    // Ensure products have required fields and unique IDs
    const processProducts = (products: any[], type: 'current' | 'recommended') => {
      return products.map((product, index) => ({
        id: `${type}-${Date.now()}-${index}`,
        company: product.company || "חברה לא מזוהה",
        productName: product.productName || "מוצר לא מזוהה",
        subType: product.subType || "סוג לא מזוהה",
        amount: product.amount || 0,
        managementFeeOnDeposit: product.managementFeeOnDeposit || 0,
        managementFeeOnAccumulation: product.managementFeeOnAccumulation || 0,
        investmentTrack: product.investmentTrack || "כללי",
        notes: product.notes || "",
        type: type
      }));
    };

    const finalData = {
      customerStatus: analysisData.customerStatus || "מצב לקוח לא זוהה",
      summary: analysisData.summary || "סיכום לא זמין",
      highlightedTranscript: analysisData.highlightedTranscript || transcript,
      currentProducts: processProducts(analysisData.currentProducts || [], 'current'),
      suggestedProducts: processProducts(analysisData.suggestedProducts || [], 'recommended')
    };

    console.log('Analysis completed successfully');
    
    return new Response(
      JSON.stringify(finalData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-call-transcript function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});