import { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Loader2, User, Upload, X, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSuperAdminProfile } from '@/hooks/useSuperAdminProfile';
import { useAuth } from '@/hooks/useAuth';

const EMOJI_AVATARS = ['👨‍💼', '👩‍💼', '🧑‍💻', '👨‍🍳', '🦸', '🧙', '🎭', '🤖'];

export function SuperAdminProfileEditor() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, isLoading, upsertProfile } = useSuperAdminProfile();

  const [form, setForm] = useState({
    display_name: '',
    avatar_url: '',
    phone: '',
    theme_preference: 'system',
  });
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        avatar_url: profile.avatar_url || '',
        phone: profile.phone || '',
        theme_preference: profile.theme_preference || 'system',
      });
    }
  }, [profile]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 5MB.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUrl(dataUrl);
      setForm((prev) => ({ ...prev, avatar_url: dataUrl }));
      setSelectedEmoji(null);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const clearAvatar = () => {
    setPreviewUrl(null);
    setSelectedEmoji(null);
    setForm((prev) => ({ ...prev, avatar_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    const avatarUrl = selectedEmoji
      ? `emoji:${selectedEmoji}`
      : form.avatar_url;

    upsertProfile.mutate(
      { ...form, avatar_url: avatarUrl },
      {
        onSuccess: () => {
          toast({ title: 'Profile Updated', description: 'Your profile has been saved.' });
          setSelectedEmoji(null);
          setPreviewUrl(null);
        },
        onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
      }
    );
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const displayAvatar = previewUrl
    ? previewUrl
    : selectedEmoji
      ? null
      : form.avatar_url?.startsWith('emoji:')
        ? null
        : form.avatar_url || null;

  const displayEmoji = selectedEmoji || (form.avatar_url?.startsWith('emoji:') ? form.avatar_url.replace('emoji:', '') : null);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Admin Profile
        </h2>
        <p className="text-sm text-muted-foreground">Customize your identity on the platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avatar</CardTitle>
          <CardDescription>Drag & drop an image, upload, or pick an emoji</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            {/* Avatar Preview */}
            <div className="relative group">
              <Avatar className="w-24 h-24">
                {displayAvatar ? (
                  <AvatarImage src={displayAvatar} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                  {displayEmoji || (form.display_name?.charAt(0) || 'SA')}
                </AvatarFallback>
              </Avatar>
              {(displayAvatar || displayEmoji) && (
                <button
                  onClick={clearAvatar}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                {isDragging ? (
                  <>
                    <ImageIcon className="w-8 h-8 text-primary animate-bounce" />
                    <p className="text-sm font-medium text-primary">Drop image here</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Drag & drop or click to upload</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Or enter an image URL</Label>
            <Input
              value={form.avatar_url?.startsWith('emoji:') || form.avatar_url?.startsWith('data:') ? '' : form.avatar_url}
              onChange={(e) => { setForm({ ...form, avatar_url: e.target.value }); setSelectedEmoji(null); setPreviewUrl(null); }}
              placeholder="https://..."
            />
          </div>

          {/* Emoji Picker */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Or pick an emoji avatar</Label>
            <div className="flex gap-2 flex-wrap">
              {EMOJI_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { setSelectedEmoji(emoji); setPreviewUrl(null); }}
                  className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center border-2 transition-all ${
                    selectedEmoji === emoji ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Display Name</Label><Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Super Admin" /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={user?.email || ''} disabled className="bg-muted" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 ..." /></div>
            <div className="space-y-2">
              <Label>Theme Preference</Label>
              <Select value={form.theme_preference} onValueChange={(v) => setForm({ ...form, theme_preference: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={upsertProfile.isPending}>
        {upsertProfile.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save Profile
      </Button>
    </div>
  );
}
