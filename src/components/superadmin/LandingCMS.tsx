import { useState, useEffect, useRef } from 'react';
import { Save, Eye, EyeOff, Loader2, FileText, ExternalLink, RefreshCw, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useLandingCMS, type LandingSection } from '@/hooks/useLandingCMS';

const sectionLabels: Record<string, string> = {
  hero: '🚀 Hero Section',
  features: '✨ Features',
  how_it_works: '📋 How It Works',
  pricing: '💰 Pricing',
  testimonials: '💬 Testimonials',
  cta_banner: '📢 CTA Banner',
  footer: '🔗 Footer',
};

function SectionEditor({ section, onSave, isSaving }: { section: LandingSection; onSave: (id: string, content: Record<string, any>, visible: boolean) => void; isSaving: boolean }) {
  const [content, setContent] = useState(section.content_json as Record<string, any>);
  const [visible, setVisible] = useState(section.is_visible);

  useEffect(() => {
    setContent(section.content_json as Record<string, any>);
    setVisible(section.is_visible);
  }, [section]);

  const updateField = (key: string, value: any) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const renderFields = () => {
    switch (section.section_key) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div className="space-y-2"><Label>Badge Text</Label><Input value={content.badge_text || ''} onChange={(e) => updateField('badge_text', e.target.value)} /></div>
            <div className="space-y-2"><Label>Title</Label><Input value={content.title || ''} onChange={(e) => updateField('title', e.target.value)} /></div>
            <div className="space-y-2"><Label>Subtitle</Label><Textarea value={content.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>CTA Text</Label><Input value={content.cta_text || ''} onChange={(e) => updateField('cta_text', e.target.value)} /></div>
              <div className="space-y-2"><Label>CTA Link</Label><Input value={content.cta_link || ''} onChange={(e) => updateField('cta_link', e.target.value)} /></div>
            </div>
          </div>
        );
      case 'features':
        return (
          <div className="space-y-4">
            <div className="space-y-2"><Label>Heading</Label><Input value={content.heading || ''} onChange={(e) => updateField('heading', e.target.value)} /></div>
            <div className="space-y-2"><Label>Subheading</Label><Input value={content.subheading || ''} onChange={(e) => updateField('subheading', e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Features JSON (advanced)</Label>
              <Textarea value={JSON.stringify(content.items || [], null, 2)} onChange={(e) => { try { updateField('items', JSON.parse(e.target.value)); } catch {} }} rows={8} className="font-mono text-xs" />
            </div>
          </div>
        );
      case 'how_it_works':
        return (
          <div className="space-y-4">
            <div className="space-y-2"><Label>Heading</Label><Input value={content.heading || ''} onChange={(e) => updateField('heading', e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Steps JSON (advanced)</Label>
              <Textarea value={JSON.stringify(content.steps || [], null, 2)} onChange={(e) => { try { updateField('steps', JSON.parse(e.target.value)); } catch {} }} rows={8} className="font-mono text-xs" />
            </div>
          </div>
        );
      case 'pricing':
        return (
          <div className="space-y-4">
            <div className="space-y-2"><Label>Heading</Label><Input value={content.heading || ''} onChange={(e) => updateField('heading', e.target.value)} /></div>
            <div className="space-y-2"><Label>Subheading</Label><Input value={content.subheading || ''} onChange={(e) => updateField('subheading', e.target.value)} /></div>
          </div>
        );
      case 'testimonials':
        return (
          <div className="space-y-4">
            <div className="space-y-2"><Label>Heading</Label><Input value={content.heading || ''} onChange={(e) => updateField('heading', e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Testimonials JSON (advanced)</Label>
              <Textarea value={JSON.stringify(content.items || [], null, 2)} onChange={(e) => { try { updateField('items', JSON.parse(e.target.value)); } catch {} }} rows={8} className="font-mono text-xs" />
            </div>
          </div>
        );
      case 'cta_banner':
        return (
          <div className="space-y-4">
            <div className="space-y-2"><Label>Headline</Label><Input value={content.headline || ''} onChange={(e) => updateField('headline', e.target.value)} /></div>
            <div className="space-y-2"><Label>Subtitle</Label><Input value={content.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>CTA Text</Label><Input value={content.cta_text || ''} onChange={(e) => updateField('cta_text', e.target.value)} /></div>
              <div className="space-y-2"><Label>CTA Link</Label><Input value={content.cta_link || ''} onChange={(e) => updateField('cta_link', e.target.value)} /></div>
            </div>
          </div>
        );
      case 'footer':
        return (
          <div className="space-y-4">
            <div className="space-y-2"><Label>Company Name</Label><Input value={content.company_name || ''} onChange={(e) => updateField('company_name', e.target.value)} /></div>
            <div className="space-y-2"><Label>Tagline</Label><Input value={content.tagline || ''} onChange={(e) => updateField('tagline', e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Links JSON (advanced)</Label>
              <Textarea value={JSON.stringify(content.links || [], null, 2)} onChange={(e) => { try { updateField('links', JSON.parse(e.target.value)); } catch {} }} rows={5} className="font-mono text-xs" />
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <Label>Content JSON</Label>
            <Textarea value={JSON.stringify(content, null, 2)} onChange={(e) => { try { setContent(JSON.parse(e.target.value)); } catch {} }} rows={10} className="font-mono text-xs" />
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{sectionLabels[section.section_key] || section.section_key}</CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {visible ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              <Switch checked={visible} onCheckedChange={setVisible} />
            </div>
            <Button size="sm" onClick={() => onSave(section.id, content, visible)} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>{renderFields()}</CardContent>
    </Card>
  );
}

export function LandingCMS() {
  const { toast } = useToast();
  const { sections, isLoading, updateSection } = useLandingCMS();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleSave = async (id: string, content: Record<string, any>, visible: boolean) => {
    setSavingId(id);
    try {
      await updateSection.mutateAsync({ id, updates: { content_json: content, is_visible: visible } });
      toast({ title: 'Saved', description: 'Section updated successfully.' });
      // Refresh preview after save
      setTimeout(() => setPreviewKey((k) => k + 1), 500);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  const refreshPreview = () => setPreviewKey((k) => k + 1);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Landing Page CMS
          </h2>
          <p className="text-sm text-muted-foreground">Edit sections and see live preview side-by-side.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshPreview}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <PanelLeftClose className="w-4 h-4 mr-1" /> : <PanelLeft className="w-4 h-4 mr-1" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/landing" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-1" />
              Open Landing
            </a>
          </Button>
        </div>
      </div>

      <div className={`flex gap-6 ${showPreview ? '' : ''}`}>
        {/* Editor Panel */}
        <div className={`space-y-4 overflow-y-auto ${showPreview ? 'w-1/2' : 'w-full'}`} style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {sections.map((section) => (
            <SectionEditor
              key={section.id}
              section={section}
              onSave={handleSave}
              isSaving={savingId === section.id}
            />
          ))}
        </div>

        {/* Live Preview Panel */}
        {showPreview && (
          <div className="w-1/2 sticky top-0" style={{ height: 'calc(100vh - 180px)' }}>
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    Live Preview
                  </CardTitle>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-accent-foreground/40" />
                    <div className="w-3 h-3 rounded-full bg-primary/60" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-2 pt-0">
                <div className="w-full h-full rounded-lg overflow-hidden border bg-white">
                  <iframe
                    ref={iframeRef}
                    key={previewKey}
                    src="/landing"
                    className="w-full h-full border-0"
                    title="Landing Page Preview"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
