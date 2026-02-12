import { useState } from 'react';
import { Loader2, Save, Edit2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';

export function EmailTemplateManager() {
  const { toast } = useToast();
  const { templates, isLoading, updateTemplate } = useEmailTemplates();
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ subject: '', body_html: '' });

  const startEdit = (t: any) => {
    setEditing(t.id);
    setEditForm({ subject: t.subject, body_html: t.body_html });
  };

  const handleSave = (id: string) => {
    updateTemplate.mutate({ id, updates: editForm }, {
      onSuccess: () => { toast({ title: 'Saved' }); setEditing(null); },
      onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Templates</CardTitle>
        <CardDescription>Manage automated email templates with variable support.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {templates.map((t) => (
          <div key={t.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{t.template_name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</h4>
                <p className="text-sm text-muted-foreground">{t.subject}</p>
              </div>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline"><Eye className="w-4 h-4 mr-1" />Preview</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Preview: {t.template_name}</DialogTitle></DialogHeader>
                    <div className="border rounded p-4" dangerouslySetInnerHTML={{ __html: t.body_html }} />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(t.variables_json as string[])?.map((v: string) => (
                        <Badge key={v} variant="secondary" className="font-mono text-xs">{`{{${v}}}`}</Badge>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="outline" onClick={() => startEdit(t)}><Edit2 className="w-4 h-4 mr-1" />Edit</Button>
              </div>
            </div>
            {editing === t.id && (
              <div className="space-y-3 pt-3 border-t">
                <div className="space-y-2"><Label>Subject</Label><Input value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} /></div>
                <div className="space-y-2"><Label>Body HTML</Label><Textarea rows={8} value={editForm.body_html} onChange={(e) => setEditForm({ ...editForm, body_html: e.target.value })} className="font-mono text-sm" /></div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSave(t.id)} disabled={updateTemplate.isPending}>
                    {updateTemplate.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
