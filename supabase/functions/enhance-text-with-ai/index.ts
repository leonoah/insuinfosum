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
    const { text, fieldType, context } = await req.json();

    if (!text || !fieldType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Define field-specific prompts with clear instructions
    const fieldPrompts = {
      meetingContext: {
        systemRole: 'אתה סוכן ביטוח וייעוץ פנסיוני מומחה. תפקידך לשפר ולהרחיב את סיכום רקע ועיקרי הפגישה שכתב סוכן אחר.',
        userPrompt: `הסוכן כתב את הטקסט הבא על רקע ועיקרי הפגישה עם לקוח:

"${text}"

אנא שפר את הטקסט באופן הבא:
1. שמור על כל העובדות והפרטים שהסוכן כתב
2. הרחב והוסף הקשר מקצועי נוסף בנושאים הרלוונטיים
3. ודא שהטקסט כתוב בפניה ישירה ללקוח (את/אתה)
4. הוסף הסבר מעמיק יותר לנושאים שהוזכרו
5. הפוך את הטקסט למקצועי ומפורט יותר תוך שמירה על המסר המקורי

חשוב מאוד:
- אסור להמציא פרטים שלא הוזכרו במקור
- שמור על כל הסכומים, תאריכים ושמות שהוזכרו
- כתוב בפניה ישירה (את/אתה) ולא בגוף שלישי
- השתמש במירכאות בודדות (') ולא כפולות (") בטקסט העברי
- כתוב 6-8 משפטים מפורטים

החזר רק את הטקסט המשופר, ללא הערות או הסברים נוספים.`
      },
      currentSituation: {
        systemRole: 'אתה סוכן ביטוח וייעוץ פנסיוני מומחה. תפקידך לשפר ולהרחיב את תיאור המצב הקיים של הלקוח שכתב סוכן אחר.',
        userPrompt: `הסוכן כתב את הטקסט הבא על המצב הקיים של הלקוח:

"${text}"

אנא שפר את הטקסט באופן הבא:
1. שמור על כל העובדות והפרטים שהסוכן כתב
2. הוסף הסבר מקצועי על משמעות המוצרים שהלקוח מחזיק
3. ודא שהטקסט כתוב בפניה ישירה ללקוח (את/אתה)
4. הסבר את היתרונות והחסרונות של המצב הנוכחי
5. הפוך את הטקסט למקצועי ומפורט יותר

חשוב מאוד:
- אסור להמציא פרטים שלא הוזכרו במקור
- שמור על כל הסכומים, תאריכים, שמות מוצרים ודמי ניהול שהוזכרו
- כתוב בפניה ישירה (את/אתה) ולא בגוף שלישי
- אין לך גישה למידע חיצוני - התבסס רק על מה שכתוב
- השתמש במירכאות בודדות (') ולא כפולות (") בטקסט העברי
- כתוב 4-6 משפטים מפורטים

החזר רק את הטקסט המשופר, ללא הערות או הסברים נוספים.`
      },
      decisions: {
        systemRole: 'אתה סוכן ביטוח וייעוץ פנסיוני מומחה. תפקידך לשפר ולהרחיב את תיאור ההחלטות שהתקבלו בפגישה שכתב סוכן אחר.',
        userPrompt: `הסוכן כתב את הטקסט הבא על ההחלטות שהתקבלו:

"${text}"

אנא שפר את הטקסט באופן הבא:
1. שמור על כל העובדות והפרטים שהסוכן כתב
2. הוסף הסבר מקצועי על הרציונל מאחורי ההחלטות
3. ודא שהטקסט כתוב בפניה ישירה ללקוח (את/אתה)
4. פרט את היתרונות הצפויים מהשינויים המוצעים
5. ציין לוחות זמנים ופעולות נדרשות אם הוזכרו
6. הפוך את הטקסט למקצועי ומפורט יותר

חשוב מאוד:
- אסור להמציא פרטים שלא הוזכרו במקור
- שמור על כל הסכומים, תאריכים, שמות מוצרים ופעולות שהוזכרו
- כתוב בפניה ישירה (את/אתה) ולא בגוף שלישי
- אין לך גישה למידע חיצוני - התבסס רק על מה שכתוב
- השתמש במירכאות בודדות (') ולא כפולות (") בטקסט העברי
- כתוב 6-8 משפטים מפורטים עם ניתוח מעמיק

החזר רק את הטקסט המשופר, ללא הערות או הסברים נוספים.`
      }
    };

    const selectedPrompt = fieldPrompts[fieldType as keyof typeof fieldPrompts];
    if (!selectedPrompt) {
      return new Response(
        JSON.stringify({ error: 'Invalid field type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Enhancing ${fieldType} text with AI...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: selectedPrompt.systemRole
          },
          {
            role: 'user',
            content: selectedPrompt.userPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const enhancedText = data.choices[0]?.message?.content?.trim();

    if (!enhancedText) {
      throw new Error('No enhanced text generated');
    }

    console.log(`Successfully enhanced ${fieldType} text`);

    return new Response(
      JSON.stringify({ enhancedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enhance-text-with-ai function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
