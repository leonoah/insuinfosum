import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Wand2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SelectedProduct } from "@/types/products";

interface AIProductEditorProps {
  product: SelectedProduct;
  onUpdate: (updatedProduct: SelectedProduct) => void;
}

export function AIProductEditor({ product, onUpdate }: AIProductEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<SelectedProduct | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('edit-product-with-ai', {
        body: { product, command }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setPreviewProduct(data.updatedProduct);
      toast.success("המוצר עודכן! בדוק את השינויים ואשר");
    } catch (error) {
      console.error('Error editing product:', error);
      toast.error("שגיאה בעריכת המוצר");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = () => {
    if (previewProduct) {
      onUpdate(previewProduct);
      toast.success("השינויים נשמרו בהצלחה");
      setIsOpen(false);
      setCommand("");
      setPreviewProduct(null);
    }
  };

  const handleReject = () => {
    setPreviewProduct(null);
    toast.info("השינויים בוטלו");
  };

  const renderProductComparison = () => {
    if (!previewProduct) return null;

    const changes: Array<{ field: string; label: string; old: any; new: any }> = [];

    // בדוק שינויים בשדות
    const fields = [
      { key: 'category', label: 'סוג מוצר' },
      { key: 'subCategory', label: 'תת-קטגוריה' },
      { key: 'company', label: 'חברה' },
      { key: 'amount', label: 'סכום' },
      { key: 'investmentTrack', label: 'מסלול השקעה' },
      { key: 'managementFeeOnDeposit', label: 'דמי ניהול הפקדה' },
      { key: 'managementFeeOnAccumulation', label: 'דמי ניהול צבירה' },
      { key: 'returns', label: 'תשואה' },
      { key: 'notes', label: 'הערות' },
    ];

    fields.forEach(({ key, label }) => {
      const oldVal = (product as any)[key];
      const newVal = (previewProduct as any)[key];
      if (oldVal !== newVal && newVal !== undefined) {
        changes.push({ field: key, label, old: oldVal, new: newVal });
      }
    });

    return (
      <div className="space-y-3 mt-4">
        <h4 className="font-semibold text-sm">שינויים שזוהו:</h4>
        {changes.length === 0 ? (
          <p className="text-sm text-muted-foreground">לא נמצאו שינויים</p>
        ) : (
          <div className="space-y-2">
            {changes.map((change) => (
              <div key={change.field} className="flex items-center gap-2 text-sm border-b pb-2">
                <span className="font-medium min-w-[120px]">{change.label}:</span>
                <span className="text-muted-foreground line-through">{change.old || "ריק"}</span>
                <span className="text-primary font-medium">→ {change.new}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <Button onClick={handleApprove} size="sm" className="flex-1">
            <Check className="w-4 h-4 ml-2" />
            אשר שינויים
          </Button>
          <Button onClick={handleReject} variant="outline" size="sm" className="flex-1">
            <X className="w-4 h-4 ml-2" />
            בטל
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        title="ערוך עם AI"
      >
        <Wand2 className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>עריכת מוצר עם AI</DialogTitle>
            <DialogDescription>
              תאר מה תרצה לשנות במוצר בשפה טבעית
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">המוצר הנוכחי:</p>
              <p>{product.company} - {product.category}</p>
              {product.investmentTrack && (
                <p className="text-muted-foreground">מסלול: {product.investmentTrack}</p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder='למשל: "תשנה לי הראל במסלול מניות" או "תשנה דמי ניהול ל-0.3"'
                disabled={isProcessing || !!previewProduct}
                className="text-right"
              />
              {!previewProduct && (
                <Button type="submit" disabled={isProcessing || !command.trim()} className="w-full">
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      מעבד...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 ml-2" />
                      עדכן מוצר
                    </>
                  )}
                </Button>
              )}
            </form>

            {renderProductComparison()}

            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              <p className="font-medium">דוגמאות לפקודות:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>תשנה לי הראל במסלול מניות</li>
                <li>תשנה את דמי הניהול ל-0.3</li>
                <li>תעדכן צבירה ל-500000</li>
                <li>תשנה למגדל</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}