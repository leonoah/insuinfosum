export interface BlockContent {
  id: string;
  type: BlockType;
  title: string;
  content: any;
  variant?: 'short' | 'full' | 'technical';
  editable?: boolean;
}

export type BlockType = 
  | 'opening'
  | 'current-analysis' 
  | 'recommended-analysis'
  | 'comparison-table'
  | 'disclosure'
  | 'agent-recommendations'
  | 'decisions'
  | 'signature'
  | 'call-to-action'
  | 'auto-summary';

export interface BlockTemplate {
  id: string;
  type: BlockType;
  title: string;
  description: string;
  icon: string;
  variants: {
    short?: string;
    full?: string;
    technical?: string;
  };
  defaultVariant: 'short' | 'full' | 'technical';
  preview?: string;
}

export interface DocumentBlock extends BlockContent {
  position: number;
  isSelected?: boolean;
}