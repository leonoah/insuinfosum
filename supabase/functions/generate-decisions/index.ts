import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { products, currentDecisions, clientInfo } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Prepare the prompt for ChatGPT
    const prompt = `אתה יועץ ביטוח מקצועי. על בסיס המידע הבא, עדכן ושפר את החלטות הלקוח:

פרטי לקוח: ${JSON.stringify(clientInfo, null, 2)}

מוצרים נוכחיים: ${JSON.stringify(products.current, null, 2)}

מוצרים מומלצים: ${JSON.stringify(products.recommended, null, 2)}

החלטות קיימות: ${currentDecisions || 'אין החלטות קיימות'}

בבקשה חזור עם תוכן HTML מובנה על ההחלטות שהלקוח צריך לקבל. השתמש בפורמט HTML מובנה עם:

<div class="decisions-summary">
  <h3>סיכום החלטות הלקוח</h3>
  
  <div class="section">
    <h4>מעבר ממוצרים נוכחיים למומלצים</h4>
    <ul>
      <li>פרט ראשון</li>
      <li>פרט שני</li>
    </ul>
  </div>
  
  <div class="section">
    <h4>סיכונים שהוסברו ללקוח</h4>
    <div class="risk-item">
      <strong>סיכון:</strong> תיאור הסיכון
    </div>
  </div>
  
  <div class="section">
    <h4>המלצות ספציפיות</h4>
    <ol>
      <li>המלצה ראשונה</li>
      <li>המלצה שנייה</li>
    </ol>
  </div>
  
  <div class="section">
    <h4>מידע נוסף ופעולות נדרשות</h4>
    <p>פירוט נוסף...</p>
  </div>
</div>

התשובה צריכה להיות HTML תקין בעברית ומפורטת.`;

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
            content: 'אתה יועץ ביטוח מקצועי המסייע בכתיבת החלטות לקוחות בפורמט HTML מובנה וקריא. חזור תמיד עם HTML תקין ומסודר.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedDecisions = data.choices[0].message.content;

    console.log('Generated decisions successfully');

    return new Response(JSON.stringify({ 
      decisions: generatedDecisions,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-decisions function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});