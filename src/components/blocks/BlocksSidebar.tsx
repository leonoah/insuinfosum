import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  PieChart, 
  TrendingUp, 
  Table, 
  AlertTriangle, 
  CheckCircle2, 
  CheckSquare, 
  PenTool, 
  ArrowRight,
  Layers,
  Eye,
  Plus
} from "lucide-react";
import { blockTemplates, documentTemplates } from "@/data/blockTemplates";
import { BlockTemplate } from "@/types/blocks";

const iconMap = {
  FileText, 
  PieChart, 
  TrendingUp, 
  Table, 
  AlertTriangle, 
  CheckCircle2, 
  CheckSquare, 
  PenTool, 
  ArrowRight
};

interface BlocksSidebarProps {
  onAddBlock: (template: BlockTemplate, variant?: string) => void;
  onLoadTemplate: (templateKey: string) => void;
}

const BlocksSidebar = ({ onAddBlock, onLoadTemplate }: BlocksSidebarProps) => {
  const [selectedVariant, setSelectedVariant] = useState<{[key: string]: string}>({});
  const [previewBlock, setPreviewBlock] = useState<string | null>(null);

  const handleAddBlock = (template: BlockTemplate) => {
    const variant = selectedVariant[template.id] || template.defaultVariant;
    onAddBlock(template, variant);
  };

  const handleVariantChange = (blockId: string, variant: string) => {
    setSelectedVariant(prev => ({
      ...prev,
      [blockId]: variant
    }));
  };

  return (
    <Card className="w-80 h-full glass border-glass-border rounded-2xl overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="h-5 w-5 text-primary" />
          ספריית בלוקים
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          גרור בלוקים למסמך או לחץ להוספה
        </p>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-6 space-y-6">
            
            {/* Quick Templates */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                טמפלטים מוכנים
              </h3>
              <div className="space-y-2">
                {Object.entries(documentTemplates).map(([key, template]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => onLoadTemplate(key)}
                    className="w-full justify-start text-right border-glass-border bg-glass hover:bg-glass/80"
                  >
                    <FileText className="h-3 w-3 ml-2" />
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Individual Blocks */}
            <div>
              <h3 className="font-medium mb-3">בלוקים בודדים</h3>
              <div className="space-y-4">
                {blockTemplates.map((template) => {
                  const IconComponent = iconMap[template.icon as keyof typeof iconMap];
                  const currentVariant = selectedVariant[template.id] || template.defaultVariant;
                  
                  return (
                    <div 
                      key={template.id}
                      className="p-4 border border-glass-border rounded-xl bg-glass/50 hover:bg-glass/80 transition-colors cursor-pointer"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          template,
                          variant: currentVariant
                        }));
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {IconComponent && <IconComponent className="h-4 w-4 text-primary" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm mb-1">{template.title}</h4>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {template.description}
                          </p>
                          
                          {/* Variants */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {Object.keys(template.variants).map((variant) => (
                              <Badge
                                key={variant}
                                variant={currentVariant === variant ? "default" : "outline"}
                                className={`text-xs cursor-pointer ${
                                  currentVariant === variant 
                                    ? "bg-primary text-primary-foreground" 
                                    : "border-glass-border hover:bg-muted/50"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVariantChange(template.id, variant);
                                }}
                              >
                                {variant === 'short' ? 'קצר' : 
                                 variant === 'full' ? 'מלא' : 'טכני'}
                              </Badge>
                            ))}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddBlock(template);
                              }}
                              className="flex-1 text-xs border-glass-border bg-glass hover:bg-glass/80"
                            >
                              <Plus className="h-3 w-3 ml-1" />
                              הוסף
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewBlock(previewBlock === template.id ? null : template.id);
                              }}
                              className="px-2"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Preview */}
                          {previewBlock === template.id && (
                            <div className="mt-3 p-3 bg-muted/20 rounded-lg border text-xs">
                              <div className="text-muted-foreground mb-1">תצוגה מקדימה:</div>
                              <div className="line-clamp-3">
                                {template.variants[currentVariant as keyof typeof template.variants]}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default BlocksSidebar;