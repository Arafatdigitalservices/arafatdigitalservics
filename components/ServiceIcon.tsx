import {
  Code2,
  Globe,
  Layers,
  Megaphone,
  Search,
  Share2,
  ShieldCheck,
  Target,
  Workflow,
} from 'lucide-react';

interface ServiceIconProps {
  name: string;
  className?: string;
}

export function ServiceIcon({ name, className = 'w-5 h-5' }: ServiceIconProps) {
  switch (name) {
    case 'Code2':
      return <Code2 className={className} aria-hidden="true" />;
    case 'Layers':
      return <Layers className={className} aria-hidden="true" />;
    case 'Target':
      return <Target className={className} aria-hidden="true" />;
    case 'Megaphone':
      return <Megaphone className={className} aria-hidden="true" />;
    case 'Share2':
      return <Share2 className={className} aria-hidden="true" />;
    case 'Search':
      return <Search className={className} aria-hidden="true" />;
    case 'Workflow':
      return <Workflow className={className} aria-hidden="true" />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} aria-hidden="true" />;
    default:
      return <Globe className={className} aria-hidden="true" />;
  }
}
