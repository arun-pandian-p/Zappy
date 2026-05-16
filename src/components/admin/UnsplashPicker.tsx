import { useState, useEffect } from 'react';
import { Search, Loader2, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface UnsplashPhoto {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
  };
}

interface UnsplashPickerProps {
  onSelect: (url: string) => void;
  query?: string;
}

export const UnsplashPicker = ({ onSelect, query = '' }: UnsplashPickerProps) => {
  const [search, setSearch] = useState(query);
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

  const searchPhotos = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=12&client_id=${accessKey}`
      );
      const data = await response.json();
      setPhotos(data.results || []);
    } catch (error) {
      console.error('Unsplash search error:', error);
      toast({
        title: 'Search failed',
        description: 'Could not fetch images from Unsplash.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      searchPhotos(query);
    }
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search food photos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchPhotos(search)}
        />
        <Button onClick={() => searchPhotos(search)} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-1">
        {photos.map((photo) => (
          <Card 
            key={photo.id} 
            className="cursor-pointer hover:ring-2 hover:ring-primary transition-all overflow-hidden border-none"
            onClick={() => onSelect(photo.urls.regular)}
          >
            <CardContent className="p-0 h-32 relative group">
              <img
                src={photo.urls.small}
                alt={photo.alt_description}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImageIcon className="text-white h-6 w-6" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                <p className="text-[10px] text-white truncate px-1">by {photo.user.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {photos.length === 0 && !loading && search && (
          <div className="col-span-2 text-center py-8 text-muted-foreground italic">
            No photos found for "{search}"
          </div>
        )}
      </div>
    </div>
  );
};
