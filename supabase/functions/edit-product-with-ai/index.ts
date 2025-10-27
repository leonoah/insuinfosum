import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product, command } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Editing product with command:', command);
    console.log('Original product:', product);

    const productSchema = {
      required_fields: ["id", "category", "subCategory", "company", "amount", "managementFeeOnDeposit", "managementFeeOnAccumulation", "investmentTrack", "notes", "type"],
      categories: ["קרן פנסיה", "קרן השתלמות", "קופת גמל", "ביטוח מנהלים"],
      investment_tracks: ["כללי", "מניות", "אג\"ח", "סולידי", "מניות חו\"ל", "הלכתי/שרעי", "סקטוריאלי/אלטרנטיבי"],
      companies: ["הראל", "מגדל", "מנורה", "כלל", "פניקס", "אלטשולר שחם", "מיטב דש", "אקסלנס", "אי.בי.אי", "הלמן אלדובי", "תבל", "פסגות", "פימי", "ילין לפידות", "איילון", "אנליסט", "עמית פוליסות", "אוצר חיל", "עומדים ביחד"],
      field_descriptions: {
        id: "מזהה ייחודי - אל תשנה",
        category: "סוג מוצר - קרן פנסיה/קרן השתלמות/קופת גמל/ביטוח מנהלים",
        subCategory: "תת-קטגוריה או מסלול ספציפי",
        company: "שם החברה המנהלת - רק מהרשימה",
        amount: "סכום צבירה בשקלים - מספר חיובי",
        managementFeeOnDeposit: "דמי ניהול מהפקדה - אחוזים 0-100",
        managementFeeOnAccumulation: "דמי ניהול מצבירה - אחוזים 0-100",
        investmentTrack: "מסלול השקעה - רק מהרשימה",
        riskLevelChange: "שינוי סיכון - ירידה/העלאה/פיזור מחדש/no-change",
        notes: "הערות נוספות - טקסט חופשי",
        type: "current או recommended - אל תשנה",
        returns: "תשואה באחוזים - אופציונלי",
        productNumber: "מספר מוצר לזיהוי - אופציונלי",
        exposureStocks: "חשיפה מנייתית 0-100% - אופציונלי",
        exposureBonds: "חשיפה לאג\"ח 0-100% - אופציונלי",
        exposureForeignCurrency: "חשיפה למט\"ח 0-100% - אופציונלי",
        exposureForeignInvestments: "חשיפה לחו\"ל 0-100% - אופציונלי"
      }
    };

    const systemPrompt = `אתה עוזר AI מומחה בניהול מוצרים פיננסיים.
תפקידך לעדכן פרטי מוצרים בהתאם לבקשות משתמשים בעברית.

סכמת מוצר:
${JSON.stringify(productSchema, null, 2)}

המוצר הנוכחי:
${JSON.stringify(product, null, 2)}

הנחיות:
1. הבן את הפקודה וזהה אילו שדות לעדכן
2. שמור על כל השדות הקיימים, עדכן רק את הנדרשים
3. ודא שהערכים תקינים:
   - חברות רק מהרשימה המוגדרת
   - מסלולי השקעה רק מהרשימה המוגדרת
   - אחוזים בין 0-100
   - סכומים חיוביים
4. אל תשנה את id ו-type אלא אם כן מבוקש במפורש

דוגמאות לפקודות:
- "תשנה לי הראל במסלול מניות" → company="הראל", investmentTrack="מניות"
- "תשנה דמי ניהול ל-0.3" → managementFeeOnAccumulation=0.3
- "תעדכן צבירה ל-500000" → amount=500000
- "תשנה למגדל" → company="מגדל"

חשוב: החזר JSON בלבד עם כל השדות, כולל אלה שלא השתנו.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `המוצר הקיים:\n${JSON.stringify(product, null, 2)}\n\nהפקודה: ${command}\n\nהחזר את המוצר המעודכן בפורמט JSON בלבד.`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'חריגה ממגבלת הבקשות, נסה שוב מאוחר יותר' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'נדרשת תשלום, אנא הוסף כסף ל-Lovable AI workspace' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI response:', aiResponse);

    // נסה לחלץ JSON מהתשובה
    let updatedProduct;
    try {
      // נסה למצוא JSON בתשובה
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        updatedProduct = JSON.parse(jsonMatch[0]);
      } else {
        updatedProduct = JSON.parse(aiResponse);
      }
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      throw new Error('AI לא החזיר פורמט JSON תקין');
    }

    console.log('Updated product:', updatedProduct);

    return new Response(
      JSON.stringify({ updatedProduct, originalProduct: product }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in edit-product-with-ai function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});