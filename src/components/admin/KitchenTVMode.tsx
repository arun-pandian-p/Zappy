import { Button } from '@/components/ui/button';
import { Monitor, MonitorOff, Maximize, Minimize } from 'lucide-react';
import { useState, useEffect } from 'react';

interface KitchenTVModeProps {
  isTvMode: boolean;
  onToggle: (enabled: boolean) => void;
}

export const KitchenTVMode = ({ isTvMode, onToggle }: KitchenTVModeProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen request failed:', err);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={isTvMode ? 'default' : 'outline'}
        size="sm"
        onClick={() => onToggle(!isTvMode)}
        className="rounded-lg gap-1.5 font-semibold text-xs"
        title="Toggle TV / Monitor Mode (Optimized layout & larger text)"
      >
        {isTvMode ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
        <span className="hidden sm:inline">{isTvMode ? 'Disable TV Mode' : 'TV Mode'}</span>
      </Button>
      
      {isTvMode && (
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="rounded-lg p-2"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </Button>
      )}
    </div>
  );
};
export default KitchenTVMode;
