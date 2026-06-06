import { Button } from '@/components/ui/button';
import { LayoutGrid, Flame, Beer, IceCream } from 'lucide-react';

export type KitchenStation = 'all' | 'kitchen' | 'bar' | 'dessert' | string;

interface KitchenStationFilterProps {
  activeStation: KitchenStation;
  onChange: (station: KitchenStation) => void;
  stations?: string[];
}

export const KitchenStationFilter = ({
  activeStation,
  onChange,
  stations = ['kitchen', 'bar', 'dessert'],
}: KitchenStationFilterProps) => {
  const getIcon = (station: string) => {
    switch (station.toLowerCase()) {
      case 'all': return <LayoutGrid className="w-4 h-4" />;
      case 'kitchen': return <Flame className="w-4 h-4 text-orange-500" />;
      case 'bar': return <Beer className="w-4 h-4 text-amber-500" />;
      case 'dessert': case 'desserts': return <IceCream className="w-4 h-4 text-pink-500" />;
      default: return <LayoutGrid className="w-4 h-4" />;
    }
  };

  const getLabel = (station: string) => {
    return station.charAt(0).toUpperCase() + station.slice(1);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center bg-card p-1.5 border rounded-xl shadow-sm">
      <Button
        variant={activeStation === 'all' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('all')}
        className="rounded-lg gap-1.5 font-semibold text-xs"
      >
        {getIcon('all')}
        All Stations
      </Button>
      {stations.map((station) => (
        <Button
          key={station}
          variant={activeStation === station ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(station)}
          className="rounded-lg gap-1.5 font-semibold text-xs"
        >
          {getIcon(station)}
          {getLabel(station)}
        </Button>
      ))}
    </div>
  );
};
