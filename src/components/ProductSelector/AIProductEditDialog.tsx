import React, { useState } from 'react';
import { Wand2, Check, X, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectedProduct } from '@/types/products';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIProductEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentProduct: Partial<SelectedProduct>;
  onApplyChanges: (updatedProduct: SelectedProduct) => void;
  allProducts: SelectedProduct[];
}

export const AIProductEditDialog: React.FC<AIProductEditDialogProps> = ({
  isOpen,
  onClose,
  currentProduct,
  onApplyChanges,
  allProducts
}) => {
  const { toast } = useToast();
  const [aiCommand, setAiCommand] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<SelectedProduct | null>(null);

  const handleAIEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aiCommand.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא הכנס פקודה לעריכת המוצר",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingAI(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('edit-product-with-ai', {
        body: {
          product: currentProduct,
          command: aiCommand,
          allProducts: allProducts
        }
      });

      if (error) throw error;

      if (data?.updatedProduct) {
        setPreviewProduct(data.updatedProduct);
        toast({
          title: "שינויים מוצעים",
          description: "בדוק את השינויים ואשר או בטל אותם",
        });
      } else {
        toast({
          title: "שגיאה",
          description: "לא ניתן היה לעבד את הפקודה",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing AI command:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעיבוד הפקודה",
        variant: "destructive"
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleApproveAIChanges = () => {
    if (previewProduct) {
      onApplyChanges(previewProduct);
      setPreviewProduct(null);
      setAiCommand("");
      onClose();
      toast({
        title: "השינויים אושרו",
        description: "המוצר עודכן בהצלחה",
      });
    }
  };

  const handleRejectAIChanges = () => {
    setPreviewProduct(null);
    setAiCommand("");
  };

  const handleClose = () => {
    setPreviewProduct(null);
    setAiCommand("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader className="space-y-3 pb-4 border-b border-primary/20">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-primary" />
            <span>עריכה מהירה עם AI</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-right">
            תאר כאן מה תרצה לשנות במוצר בשפה טבעית
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <form onSubmit={handleAIEdit} className="space-y-4">
            <Input
              value={aiCommand}
              onChange={(e) => setAiCommand(e.target.value)}
              placeholder='למשל: "תשנה לי הראל במסלול מניות" או "תשנה דמי ניהול ל-0.3"'
              disabled={isProcessingAI || !!previewProduct}
              className="text-right h-12 text-base bg-background/50 border-primary/30 focus:border-primary"
            />
            {!previewProduct && (
              <Button 
                type="submit" 
                disabled={isProcessingAI || !aiCommand.trim()} 
                className="w-full h-11"
              >
                {isProcessingAI ? (
                  <>מעבד...</>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 ml-2" />
                    עדכן מוצר
                  </>
                )}
              </Button>
            )}
          </form>

          {previewProduct && (
            <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/30">
              <h5 className="font-semibold text-sm flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                שינויים מוצעים:
              </h5>
              {(() => {
                const changes: Array<{ label: string; old: any; new: any }> = [];
                const fields = [
                  { key: 'category', label: 'סוג מוצר' },
                  { key: 'subCategory', label: 'תת-קטגוריה' },
                  { key: 'company', label: 'חברה' },
                  { key: 'amount', label: 'סכום' },
                  { key: 'investmentTrack', label: 'מסלול השקעה' },
                  { key: 'managementFeeOnDeposit', label: 'דמי ניהול הפקדה' },
                  { key: 'managementFeeOnAccumulation', label: 'דמי ניהול צבירה' },
                  { key: 'returns', label: 'תשואה' },
                ];

                fields.forEach(({ key, label }) => {
                  const oldVal = (currentProduct as any)[key];
                  const newVal = (previewProduct as any)[key];
                  if (oldVal !== newVal && newVal !== undefined) {
                    changes.push({ label, old: oldVal, new: newVal });
                  }
                });

                return changes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">לא נמצאו שינויים</p>
                ) : (
                  <div className="space-y-2">
                    {changes.map((change, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm border-b border-border/50 pb-2">
                        <span className="font-medium min-w-[140px] text-right">{change.label}:</span>
                        <span className="text-muted-foreground line-through">{change.old || "ריק"}</span>
                        <span className="text-primary font-medium">→ {change.new}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div className="flex gap-3 mt-4">
                <Button onClick={handleApproveAIChanges} className="flex-1 h-10">
                  <Check className="w-4 h-4 ml-2" />
                  אשר שינויים
                </Button>
                <Button onClick={handleRejectAIChanges} variant="outline" className="flex-1 h-10">
                  <X className="w-4 h-4 ml-2" />
                  בטל
                </Button>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t border-border/50">
            <p className="font-medium">דוגמאות לפקודות:</p>
            <ul className="list-disc list-inside space-y-1 pr-4">
              <li>תשנה לי הראל במסלול מניות</li>
              <li>תשנה את דמי הניהול ל-0.3</li>
              <li>תעדכן צבירה ל-500000</li>
              <li>תשנה למגדל</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
