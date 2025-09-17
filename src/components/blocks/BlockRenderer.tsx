import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  Edit2,
  Save,
  X,
  GripVertical
} from "lucide-react";
import { DocumentBlock } from "@/types/blocks";

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

interface BlockRendererProps {
  block: DocumentBlock;
  onEdit: (blockId: string, content: any) => void;
  onDelete: (blockId: string) => void;
  onMove: (blockId: string, direction: 'up' | 'down') => void;
  isDragging?: boolean;
}

const BlockRenderer = ({ block, onEdit, onDelete, onMove, isDragging }: BlockRendererProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(block.content);

  const handleSave = () => {
    onEdit(block.id, editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(block.content);
    setIsEditing(false);
  };

  const IconComponent = iconMap[block.type === 'opening' ? 'FileText' :
                               block.type === 'current-analysis' ? 'PieChart' :
                               block.type === 'recommended-analysis' ? 'TrendingUp' :
                               block.type === 'comparison-table' ? 'Table' :
                               block.type === 'disclosure' ? 'AlertTriangle' :
                               block.type === 'agent-recommendations' ? 'CheckCircle2' :
                               block.type === 'decisions' ? 'CheckSquare' :
                               block.type === 'signature' ? 'PenTool' :
                               block.type === 'call-to-action' ? 'ArrowRight' : 'FileText'];

  const getBlockTypeLabel = (type: string) => {
    const labels = {
      'opening': 'פתיחה ורקע',
      'current-analysis': 'ניתוח מצב קיים',
      'recommended-analysis': 'המלצה חדשה',
      'comparison-table': 'טבלת השוואה',
      'disclosure': 'גילוי נאות',
      'agent-recommendations': 'המלצות הסוכן',
      'decisions': 'החלטות שהתקבלו',
      'signature': 'ברכה וחתימה',
      'call-to-action': 'קריאה לפעולה',
      'auto-summary': 'סיכום אוטומטי'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getBlockColor = (type: string) => {
    const colors = {
      'opening': 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
      'current-analysis': 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
      'recommended-analysis': 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
      'comparison-table': 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
      'disclosure': 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
      'agent-recommendations': 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
      'decisions': 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800',
      'signature': 'bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800',
      'call-to-action': 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800';
  };

  return (
    <Card 
      className={`glass border-glass-border rounded-2xl transition-all duration-200 group hover:shadow-lg ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${block.isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {IconComponent && <IconComponent className="h-5 w-5 text-primary" />}
            {block.title || getBlockTypeLabel(block.type)}
            {block.variant && (
              <Badge variant="outline" className="text-xs border-glass-border">
                {block.variant === 'short' ? 'קצר' : 
                 block.variant === 'full' ? 'מלא' : 'טכני'}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(block.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
            
            <div className="cursor-move p-1">
              <GripVertical className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            {block.type === 'comparison-table' ? (
              <div className="space-y-3">
                <Input
                  placeholder="כותרת הטבלה"
                  value={editContent.title || ''}
                  onChange={(e) => setEditContent({...editContent, title: e.target.value})}
                />
                <Textarea
                  placeholder="תוכן הטבלה או הסבר"
                  value={editContent.description || ''}
                  onChange={(e) => setEditContent({...editContent, description: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>
            ) : (
              <Textarea
                value={typeof editContent === 'string' ? editContent : editContent.text || ''}
                onChange={(e) => setEditContent(
                  typeof editContent === 'string' 
                    ? e.target.value 
                    : {...editContent, text: e.target.value}
                )}
                className="min-h-[120px] resize-none"
                placeholder="ערוך את תוכן הבלוק..."
              />
            )}
            
            <div className="flex gap-2 justify-end">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCancel}
                className="border-glass-border"
              >
                <X className="h-3 w-3 ml-1" />
                ביטול
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="h-3 w-3 ml-1" />
                שמור
              </Button>
            </div>
          </div>
        ) : (
          <div className={`p-4 rounded-lg border ${getBlockColor(block.type)}`}>
            {block.type === 'comparison-table' ? (
              <div className="space-y-3">
                {block.content.title && (
                  <h4 className="font-medium">{block.content.title}</h4>
                )}
                <div className="text-sm text-muted-foreground">
                  {block.content.description || 'טבלת השוואה מפורטת בין המצב הנוכחי למומלץ'}
                </div>
                <div className="bg-background/50 p-3 rounded border text-xs">
                  <div className="grid grid-cols-4 gap-2 font-medium mb-2">
                    <div>מוצר</div>
                    <div>מצב נוכחי</div>
                    <div>מומלץ</div>
                    <div>שינוי</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-muted-foreground">
                    <div>אג"ח</div>
                    <div>40%</div>
                    <div>35%</div>
                    <div>-5%</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {typeof block.content === 'string' ? block.content : block.content.text || block.content}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BlockRenderer;