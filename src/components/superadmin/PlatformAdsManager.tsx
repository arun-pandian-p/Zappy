import { useState } from 'react';
import { Loader2, Plus, Save, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function PlatformAdsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', image_url: '', link_url: '', is_active: true });

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['platform-ads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createAd = useMutation({
    mutationFn: async (ad: typeof form) => {
      const { data, error } = await supabase.from('ads').insert(ad).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['platform-ads'] }); toast({ title: 'Ad Created' }); setShowAdd(false); setForm({ title: '', description: '', image_url: '', link_url: '', is_active: true }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const toggleAd = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('ads').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-ads'] }),
  });

  const deleteAd = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['platform-ads'] }); toast({ title: 'Ad Deleted' }); },
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle>Platform Ads</CardTitle><CardDescription>Manage promotional ads shown across tenant menus.</CardDescription></div>
          <Button onClick={() => setShowAdd(!showAdd)}><Plus className="w-4 h-4 mr-2" />Add Ad</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAdd && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Link URL</Label><Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} /></div>
              <div className="space-y-2"><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { if (!form.title) return; createAd.mutate(form); }} disabled={createAd.isPending}><Check className="w-4 h-4 mr-2" />Create</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}><X className="w-4 h-4 mr-2" />Cancel</Button>
            </div>
          </div>
        )}
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Link</TableHead><TableHead>Impressions</TableHead><TableHead>Clicks</TableHead><TableHead>Active</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {ads.map((ad) => (
              <TableRow key={ad.id}>
                <TableCell className="font-medium">{ad.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{ad.link_url || '-'}</TableCell>
                <TableCell>{ad.impressions}</TableCell>
                <TableCell>{ad.clicks}</TableCell>
                <TableCell><Switch checked={ad.is_active ?? true} onCheckedChange={(v) => toggleAd.mutate({ id: ad.id, is_active: v })} /></TableCell>
                <TableCell className="text-right"><Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteAd.mutate(ad.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
