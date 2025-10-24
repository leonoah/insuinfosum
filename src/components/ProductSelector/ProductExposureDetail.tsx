import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DetailedExposureData } from "@/types/pension";

interface ProductExposureDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exposure: DetailedExposureData;
  productName: string;
}

const formatPercent = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-';
  return `${value.toFixed(2)}%`;
};

export function ProductExposureDetail({ open, onOpenChange, exposure, productName }: ProductExposureDetailProps) {
  const exposureItems = [
    { label: "מניות", value: exposure.exposureStocks, highlight: true },
    { label: "אג\"ח (ממוצע)", value: exposure.exposureBonds, highlight: true },
    { label: "חשיפה לחו\"ל", value: exposure.exposureForeign, highlight: true },
    { label: "חשיפה לישראל", value: exposure.exposureIsrael, highlight: true },
    { label: "---", value: null },
    { label: "אג\"ח ממשלתיות סחירות", value: exposure.govBondsMarketable },
    { label: "אג\"ח קונצרני סחיר", value: exposure.corpBondsMarketable },
    { label: "אג\"ח קונצרניות לא סחירות", value: exposure.corpBondsNonMarketable },
    { label: "---", value: null },
    { label: "פיקדונות", value: exposure.deposits },
    { label: "הלוואות", value: exposure.loans },
    { label: "מזומנים", value: exposure.cash },
    { label: "קרנות נאמנות", value: exposure.mutualFunds },
    { label: "נכסים אחרים", value: exposure.otherAssets },
    { label: "---", value: null },
    { label: "נכסים סחירים ונזילים", value: exposure.marketableAssets },
    { label: "נכסים לא סחירים", value: exposure.nonMarketableAssets },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">
            פירוט חשיפות - {productName}
          </DialogTitle>
          {exposure.reportDate && (
            <p className="text-sm text-muted-foreground text-right">
              תאריך דוח: {exposure.reportDate}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {exposureItems.map((item, index) => {
            if (item.value === null) {
              return (
                <div key={index} className="border-t border-border my-3" />
              );
            }

            if (item.value === undefined || item.value === 0) {
              return null;
            }

            return (
              <div
                key={index}
                className={`flex justify-between items-center py-2 px-3 rounded ${
                  item.highlight
                    ? "bg-primary/5 font-medium"
                    : "bg-muted/30"
                }`}
              >
                <span className="text-sm">{item.label}</span>
                <span className={`text-sm ${item.highlight ? "font-semibold" : ""}`}>
                  {formatPercent(item.value)}
                </span>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
