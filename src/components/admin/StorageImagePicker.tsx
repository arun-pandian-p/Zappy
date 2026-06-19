import { useState, useEffect } from 'react';
import { Search, Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StorageImage {
  id: string;
  image_url: string;
  item_name: string;
  category_name: string | null;
  source: string;
}

interface StorageImagePickerProps {
  onSelect: (url: string, name?: string) => void;
  query?: string;
  currentImageUrl?: string;
}

export const StorageImagePicker = ({ onSelect, query = '', currentImageUrl }: StorageImagePickerProps) => {
  const [search, setSearch] = useState(query);
  const [photos, setPhotos] = useState<StorageImage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchPhotos = async (q: string) => {
    setLoading(true);
    try {
      let req = supabase.from('image_library').select('*').order('created_at', { ascending: false }).limit(20);
      
      if (q.trim()) {
        req = req.or(`item_name.ilike.%${q}%,category_name.ilike.%${q}%`);
      }

      const { data, error } = await req;
      
      if (error) throw error;
      
      setPhotos(data || []);
    } catch (error: any) {
      console.error('Storage search error:', error);
      toast({
        title: 'Search failed',
        description: error.message || 'Could not fetch images from library.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchPhotos(search);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search by item name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchPhotos(search)}
        />
        <Button onClick={() => searchPhotos(search)} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-1">
        {photos.map((photo) => {
          const isSelected = currentImageUrl === photo.image_url;
          return (
          <Card 
            key={photo.id} 
            className={`cursor-pointer transition-all overflow-hidden border-none ${
              isSelected ? 'ring-4 ring-primary scale-95' : 'hover:ring-2 hover:ring-primary/50'
            }`}
            onClick={() => onSelect(photo.image_url, photo.item_name)}
          >
            <CardContent className="p-0 h-32 relative group">
              <img
                src={photo.image_url}
                alt={photo.item_name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center ${
                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <CheckCircle2 className="text-white h-8 w-8" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1 flex justify-between items-center">
                <span className="text-[10px] text-white font-medium truncate px-1">{photo.item_name}</span>
                <span className="text-[8px] bg-primary/20 text-primary-foreground px-1.5 py-0.5 rounded uppercase">{photo.source}</span>
              </div>
            </CardContent>
          </Card>
        )})}
        {photos.length === 0 && !loading && (
          <div className="col-span-2 text-center py-8 text-muted-foreground italic">
            No photos found in shared library. Try uploading one!
          </div>
        )}
      </div>
    </div>
  );
};
