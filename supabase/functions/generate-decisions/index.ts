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
    const { products, currentDecisions, clientInfo, autoFillMode } = await req.json();
    
    console.log('Request received:', { 
      autoFillMode, 
      hasProducts: !!products,
      currentProductsCount: products?.current?.length || 0,
      recommendedProductsCount: products?.recommended?.length || 0
    });
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    let prompt: string;
    
    if (autoFillMode) {
      // Auto-fill mode: generate plain text for the 3 specific fields
      prompt = `אתה סוכן ביטוח וייעוץ פנסיוני מומחה ומנוסה. תפקידך לנתח מצב ביטוחי ופנסיוני של לקוח ולהסביר לו את ההמלצות בצורה מקצועית, מעמיקה וברורה בפניה ישירה בגוף שני.

פרטי לקוח: ${JSON.stringify(clientInfo, null, 2)}

מוצרים נוכחיים: ${JSON.stringify(products.current, null, 2)}

מוצרים מומלצים: ${JSON.stringify(products.recommended, null, 2)}

החלטות קיימות: ${JSON.stringify(currentDecisions, null, 2)}

אנא מלא את השדות הבאים בטקסט מקצועי ומפורט בפניה ישירה ללקוח (את/ה):

1. **מצב קיים** - נתח את המצב הביטוחי והפנסיוני הנוכחי:
   - תאר את המוצרים הקיימים ומאפייניהם בפניה ישירה (למשל: "את מבוטחת כיום בקרן פנסיה X")
   - הסבר את המשמעות של כל מוצר בפניה ישירה (למשל: "הקרן שלך מעניקה לך פנסיה חודשית בגיל פרישה")
   - ציין את היתרונות והחסרונות של המצב הנוכחי בפניה ישירה
   - 4-6 משפטים מפורטים בפניה ישירה (את/אתה)

2. **פערים וסיכונים** - זהה ונתח את הפערים והסיכונים בפניה ישירה:
   - פרט את הפערים הספציפיים במוצרים הקיימים בפניה ישירה (למשל: "את משלמת דמי ניהול גבוהים של 2%")
   - הסבר את המשמעות של כל פער בפניה ישירה (למשל: "דמי הניהול הגבוהים שלך עלולים לעלות לך אלפי שקלים לאורך השנים")
   - ציין סיכונים ספציפיים בפניה ישירה על בסיס הגיל, המצב המשפחתי וההכנסה
   - 5-7 נקודות מפורטות בפניה ישירה (את/אתה)

3. **מה הוחלט לבצע** - פרט את ההחלטות שהתקבלו והסבר את הרציונל בפניה ישירה:
   - תאר בדיוק איזה מעבר או שינוי יבוצע בפניה ישירה (למשל: "נעביר אותך מקרן פנסיה X לביטוח מנהלים Y")
   - הסבר למה ההחלטה הזו נכונה בפניה ישירה (למשל: "ביטוח מנהלים מתאים לך יותר כי את עובדת שכירה ואת זקוקה לכיסוי ביטוחי נרחב")
   - פרט את היתרונות הצפויים בפניה ישירה (למשל: "תחסכי בדמי ניהול, תקבלי כיסויים משופרים")
   - ציין לוחות זמנים ופעולות נדרשות בפניה ישירה
   - 6-8 משפטים מפורטים עם ניתוח מעמיק בפניה ישירה (את/אתה)

**הנחיות קריטיות - חובה לציית:**
- כתוב בפניה ישירה ללקוח בגוף שני (את/אתה) ולא בגוף שלישי
- **אסור לחלוטין** להמציא או להשתמש במידע שלא סופק במפורש בנתונים (כגון: תשואות, ביצועים היסטוריים, דירוגים, המלצות כלליות על חברות)
- **השתמש אך ורק** במידע שמופיע בנתוני המוצרים שסופקו לך - אין לך גישה לרשת ואסור לך להשתמש בידע כללי על מוצרים פיננסיים
- אם חסר מידע מסוים (כמו דמי ניהול, כיסויים וכו'), אל תזכיר אותו בכלל - התמקד רק במה שקיים
- אל תשווה לממוצעים בשוק או לנתונים סטטיסטיים כלליים
- הסבר כל מונח מקצועי בצורה פשוטה וברורה
- חשוב כסוכן שמדבר ישירות עם הלקוח על בסיס הנתונים הקונקרטיים שלו בלבד
- השתמש במירכאות בודדות (') במקום כפולות (") בתוך הטקסט

חזור עם JSON בפורמט הבא (בלבד, ללא טקסט נוסף):
{
  "currentSituation": "ניתוח מפורט של המצב הקיים",
  "risks": "ניתוח מפורט של הפערים והסיכונים", 
  "decisions": "ניתוח מפורט של ההחלטות והרציונל"
}`;
    } else {
      // Legacy mode: generate HTML for report
      prompt = `אתה יועץ ביטוח מקצועי. על בסיס המידע הבא, עדכן ושפר את החלטות הלקוח:

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
    }

    console.log('Calling OpenAI API...');
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
            content: autoFillMode 
              ? 'אתה סוכן ביטוח וייעוץ פנסיוני מומחה עם ניסיון רב בהסברת מוצרים פיננסיים ללקוחות. אתה מנתח מצב ביטוחי ופנסיוני בצורה מקצועית ומעמיקה. חשוב קריטי: **אין לך גישה לאינטרנט או למידע חיצוני** - אתה מבסס את הניתוח שלך **אך ורק** על הנתונים הקונקרטיים שסופקו לך בבקשה. אסור לחלוטין להמציא או להוסיף מידע שלא סופק (כגון תשואות, דירוגים, ביצועים, או ידע כללי על מוצרים). אם מידע מסוים חסר, אל תזכיר אותו. כתוב בפניה ישירה ללקוח בגוף שני (את/אתה). חזור תמיד עם JSON תקין ושלם. CRITICAL: You must return complete, valid JSON without truncation.'
              : 'אתה יועץ ביטוח מקצועי המסייע בכתיבת החלטות לקוחות בפורמט HTML מובנה וקריא. חזור תמיד עם HTML תקין ומסודר.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3
      }),
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0]?.message?.content;

    if (!generatedContent) {
      console.error('No content in OpenAI response:', data);
      throw new Error('No content generated by AI');
    }

    console.log('Generated content successfully, length:', generatedContent.length);

    if (autoFillMode) {
      // Parse JSON response for auto-fill mode
      try {
        // Try to extract JSON from the response (in case it's wrapped in markdown)
        let jsonContent = generatedContent.trim();
        const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim();
          console.log('Extracted JSON from markdown code block');
        }
        
        // Try to complete incomplete JSON if needed
        if (!jsonContent.endsWith('}')) {
          console.log('JSON appears incomplete, attempting to complete it');
          
          // Count braces to determine how many are missing
          const openBraces = (jsonContent.match(/{/g) || []).length;
          const closeBraces = (jsonContent.match(/}/g) || []).length;
          const missingBraces = openBraces - closeBraces;
          
          // Add missing closing braces and quotes if needed
          if (missingBraces > 0) {
            // Check if last field is incomplete
            if (!jsonContent.trim().endsWith('"')) {
              jsonContent += '"';
            }
            // Add missing braces
            jsonContent += '}'.repeat(missingBraces);
            console.log(`Added ${missingBraces} missing closing braces`);
          }
        }
        
        // Try to parse as-is first
        let parsedContent;
        try {
          parsedContent = JSON.parse(jsonContent);
          console.log('Successfully parsed JSON on first attempt');
        } catch (firstError) {
          console.log('First parse attempt failed, trying to fix common issues');
          
          // Fix common issues: escape quotes in Hebrew text and complete truncated strings
          let fixedContent = jsonContent
            .replace(/ש"ח/g, 'ש\\"ח')
            .replace(/למנכ"ל/g, 'למנכ\\"ל')
            .replace(/מע"מ/g, 'מע\\"מ')
            .replace(/אג"ח/g, 'אג\\"ח');
          
          // If the last field appears truncated, try to close it properly
          if (fixedContent.includes(': "') && !fixedContent.trim().endsWith('"}')) {
            const lastQuoteIndex = fixedContent.lastIndexOf('"');
            const lastColonIndex = fixedContent.lastIndexOf('":');
            if (lastColonIndex > lastQuoteIndex) {
              fixedContent += '"';
            }
          }
          
          console.log('Attempting parse with fixed content');
          try {
            parsedContent = JSON.parse(fixedContent);
            console.log('Successfully parsed after fixing common issues');
          } catch (secondError) {
            console.error('Both parse attempts failed:', {
              firstError: firstError instanceof Error ? firstError.message : String(firstError),
              secondError: secondError instanceof Error ? secondError.message : String(secondError),
              originalContent: jsonContent.substring(0, 500),
              fixedContent: fixedContent.substring(0, 500)
            });
            throw new Error(`Failed to parse JSON: ${secondError instanceof Error ? secondError.message : String(secondError)}`);
          }
        }
        
        // Validate required fields
        if (!parsedContent.currentSituation && !parsedContent.risks && !parsedContent.decisions) {
          console.error('Parsed content missing all required fields:', parsedContent);
          throw new Error('AI response missing required fields');
        }
        
        console.log('Successfully parsed and validated JSON response');
        return new Response(JSON.stringify({ 
          currentSituation: parsedContent.currentSituation || '',
          risks: parsedContent.risks || '',
          decisions: parsedContent.decisions || '',
          success: true 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        console.error('Error parsing JSON response:', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          content: generatedContent.substring(0, 500)
        });
        return new Response(JSON.stringify({ 
          error: 'שגיאה בעיבוד התשובה מה-AI. אנא נסה שוב.',
          details: parseError instanceof Error ? parseError.message : String(parseError),
          success: false
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Legacy mode: return HTML decisions
      return new Response(JSON.stringify({ 
        decisions: generatedContent,
        success: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in generate-decisions function:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name
    });
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});