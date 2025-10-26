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

    const systemPrompt = `אתה עוזר AI חכם שעוזר לעדכן מוצרים פינסיים בעברית.
אתה מקבל מוצר פיננסי קיים ופקודה לעדכן אותו.
המוצר יכול להיות מסוג חיסכון (קרן פנסיה, קופת גמל, ביטוח מנהלים, קרן השתלמות).

מבנה המוצר:
- id: מזהה ייחודי (אל תשנה)
- category: סוג המוצר (קרן פנסיה, קופת גמל, ביטוח מנהלים, קרן השתלמות)
- subCategory: תת קטגוריה (לדוגמה: קופת גמל להשקעה, קרן פנסיה כללית)
- company: שם החברה המנפיקה (הראל, מגדל, מנורה, כלל, פניקס, אלטשולר שחם, מיטב דש, אקסלנס, אי.בי.אי, הלמן אלדובי, תבל, פסגות, פימי, ילין לפידות, איילון, אנליסט, עמית פוליסות, אוצר חיל, עומדים ביחד)
- amount: סכום הצבירה בשקלים
- investmentTrack: מסלול השקעה (כללי, מניות, אג"ח, סולידי, מניות חו"ל, הלכתי/שרעי, סקטוריאלי/אלטרנטיבי)
- managementFeeOnDeposit: דמי ניהול על הפקדה באחוזים
- managementFeeOnAccumulation: דמי ניהול על צבירה באחוזים
- returns: תשואה באחוזים (אופציונלי)
- notes: הערות (אופציונלי)
- type: current או recommended (אל תשנה)

עליך להבין את הפקודה ולעדכן את השדות המתאימים במוצר.
דוגמאות לפקודות:
- "תשנה לי הראל במסלול מניות" -> עדכן company ל"הראל" ו-investmentTrack ל"מניות"
- "תשנה את דמי הניהול על צבירה ל-0.3" -> עדכן managementFeeOnAccumulation ל-0.3
- "תעדכן סכום ל-500000" -> עדכן amount ל-500000
- "תשנה למגדל" -> עדכן company ל"מגדל"
- "תשנה מסלול לאג"ח" -> עדכן investmentTrack ל"אג\"ח"
- "תשנה תשואה ל-5.2" -> עדכן returns ל-5.2

חשוב: החזר את כל השדות של המוצר המקורי, כולל אלה שלא השתנו.
החזר את המוצר המעודכן בפורמט JSON בלבד, ללא טקסט נוסף.`;

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