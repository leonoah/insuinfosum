import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchExposureRequest {
  company: string;
  category: string;
  subCategory: string;
  investmentTrack?: string;
  searchQuery: string;
}

interface ExposureData {
  exposureStocks?: number;
  exposureBonds?: number;
  exposureForeignCurrency?: number;
  exposureForeignInvestments?: number;
  exposureIsrael?: number;
  exposureIlliquidAssets?: number;
}

interface SearchLink {
  label: string;
  url: string;
  description?: string;
}

const KNOWN_SOURCES: { label: string; domain: string; description?: string }[] = [
  {
    label: 'MyGemel',
    domain: 'mygemel.net',
    description: 'נתוני קרנות גמל ופנסיה מאתר MyGemel'
  },
  {
    label: 'Funder',
    domain: 'funder.co.il',
    description: 'דוחות וסקירות מאתר Funder'
  },
  {
    label: 'SuperMarker',
    domain: 'supermarker.themarker.com',
    description: 'מידע משווה באתר SuperMarker'
  },
  {
    label: 'Lirot',
    domain: 'lirot.co.il',
    description: 'דו"חות חשיפות באתר Lirot'
  },
  {
    label: 'iGemel',
    domain: 'igemel-net.co.il',
    description: 'מידע על קופות גמל באתר iGemel'
  }
];

const buildGoogleSearchUrl = (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;

const guessOfficialDomains = (company: string): string[] => {
  const normalized = company
    .trim()
    .replace(/["'`׳״]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();

  if (!normalized) {
    return [];
  }

  const baseDomains = [
    `https://${normalized}.co.il`,
    `https://www.${normalized}.co.il`,
    `https://${normalized}.com`,
    `https://www.${normalized}.com`
  ];

  // Remove duplicates while preserving order
  return Array.from(new Set(baseDomains));
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company, category, subCategory, investmentTrack, searchQuery }: SearchExposureRequest = await req.json();
    
    console.log('Searching exposure for:', { company, category, subCategory, investmentTrack });

    // Use Tavily AI search API (or any other search API)
    // For now, we'll use a simple web search approach
    const baseSearchTerms = [company, category, subCategory, investmentTrack].filter(Boolean).join(' ');
    const extendedTerms = `${baseSearchTerms} חשיפות נתוני חשיפה תמהיל נכסים`;

    const officialDomainGuesses = guessOfficialDomains(company);
    const officialSiteLinks: SearchLink[] = officialDomainGuesses.map((url, index) => ({
      label: index === 0 ? 'אתר הקרן (ניסיון ישיר)' : `אתר הקרן (חלופה ${index})`,
      url,
      description: 'ניסיון לטעון את אתר הקרן ישירות על בסיס שם החברה'
    }));

    const officialSiteSearch: SearchLink = {
      label: 'חיפוש באתר הקרן',
      url: buildGoogleSearchUrl(`${extendedTerms} "${company}" "${subCategory}" "${investmentTrack ?? ''}" אתר רשמי`),
      description: 'חיפוש בגוגל המתמקד באתר הרשמי של הקרן'
    };

    const prioritizedSourceLinks: SearchLink[] = KNOWN_SOURCES.map((source) => ({
      label: `חיפוש ב-${source.label}`,
      url: buildGoogleSearchUrl(`${extendedTerms} "${company}" "${subCategory}" site:${source.domain}`),
      description: source.description
    }));

    const additionalOpenSearch: SearchLink = {
      label: 'חיפוש כללי נוסף',
      url: buildGoogleSearchUrl(searchQuery || extendedTerms),
      description: 'חיפוש רחב לקבלת מקורות נוספים באינטרנט'
    };

    const suggestedLinks: SearchLink[] = [
      ...officialSiteLinks,
      officialSiteSearch,
      ...prioritizedSourceLinks,
      additionalOpenSearch
    ];

    const summary = `חיפוש עבור: ${company} - ${category} - ${subCategory}${investmentTrack ? ` - ${investmentTrack}` : ''}`;

    return new Response(
      JSON.stringify({
        success: true,
        exposureData: null,
        summary: summary + '\n\nטרם נשלפו נתוני חשיפה אוטומטיים, אך ריכזנו עבורך קישורים ממוקדים להמשך החיפוש.',
        searchQuery,
        searchLinks: suggestedLinks
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in search-exposure function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
