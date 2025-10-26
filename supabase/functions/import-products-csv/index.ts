import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { csvContent } = await req.json();

    if (!csvContent) {
      throw new Error('CSV content is required');
    }

    // Parse CSV content
    const lines = csvContent.split('\n');
    const headers = lines[0].replace(/^\ufeff/, '').split(','); // Remove BOM if exists
    
    console.log('Headers:', headers);

    const products = [];
    let totalRows = 0;
    let skippedRows = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      totalRows++;

      // Split by comma but handle quotes
      const values: string[] = [];
      let currentValue = '';
      let insideQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      if (values.length < 21) { 
        skippedRows++; 
        continue; // Skip incomplete rows
      }

      const parsePercentage = (value: string): number => {
        if (!value || value === '') return 0;
        const cleaned = value.replace('%', '').trim();
        return parseFloat(cleaned) || 0;
      };

      const product = {
        product_type: values[0] || '',
        track_name: values[1] || '',
        company: values[2] || '',
        product_code: values[3] || '',
        exposure_stocks: parsePercentage(values[4]),
        exposure_foreign: parsePercentage(values[5]),
        exposure_foreign_currency: parsePercentage(values[6]),
        exposure_government_bonds: parsePercentage(values[7]),
        exposure_corporate_bonds_tradable: parsePercentage(values[8]),
        exposure_corporate_bonds_non_tradable: parsePercentage(values[9]),
        exposure_stocks_options: parsePercentage(values[10]),
        exposure_deposits: parsePercentage(values[11]),
        exposure_loans: parsePercentage(values[12]),
        exposure_cash: parsePercentage(values[13]),
        exposure_mutual_funds: parsePercentage(values[14]),
        exposure_other_assets: parsePercentage(values[15]),
        exposure_liquid_assets: parsePercentage(values[16]),
        exposure_non_liquid_assets: parsePercentage(values[17]),
        exposure_israel: parsePercentage(values[18]),
        exposure_foreign_and_currency: parsePercentage(values[19]),
        source: values[20] || ''
      };

      products.push(product);
    }

    console.log(`Parsed ${products.length} products`);

    // Delete existing data
    const { error: deleteError } = await supabase
      .from('products_information')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Error deleting existing products:', deleteError);
      throw deleteError;
    }

    // Insert new data in batches of 100
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('products_information')
        .insert(batch);

      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize}:`, insertError);
        throw insertError;
      }
      
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${products.length} products`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully imported ${products.length} products. Skipped ${skippedRows} invalid rows.`,
        stats: {
          total: totalRows,
          inserted: products.length,
          skipped: skippedRows
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error importing products:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
