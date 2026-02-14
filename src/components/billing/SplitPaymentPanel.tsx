import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Banknote, Smartphone, CreditCard } from 'lucide-react';

interface SplitPaymentPanelProps {
  total: number;
  currencySymbol: string;
  onSplitChange: (split: { cash: number; upi: number; card: number }) => void;
}

const SplitPaymentPanel = ({ total, currencySymbol, onSplitChange }: SplitPaymentPanelProps) => {
  const [cash, setCash] = useState(0);
  const [upi, setUpi] = useState(0);
  const [card, setCard] = useState(0);

  const remaining = Math.max(0, total - cash - upi - card);
  const isValid = Math.abs(remaining) < 0.01;

  useEffect(() => {
    onSplitChange({ cash, upi, card });
  }, [cash, upi, card, onSplitChange]);

  const fillRemaining = (method: 'cash' | 'upi' | 'card') => {
    const rem = total - cash - upi - card;
    if (rem <= 0) return;
    if (method === 'cash') setCash(prev => prev + rem);
    else if (method === 'upi') setUpi(prev => prev + rem);
    else setCard(prev => prev + rem);
  };

  const methods = [
    { key: 'cash' as const, icon: Banknote, label: 'Cash', value: cash, setter: setCash },
    { key: 'upi' as const, icon: Smartphone, label: 'UPI', value: upi, setter: setUpi },
    { key: 'card' as const, icon: CreditCard, label: 'Card', value: card, setter: setCard },
  ];

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Split Payment</p>
        <Badge variant={isValid ? 'default' : 'destructive'} className="text-xs">
          {isValid ? '✓ Balanced' : `${currencySymbol}${remaining.toFixed(2)} remaining`}
        </Badge>
      </div>

      {methods.map(({ key, icon: Icon, label, value, setter }) => (
        <div key={key} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 w-16 text-xs text-muted-foreground">
            <Icon className="w-3.5 h-3.5" />
            {label}
          </div>
          <Input
            type="number"
            min={0}
            step={1}
            value={value || ''}
            onChange={(e) => setter(Math.max(0, Number(e.target.value) || 0))}
            className="h-8 text-sm"
            placeholder="0"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[10px] px-2 whitespace-nowrap"
            onClick={() => fillRemaining(key)}
          >
            Fill rest
          </Button>
        </div>
      ))}
    </div>
  );
};

export default SplitPaymentPanel;
