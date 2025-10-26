import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

export function CSVAutoImport() {
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    checkIfDataExists();
  }, []);

  const checkIfDataExists = async () => {
    try {
      const { count, error } = await supabase
        .from('products_information')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      setHasData((count || 0) > 0);
    } catch (error) {
      console.error("Error checking data:", error);
    }
  };

  const handleAutoImport = async () => {
    try {
      setLoading(true);
      toast.info("מתחיל ייבוא נתונים...");

      // Load CSV file from public directory
      const response = await fetch('/all_funds_exposures_wide.csv');
      const csvContent = await response.text();

      // Call edge function to import
      const importResponse = await fetch(
        'https://eoodkccjwyybwgmkzarx.supabase.co/functions/v1/import-products-csv',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ csvContent })
        }
      );

      const result = await importResponse.json();
      
      if (!importResponse.ok) {
        throw new Error(result.error || 'Failed to import CSV');
      }

      setHasData(true);
      const statsMsg = result?.stats ? ` (סה"כ: ${result.stats.total}, הוכנסו: ${result.stats.inserted}, דולגו: ${result.stats.skipped})` : '';
      toast.success(`${result.message || "הנתונים יובאו בהצלחה!"}${statsMsg}`);
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast.error("שגיאה בייבוא הנתונים");
    } finally {
      setLoading(false);
    }
  };

  if (hasData) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted">
      <div className="flex-1">
        <h3 className="font-semibold">טעינת נתוני מוצרים</h3>
        <p className="text-sm text-muted-foreground">
          לחץ לייבוא אוטומטי של נתוני המוצרים מקובץ ה-CSV
        </p>
      </div>
      <Button
        onClick={handleAutoImport}
        disabled={loading}
        variant="default"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            מייבא...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 ml-2" />
            ייבא נתונים
          </>
        )}
      </Button>
    </div>
  );
}
