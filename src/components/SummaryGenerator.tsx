import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Copy, Mail, MessageCircle, Download, Check, User, Phone, MapPin, Calendar, FileText, AlertTriangle, CheckCircle, Clock, Shield, Layers, Layout } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import agentLogo from "@/assets/agent-logo.png";
import BlocksSidebar from "./blocks/BlocksSidebar";
import BlockRenderer from "./blocks/BlockRenderer";
import { BlockTemplate, DocumentBlock } from "@/types/blocks";
import { blockTemplates, documentTemplates } from "@/data/blockTemplates";
import { SelectedProduct } from "@/types/insurance";

interface FormData {
  clientName: string;
  clientId: string;
  clientPhone: string;
  clientEmail: string;
  meetingDate: string;
  topics: string[];
  currentSituation: string;
  risks: string;
  recommendations: string[];
  estimatedCost: string;
  products: SelectedProduct[];
  decisions: string;
  documents: string[];
  timeframes: string;
  approvals: string;
}

interface SummaryGeneratorProps {
  formData: FormData;
  onBack: () => void;
}

const SummaryGenerator = ({ formData, onBack }: SummaryGeneratorProps) => {
  const { toast } = useToast();
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'classic' | 'blocks'>('classic');
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showFinalReport, setShowFinalReport] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const generateSummaryText = () => {
    const summaryParts = [];
    const currentProducts = formData.products?.filter(p => p.type === 'current') || [];
    const recommendedProducts = formData.products?.filter(p => p.type === 'recommended') || [];

    // Header
    summaryParts.push(`נושא: סיכום פגישת ביטוח – ${formData.clientName} – ${formatDate(formData.meetingDate)}`);
    summaryParts.push('');
    summaryParts.push(`שלום ${formData.clientName},`);
    summaryParts.push('');
    summaryParts.push('להלן סיכום הפגישה שלנו:');
    summaryParts.push('');

    // Client details
    summaryParts.push('פרטי הלקוח:');
    summaryParts.push(`• שם: ${formData.clientName}`);
    summaryParts.push(`• טלפון: ${formData.clientPhone}`);
    summaryParts.push(`• אימייל: ${formData.clientEmail}`);
    if (formData.topics.length > 0) {
      summaryParts.push(`• נושאים שנדונו: ${formData.topics.join(', ')}`);
    }
    summaryParts.push('');

    // Current products
    if (currentProducts.length > 0) {
      summaryParts.push('מצב קיים - מוצרים פיננסיים:');
      currentProducts.forEach((product, index) => {
        summaryParts.push(`${index + 1}. ${product.productName} - ${product.company}`);
        summaryParts.push(`   • סוג מסלול: ${product.subType}`);
        summaryParts.push(`   • סכום צבירה: ₪${product.amount.toLocaleString()}`);
        summaryParts.push(`   • דמי ניהול: ${product.managementFeeOnDeposit}% מהפקדה, ${product.managementFeeOnAccumulation}% מצבירה`);
        if (product.investmentTrack) {
          summaryParts.push(`   • מסלול השקעה: ${product.investmentTrack}`);
        }
        if (product.notes) {
          summaryParts.push(`   • הערות: ${product.notes}`);
        }
        summaryParts.push('');
      });
    }

    // Portfolio comparison section
    if (currentProducts.length > 0 || recommendedProducts.length > 0) {
      summaryParts.push('השוואת תיקים:');
      summaryParts.push('');
      
      const totalCurrentAmount = currentProducts.reduce((sum, p) => sum + p.amount, 0);
      const totalRecommendedAmount = recommendedProducts.reduce((sum, p) => sum + p.amount, 0);
      const amountDifference = totalRecommendedAmount - totalCurrentAmount;
      
      summaryParts.push('┌──────────────────────────────────────────────────────────────┐');
      summaryParts.push('│                       השוואת תיקים                          │');
      summaryParts.push('├──────────────────────────────────────────────────────────────┤');
      summaryParts.push(`│ מצב קיים:        ₪${totalCurrentAmount.toLocaleString().padStart(20)} │`);
      summaryParts.push(`│ מצב מוצע:        ₪${totalRecommendedAmount.toLocaleString().padStart(20)} │`);
      summaryParts.push(`│ הפרש:           ${amountDifference >= 0 ? '+' : ''}₪${amountDifference.toLocaleString().padStart(20)} │`);
      summaryParts.push('├──────────────────────────────────────────────────────────────┤');
      summaryParts.push(`│ מוצרים קיימים:                                     ${currentProducts.length.toString().padStart(2)} │`);
      summaryParts.push(`│ מוצרים מוצעים:                                     ${recommendedProducts.length.toString().padStart(2)} │`);
      
      if (currentProducts.length > 0) {
        const avgCurrentDepositFee = currentProducts.reduce((sum, p) => sum + p.managementFeeOnDeposit, 0) / currentProducts.length;
        const avgCurrentAccumulationFee = currentProducts.reduce((sum, p) => sum + p.managementFeeOnAccumulation, 0) / currentProducts.length;
        summaryParts.push(`│ ממוצע דמי ניהול קיימים:       ${avgCurrentDepositFee.toFixed(2)}% / ${avgCurrentAccumulationFee.toFixed(2)}% │`);
      }
      
      if (recommendedProducts.length > 0) {
        const avgRecommendedDepositFee = recommendedProducts.reduce((sum, p) => sum + p.managementFeeOnDeposit, 0) / recommendedProducts.length;
        const avgRecommendedAccumulationFee = recommendedProducts.reduce((sum, p) => sum + p.managementFeeOnAccumulation, 0) / recommendedProducts.length;
        summaryParts.push(`│ ממוצע דמי ניהול מוצעים:       ${avgRecommendedDepositFee.toFixed(2)}% / ${avgRecommendedAccumulationFee.toFixed(2)}% │`);
      }
      
      summaryParts.push('└──────────────────────────────────────────────────────────────┘');
      summaryParts.push('');
    }

    // Agent recommendations
    if (formData.currentSituation || formData.risks || formData.recommendations.some(r => r.trim()) || recommendedProducts.length > 0) {
      summaryParts.push('המלצות הסוכן:');
      
      if (formData.currentSituation) {
        summaryParts.push(`• מצב קיים כללי: ${formData.currentSituation}`);
      }
      
      if (formData.risks) {
        summaryParts.push(`• פערים/סיכונים: ${formData.risks}`);
      }

      // Recommended products
      if (recommendedProducts.length > 0) {
        summaryParts.push('• המלצות מוצרים חדשים:');
        recommendedProducts.forEach((product, index) => {
          summaryParts.push(`  ${index + 1}. ${product.productName} - ${product.company}`);
          summaryParts.push(`     - סוג מסלול: ${product.subType}`);
          summaryParts.push(`     - סכום צבירה: ₪${product.amount.toLocaleString()}`);
          summaryParts.push(`     - דמי ניהול: ${product.managementFeeOnDeposit}% מהפקדה, ${product.managementFeeOnAccumulation}% מצבירה`);
          if (product.investmentTrack) {
            summaryParts.push(`     - מסלול השקעה: ${product.investmentTrack}`);
          }
          if (product.riskLevelChange) {
            summaryParts.push(`     - שינוי רמת סיכון: ${product.riskLevelChange}`);
          }
          if (product.notes) {
            summaryParts.push(`     - הערות: ${product.notes}`);
          }
        });
      }
      
      const validRecommendations = formData.recommendations.filter(r => r.trim());
      if (validRecommendations.length > 0) {
        summaryParts.push('• המלצות נוספות:');
        validRecommendations.forEach(rec => {
          summaryParts.push(`  - ${rec}`);
        });
      }
      
      if (formData.estimatedCost) {
        summaryParts.push(`• הערכת עלות: ${formData.estimatedCost}`);
      }
      
      summaryParts.push('');
    }

    // Decisions
    if (formData.decisions) {
      summaryParts.push('החלטות שהתקבלו:');
      summaryParts.push(`${formData.decisions}`);
      summaryParts.push('');
    }

    // Documents and actions
    if (formData.documents.length > 0 || formData.timeframes || formData.approvals) {
      summaryParts.push('פעולות נדרשות:');
      
      if (formData.documents.length > 0) {
        summaryParts.push('• מסמכים להכנה:');
        formData.documents.forEach(doc => {
          summaryParts.push(`  - ${doc}`);
        });
      }
      
      if (formData.timeframes) {
        summaryParts.push(`• לוח זמנים: ${formData.timeframes}`);
      }
      
      if (formData.approvals) {
        summaryParts.push(`• אישורים נדרשים: ${formData.approvals}`);
      }
      
      summaryParts.push('');
    }

    // Footer
    summaryParts.push('בברכה,');
    summaryParts.push('הסוכן שלכם');
    summaryParts.push('טלפון: [טלפון הסוכן]');
    summaryParts.push('אימייל: [אימייל הסוכן]');

    return summaryParts.join('\n');
  };

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(itemId));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
      
      toast({
        title: "הועתק ללוח",
        description: "הטקסט הועתק בהצלחה",
      });
    } catch (err) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להעתיק ללוח",
        variant: "destructive"
      });
    }
  };

  const sendEmail = () => {
    const subject = encodeURIComponent(`סיכום פגישת ביטוח – ${formData.clientName} – ${formatDate(formData.meetingDate)}`);
    const body = encodeURIComponent(generateSummaryText());
    const mailtoLink = `mailto:${formData.clientEmail}?subject=${subject}&body=${body}`;
    window.open(mailtoLink);
  };

  const sendWhatsApp = () => {
    const text = encodeURIComponent(generateSummaryText());
    const whatsappLink = `https://wa.me/?text=${text}`;
    window.open(whatsappLink, '_blank');
  };

  const downloadPDF = async () => {
    try {
      // Create new PDF document with RTL support
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Use default font for Hebrew support
      pdf.setFont('helvetica');
      
      let yPosition = 30;
      const pageWidth = 210; // A4 width in mm
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Helper function to add Hebrew text (right-to-left)
      const addHebrewText = (text: string, x: number, y: number, fontSize = 12, isBold = false) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        // For Hebrew text, we'll use the text as-is since jsPDF handles RTL
        pdf.text(text, x, y, { align: 'right' });
      };

      // Header with logo placeholder and title
      pdf.setFillColor(59, 130, 246); // Blue header background
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255); // White text
      addHebrewText('סיכום פגישת ביטוח', pageWidth - margin, 20, 18, true);
      addHebrewText(formatDate(formData.meetingDate), pageWidth - margin, 30, 12);

      yPosition = 50;
      pdf.setTextColor(0, 0, 0); // Reset to black

      // Client information section
      pdf.setFillColor(248, 250, 252); // Light gray background
      pdf.rect(margin, yPosition, contentWidth, 35, 'F');
      
      yPosition += 10;
      addHebrewText('פרטי הלקוח', pageWidth - margin, yPosition, 14, true);
      yPosition += 8;
      
      addHebrewText(`שם: ${formData.clientName}`, pageWidth - margin, yPosition, 11);
      yPosition += 6;
      addHebrewText(`טלפון: ${formData.clientPhone}`, pageWidth - margin, yPosition, 11);
      yPosition += 6;
      addHebrewText(`אימייל: ${formData.clientEmail}`, pageWidth - margin, yPosition, 11);
      
      if (formData.topics.length > 0) {
        yPosition += 6;
        addHebrewText(`נושאים: ${formData.topics.join(', ')}`, pageWidth - margin, yPosition, 11);
      }

      yPosition += 15;

      // Portfolio comparison section
      const totalCurrentAmount = formData.products?.filter(p => p.type === 'current').reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalRecommendedAmount = formData.products?.filter(p => p.type === 'recommended').reduce((sum, p) => sum + p.amount, 0) || 0;
      const amountDifference = totalRecommendedAmount - totalCurrentAmount;
      
      if (totalCurrentAmount > 0 || totalRecommendedAmount > 0) {
        pdf.setFillColor(240, 248, 255); // Very light blue
        pdf.rect(margin, yPosition, contentWidth, 45, 'F');  
        yPosition += 8;
        addHebrewText('השוואת תיקים', pageWidth - margin, yPosition, 14, true);
        yPosition += 10;
        
        // Create comparison table
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        
        const tableY = yPosition;
        const rowHeight = 8;
        const colWidths = [contentWidth * 0.4, contentWidth * 0.3, contentWidth * 0.3];
        let currentX = margin;
        
        // Table headers
        pdf.rect(currentX, tableY, colWidths[0], rowHeight);
        pdf.rect(currentX + colWidths[0], tableY, colWidths[1], rowHeight);
        pdf.rect(currentX + colWidths[0] + colWidths[1], tableY, colWidths[2], rowHeight);
        
        addHebrewText('קטגוריה', currentX + colWidths[0] - 5, tableY + 5, 10, true);
        addHebrewText('מצב קיים', currentX + colWidths[0] + colWidths[1] - 5, tableY + 5, 10, true);
        addHebrewText('מצב מוצע', currentX + colWidths[0] + colWidths[1] + colWidths[2] - 5, tableY + 5, 10, true);
        
        // Row 1: Total amounts
        yPosition = tableY + rowHeight;
        pdf.rect(currentX, yPosition, colWidths[0], rowHeight);
        pdf.rect(currentX + colWidths[0], yPosition, colWidths[1], rowHeight);
        pdf.rect(currentX + colWidths[0] + colWidths[1], yPosition, colWidths[2], rowHeight);
        
        addHebrewText('סה"כ צבירה', currentX + colWidths[0] - 5, yPosition + 5, 9);
        addHebrewText(`₪${totalCurrentAmount.toLocaleString()}`, currentX + colWidths[0] + colWidths[1] - 5, yPosition + 5, 9);
        addHebrewText(`₪${totalRecommendedAmount.toLocaleString()}`, currentX + colWidths[0] + colWidths[1] + colWidths[2] - 5, yPosition + 5, 9);
        
        // Row 2: Number of products
        yPosition += rowHeight;
        pdf.rect(currentX, yPosition, colWidths[0], rowHeight);
        pdf.rect(currentX + colWidths[0], yPosition, colWidths[1], rowHeight);
        pdf.rect(currentX + colWidths[0] + colWidths[1], yPosition, colWidths[2], rowHeight);
        
        const currentCount = formData.products?.filter(p => p.type === 'current').length || 0;
        const recommendedCount = formData.products?.filter(p => p.type === 'recommended').length || 0;
        
        addHebrewText('מספר מוצרים', currentX + colWidths[0] - 5, yPosition + 5, 9);
        addHebrewText(currentCount.toString(), currentX + colWidths[0] + colWidths[1] - 5, yPosition + 5, 9);
        addHebrewText(recommendedCount.toString(), currentX + colWidths[0] + colWidths[1] + colWidths[2] - 5, yPosition + 5, 9);
        
        yPosition += rowHeight + 5;
        
        // Difference summary
        if (amountDifference !== 0) {
          pdf.setFillColor(amountDifference >= 0 ? 240 : 254, amountDifference >= 0 ? 253 : 242, amountDifference >= 0 ? 244 : 242);
          pdf.rect(margin, yPosition, contentWidth, 10, 'F');
          yPosition += 3;
          const differenceText = `הפרש: ${amountDifference >= 0 ? '+' : ''}₪${amountDifference.toLocaleString()}`;
          addHebrewText(differenceText, pageWidth - margin, yPosition, 11, true);
          yPosition += 10;
        }
      }

      // Current situation section
      if (formData.currentSituation) {
        pdf.setFillColor(239, 246, 255); // Light blue
        pdf.rect(margin, yPosition, contentWidth, 20, 'F');
        yPosition += 8;
        addHebrewText('מצב קיים', pageWidth - margin, yPosition, 12, true);
        yPosition += 7;
        
        // Split long text into lines
        const situationLines = pdf.splitTextToSize(formData.currentSituation, contentWidth - 10);
        situationLines.forEach((line: string) => {
          addHebrewText(line, pageWidth - margin, yPosition, 10);
          yPosition += 5;
        });
        yPosition += 10;
      }

      // Risks section
      if (formData.risks) {
        pdf.setFillColor(254, 242, 242); // Light red
        pdf.rect(margin, yPosition, contentWidth, 20, 'F');
        yPosition += 8;
        addHebrewText('פערים וסיכונים', pageWidth - margin, yPosition, 12, true);
        yPosition += 7;
        
        const riskLines = pdf.splitTextToSize(formData.risks, contentWidth - 10);
        riskLines.forEach((line: string) => {
          addHebrewText(line, pageWidth - margin, yPosition, 10);
          yPosition += 5;
        });
        yPosition += 10;
      }

      // Recommendations section
      const validRecommendations = formData.recommendations.filter(r => r.trim());
      if (validRecommendations.length > 0) {
        pdf.setFillColor(240, 253, 244); // Light green
        pdf.rect(margin, yPosition, contentWidth, Math.max(20, validRecommendations.length * 7 + 15), 'F');
        yPosition += 8;
        addHebrewText('המלצות', pageWidth - margin, yPosition, 12, true);
        yPosition += 7;
        
        validRecommendations.forEach((rec) => {
          addHebrewText(`• ${rec}`, pageWidth - margin, yPosition, 10);
          yPosition += 6;
        });
        yPosition += 10;
      }

      // Cost estimation
      if (formData.estimatedCost) {
        pdf.setFillColor(250, 245, 255); // Light purple
        pdf.rect(margin, yPosition, contentWidth, 15, 'F');
        yPosition += 8;
        addHebrewText(`הערכת עלות: ${formData.estimatedCost}`, pageWidth - margin, yPosition, 12, true);
        yPosition += 15;
      }

      // Decisions section
      if (formData.decisions) {
        pdf.setFillColor(255, 251, 235); // Light yellow
        pdf.rect(margin, yPosition, contentWidth, 20, 'F');
        yPosition += 8;
        addHebrewText('החלטות שהתקבלו', pageWidth - margin, yPosition, 12, true);
        yPosition += 7;
        
        const decisionLines = pdf.splitTextToSize(formData.decisions, contentWidth - 10);
        decisionLines.forEach((line: string) => {
          addHebrewText(line, pageWidth - margin, yPosition, 10);
          yPosition += 5;
        });
        yPosition += 15;
      }

      // Documents and actions section
      if (formData.documents.length > 0 || formData.timeframes || formData.approvals) {
        pdf.setFillColor(248, 250, 252); // Light gray
        const sectionHeight = Math.max(25, formData.documents.length * 6 + 20);
        pdf.rect(margin, yPosition, contentWidth, sectionHeight, 'F');
        yPosition += 8;
        addHebrewText('פעולות נדרשות', pageWidth - margin, yPosition, 12, true);
        yPosition += 7;
        
        if (formData.documents.length > 0) {
          addHebrewText('מסמכים להכנה:', pageWidth - margin, yPosition, 11, true);
          yPosition += 6;
          formData.documents.forEach((doc) => {
            addHebrewText(`• ${doc}`, pageWidth - margin, yPosition, 10);
            yPosition += 5;
          });
        }
        
        if (formData.timeframes) {
          yPosition += 3;
          addHebrewText(`לוח זמנים: ${formData.timeframes}`, pageWidth - margin, yPosition, 11);
          yPosition += 6;
        }
        
        if (formData.approvals) {
          yPosition += 3;
          addHebrewText(`אישורים נדרשים: ${formData.approvals}`, pageWidth - margin, yPosition, 11);
        }
        
        yPosition += 15;
      }

      // Footer section
      yPosition = Math.max(yPosition + 20, 250);
      pdf.setFillColor(59, 130, 246); // Blue footer
      pdf.rect(0, yPosition, pageWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      yPosition += 15;
      addHebrewText('בברכה, הסוכן שלכם', pageWidth - margin, yPosition, 12, true);
      yPosition += 8;
      addHebrewText('טלפון: [טלפון הסוכן] | אימייל: [אימייל הסוכן]', pageWidth - margin, yPosition, 10);

      // Save the PDF
      const fileName = `סיכום_פגישה_${formData.clientName}_${formData.meetingDate}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF נוצר בהצלחה",
        description: "הסיכום הורד כקובץ PDF מעוצב",
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן ליצור את קובץ ה-PDF",
        variant: "destructive"
      });
    }
  };

  // Block management functions
  const generateBlockId = () => {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addBlock = (template: BlockTemplate, variant?: string) => {
    const selectedVariant = (variant && ['short', 'full', 'technical'].includes(variant)) 
      ? variant as 'short' | 'full' | 'technical'
      : template.defaultVariant;
      
    const newBlock: DocumentBlock = {
      id: generateBlockId(),
      type: template.type,
      title: template.title,
      content: template.variants[selectedVariant] || template.variants[template.defaultVariant],
      variant: selectedVariant,
      position: blocks.length,
      editable: true
    };

    setBlocks(prev => [...prev, newBlock]);
    
    toast({
      title: "בלוק נוסף",
      description: `${template.title} נוסף למסמך`,
    });
  };

  const loadTemplate = (templateKey: string) => {
    const template = documentTemplates[templateKey as keyof typeof documentTemplates];
    if (!template) return;

    const newBlocks: DocumentBlock[] = template.blocks.map((blockId, index) => {
      const blockTemplate = blockTemplates.find(t => t.id === blockId);
      if (!blockTemplate) return null;

      return {
        id: generateBlockId(),
        type: blockTemplate.type,
        title: blockTemplate.title,
        content: blockTemplate.variants[blockTemplate.defaultVariant],
        variant: blockTemplate.defaultVariant,
        position: index,
        editable: true
      };
    }).filter(Boolean) as DocumentBlock[];

    setBlocks(newBlocks);
    setViewMode('blocks');
    
    toast({
      title: "טמפלט נטען",
      description: `${template.name} נטען בהצלחה`,
    });
  };

  const editBlock = (blockId: string, content: any) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, content }
        : block
    ));
  };

  const deleteBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    toast({
      title: "בלוק נמחק",
      description: "הבלוק הוסר מהמסמך",
    });
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    setBlocks(prev => {
      const index = prev.findIndex(block => block.id === blockId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      
      return newBlocks.map((block, i) => ({ ...block, position: i }));
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // Handle drop from sidebar
    if (typeof active.id === 'string' && active.id.startsWith('sidebar-')) {
      try {
        const data = active.data.current;
        if (data?.template && data?.variant) {
          addBlock(data.template, data.variant);
        }
      } catch (error) {
        console.error('Error handling drag from sidebar:', error);
      }
      setActiveId(null);
      return;
    }

    // Handle reordering
    if (active.id !== over.id) {
      setBlocks((blocks) => {
        const oldIndex = blocks.findIndex(block => block.id === active.id);
        const newIndex = blocks.findIndex(block => block.id === over.id);
        
        return arrayMove(blocks, oldIndex, newIndex);
      });
    }
    
    setActiveId(null);
  };

  // Sortable Block Component
  const SortableBlock = ({ block }: { block: DocumentBlock }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: block.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <BlockRenderer
          block={block}
          onEdit={editBlock}
          onDelete={deleteBlock}
          onMove={moveBlock}
          isDragging={isDragging}
        />
      </div>
    );
  };

  const summaryText = generateSummaryText();

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl"
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            חזור לטופס
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              סיכום פגישה מוכן
            </h1>
            <p className="text-muted-foreground">
              הסיכום נוצר בהצלחה - עכשיו אפשר לשלוח או להעתיק
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Button
            variant={viewMode === 'classic' ? 'default' : 'outline'}
            onClick={() => setViewMode('classic')}
            className="rounded-xl"
          >
            <FileText className="h-4 w-4 ml-2" />
            תצוגה קלאסית
          </Button>
          <Button
            variant={viewMode === 'blocks' ? 'default' : 'outline'}
            onClick={() => setViewMode('blocks')}
            className="rounded-xl"
          >
            <Layers className="h-4 w-4 ml-2" />
            עורך בלוקים
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Button 
            onClick={() => copyToClipboard(summaryText, 'summary')}
            className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl h-auto p-4 flex flex-col items-center gap-2"
          >
            {copiedItems.has('summary') ? (
              <Check className="h-5 w-5" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
            <span className="text-sm">
              {copiedItems.has('summary') ? 'הועתק!' : 'העתק סיכום'}
            </span>
          </Button>

          <Button 
            onClick={() => setShowFinalReport(true)}
            className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl h-auto p-4 flex flex-col items-center gap-2 shadow-glow"
          >
            <Layout className="h-5 w-5" />
            <span className="text-sm">תצוגת דוח סופי</span>
          </Button>

          <Button 
            onClick={sendEmail}
            variant="outline"
            className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl h-auto p-4 flex flex-col items-center gap-2"
          >
            <Mail className="h-5 w-5" />
            <span className="text-sm">שלח במייל</span>
          </Button>

          <Button 
            onClick={sendWhatsApp}
            variant="outline"
            className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl h-auto p-4 flex flex-col items-center gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">שלח בוואטסאפ</span>
          </Button>

          <Button 
            onClick={downloadPDF}
            variant="outline"
            className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl h-auto p-4 flex flex-col items-center gap-2"
          >
            <Download className="h-5 w-5" />
            <span className="text-sm">ייצא קובץ</span>
          </Button>
        </div>

        {/* Content Area */}
        {viewMode === 'blocks' ? (
          <div className="flex gap-6">
            {/* Main Content Area with Drag & Drop */}
            <div className="flex-1">
              <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div 
                  className="min-h-96 p-6 border-2 border-dashed border-glass-border rounded-2xl bg-glass/20"
                  onDrop={(e) => {
                    e.preventDefault();
                    try {
                      const data = JSON.parse(e.dataTransfer.getData('application/json'));
                      if (data.template && data.variant) {
                        addBlock(data.template, data.variant);
                      }
                    } catch (error) {
                      console.error('Error handling drop:', error);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {blocks.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">גרור בלוקים לכאן להתחלת עבודה</p>
                      <p className="text-sm">או בחר טמפלט מהסרגל הצדדי</p>
                    </div>
                  ) : (
                    <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-4">
                        {blocks.map((block) => (
                          <SortableBlock key={block.id} block={block} />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>
                
                <DragOverlay>
                  {activeId ? (
                    <div className="opacity-80">
                      <BlockRenderer
                        block={blocks.find(b => b.id === activeId)!}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onMove={() => {}}
                        isDragging
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
            
            {/* Blocks Sidebar */}
            <BlocksSidebar onAddBlock={addBlock} onLoadTemplate={loadTemplate} />
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="glass border-glass-border rounded-2xl">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Shield className="h-8 w-8 text-primary" />
                  <CardTitle className="text-2xl">סיכום פגישת ביטוח</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg max-w-none">
                  <div className="bg-background border border-border p-8 rounded-2xl shadow-lg">
                    <pre className="whitespace-pre-wrap font-sans text-foreground leading-[1.8] text-right text-base font-normal">
                      {summaryText}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-8 text-center">
          <Button 
            onClick={onBack}
            variant="outline"
            className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl"
          >
            צור סיכום נוסף
          </Button>
        </div>
      </div>

      {/* Final Report Modal */}
      {showFinalReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background max-w-4xl w-full max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-glass-border bg-glass/50">
              <h2 className="text-2xl font-bold text-foreground">דוח סיכום פגישה - תצוגה סופית</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFinalReport(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
              {/* Header Section */}
              <div className="text-center mb-8 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Shield className="h-10 w-10 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">סיכום פגישת ביטוח</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                  {formData.clientName} • {formatDate(formData.meetingDate)}
                </p>
              </div>

              {/* Client Details */}
              <div className="mb-8 p-6 bg-glass/30 rounded-2xl border border-glass-border">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  פרטי הלקוח
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-foreground">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">שם:</span> {formData.clientName}
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">טלפון:</span> {formData.clientPhone}
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">אימייל:</span> {formData.clientEmail}
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">תאריך פגישה:</span> {formatDate(formData.meetingDate)}
                  </div>
                </div>
              </div>

              {/* Current Products */}
              {formData.products?.filter(p => p.type === 'current').length > 0 && (
                <div className="mb-8 p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    מצב קיים - מוצרים פיננסיים
                  </h3>
                  <div className="space-y-4">
                    {formData.products?.filter(p => p.type === 'current').map((product, index) => (
                      <div key={index} className="p-4 bg-background/50 rounded-xl border border-border">
                        <h4 className="font-semibold text-foreground mb-2">{product.productName} - {product.company}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <span>סוג מסלול: {product.subType}</span>
                          <span>סכום צבירה: ₪{product.amount.toLocaleString()}</span>
                          <span>דמי ניהול: {product.managementFeeOnDeposit}% / {product.managementFeeOnAccumulation}%</span>
                          {product.investmentTrack && <span>מסלול השקעה: {product.investmentTrack}</span>}
                        </div>
                        {product.notes && (
                          <p className="mt-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded">{product.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Situation & Risks */}
              {(formData.currentSituation || formData.risks) && (
                <div className="mb-8 p-6 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                  <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    ניתוח מצב וסיכונים
                  </h3>
                  {formData.currentSituation && (
                    <div className="mb-4 p-4 bg-background/50 rounded-xl">
                      <h4 className="font-medium text-foreground mb-2">מצב קיים כללי:</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{formData.currentSituation}</p>
                    </div>
                  )}
                  {formData.risks && (
                    <div className="p-4 bg-background/50 rounded-xl">
                      <h4 className="font-medium text-foreground mb-2">פערים וסיכונים:</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{formData.risks}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {(formData.recommendations.some(r => r.trim()) || formData.products?.filter(p => p.type === 'recommended').length > 0) && (
                <div className="mb-8 p-6 bg-green-500/10 rounded-2xl border border-green-500/20">
                  <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    המלצות הסוכן
                  </h3>
                  
                  {formData.products?.filter(p => p.type === 'recommended').length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-foreground mb-3">המלצות מוצרים חדשים:</h4>
                      <div className="space-y-3">
                        {formData.products?.filter(p => p.type === 'recommended').map((product, index) => (
                          <div key={index} className="p-4 bg-background/50 rounded-xl border border-border">
                            <h5 className="font-semibold text-foreground mb-2">{product.productName} - {product.company}</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <span>סוג מסלול: {product.subType}</span>
                              <span>סכום צבירה: ₪{product.amount.toLocaleString()}</span>
                              <span>דמי ניהול: {product.managementFeeOnDeposit}% / {product.managementFeeOnAccumulation}%</span>
                              {product.investmentTrack && <span>מסלול השקעה: {product.investmentTrack}</span>}
                              {product.riskLevelChange && <span>שינוי רמת סיכון: {product.riskLevelChange}</span>}
                            </div>
                            {product.notes && (
                              <p className="mt-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded">{product.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.recommendations.some(r => r.trim()) && (
                    <div className="p-4 bg-background/50 rounded-xl">
                      <h4 className="font-medium text-foreground mb-2">המלצות נוספות:</h4>
                      <ul className="space-y-1">
                        {formData.recommendations.filter(r => r.trim()).map((rec, index) => (
                          <li key={index} className="text-muted-foreground">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {formData.estimatedCost && (
                    <div className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/20">
                      <span className="font-medium text-foreground">הערכת עלות: </span>
                      <span className="text-primary font-semibold">{formData.estimatedCost}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Decisions */}
              {formData.decisions && (
                <div className="mb-8 p-6 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                  <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-500" />
                    החלטות שהתקבלו
                  </h3>
                  <div className="p-4 bg-background/50 rounded-xl">
                    <div 
                      className="ai-content"
                      dangerouslySetInnerHTML={{ __html: formData.decisions }}
                    />
                  </div>
                </div>
              )}

              {/* Required Actions */}
              {(formData.documents.length > 0 || formData.timeframes || formData.approvals) && (
                <div className="mb-8 p-6 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                  <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    פעולות נדרשות
                  </h3>
                  
                  {formData.documents.length > 0 && (
                    <div className="mb-4 p-4 bg-background/50 rounded-xl">
                      <h4 className="font-medium text-foreground mb-2">מסמכים להכנה:</h4>
                      <ul className="space-y-1">
                        {formData.documents.map((doc, index) => (
                          <li key={index} className="text-muted-foreground">• {doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {formData.timeframes && (
                    <div className="mb-4 p-4 bg-background/50 rounded-xl">
                      <h4 className="font-medium text-foreground mb-2">לוח זמנים:</h4>
                      <p className="text-muted-foreground">{formData.timeframes}</p>
                    </div>
                  )}
                  
                  {formData.approvals && (
                    <div className="p-4 bg-background/50 rounded-xl">
                      <h4 className="font-medium text-foreground mb-2">אישורים נדרשים:</h4>
                      <p className="text-muted-foreground">{formData.approvals}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
                <p className="text-lg font-semibold text-foreground mb-2">בברכה, הסוכן שלכם</p>
                <p className="text-muted-foreground">טלפון: [טלפון הסוכן] | אימייל: [אימייל הסוכן]</p>
              </div>
            </div>
            
            {/* Modal Actions */}
            <div className="p-6 border-t border-glass-border bg-glass/30 flex flex-wrap gap-4 justify-center">
              <Button
                onClick={() => copyToClipboard(summaryText, 'final-report')}
                className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl"
              >
                <Copy className="h-4 w-4 ml-2" />
                העתק דוח
              </Button>
              <Button
                onClick={sendEmail}
                variant="outline"
                className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl"
              >
                <Mail className="h-4 w-4 ml-2" />
                שלח במייל
              </Button>
              <Button
                onClick={downloadPDF}
                variant="outline"
                className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl"
              >
                <Download className="h-4 w-4 ml-2" />
                ייצא PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryGenerator;