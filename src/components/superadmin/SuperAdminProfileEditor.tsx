import { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Loader2, User, Upload, X, ImageIcon, Plus, Trash2, Users, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSuperAdminProfile } from '@/hooks/useSuperAdminProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const EMOJI_AVATARS = ['👨‍💼', '👩‍💼', '🧑‍💻', '👨‍🍳', '🦸', '🧙', '🎭', '🤖'];

interface TeamMember {
  user_id: string;
  email: string;
  name: string | null;
  created_at: string;
}

function useTeamMembers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['super-admin-team'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('manage-super-admins', {
        body: { action: 'list' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.members || []) as TeamMember[];
    },
  });

  const addMember = useMutation({
    mutationFn: async ({ email, name }: { email: string; name?: string }) => {
      const { data, error } = await supabase.functions.invoke('manage-super-admins', {
        body: { action: 'add', email, name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin-team'] }),
  });

  const removeMember = useMutation({
    mutationFn: async (user_id: string) => {
      const { data, error } = await supabase.functions.invoke('manage-super-admins', {
        body: { action: 'remove', user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin-team'] }),
  });

  return { members: query.data || [], isLoading: query.isLoading, addMember, removeMember };
}

export function SuperAdminProfileEditor() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, isLoading, upsertProfile } = useSuperAdminProfile();
  const { members, isLoading: teamLoading, addMember, removeMember } = useTeamMembers();

  const [form, setForm] = useState({
    display_name: '',
    avatar_url: '',
    phone: '',
    theme_preference: 'system',
  });
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
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

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
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
    const avatarUrl = selectedEmoji ? `emoji:${selectedEmoji}` : form.avatar_url;
    upsertProfile.mutate(
      { ...form, avatar_url: avatarUrl },
      {
        onSuccess: () => { toast({ title: 'Profile Updated', description: 'Your profile has been saved.' }); setSelectedEmoji(null); setPreviewUrl(null); },
        onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
      }
    );
  };

  const handleAddTeamMember = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    setIsAddingMember(true);
    try {
      await addMember.mutateAsync({ email: newEmail });
      toast({ title: 'Team Member Added', description: `${newEmail} has been granted Super Admin access.` });
      setNewEmail('');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string, email: string) => {
    try {
      await removeMember.mutateAsync(userId);
      toast({ title: 'Removed', description: `${email} has been removed from the team.` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const displayAvatar = previewUrl ? previewUrl : selectedEmoji ? null : form.avatar_url?.startsWith('emoji:') ? null : form.avatar_url || null;
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

      {/* Avatar Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avatar</CardTitle>
          <CardDescription>Drag & drop an image, upload, or pick an emoji</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            <div className="relative group">
              <Avatar className="w-24 h-24">
                {displayAvatar ? <AvatarImage src={displayAvatar} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                  {displayEmoji || (form.display_name?.charAt(0) || 'SA')}
                </AvatarFallback>
              </Avatar>
              {(displayAvatar || displayEmoji) && (
                <button onClick={clearAvatar} className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInputChange} className="hidden" />
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

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Or enter an image URL</Label>
            <Input
              value={form.avatar_url?.startsWith('emoji:') || form.avatar_url?.startsWith('data:') ? '' : form.avatar_url}
              onChange={(e) => { setForm({ ...form, avatar_url: e.target.value }); setSelectedEmoji(null); setPreviewUrl(null); }}
              placeholder="https://..."
            />
          </div>

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

      {/* Profile Details Card */}
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

      {/* Team Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Team Login Management
          </CardTitle>
          <CardDescription>Add or remove Super Admin team members by email address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add member */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter email address to add..."
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTeamMember()}
              />
            </div>
            <Button onClick={handleAddTeamMember} disabled={isAddingMember || !newEmail}>
              {isAddingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Add
            </Button>
          </div>

          {/* Team members list */}
          {teamLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No team members found.</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {member.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.name || member.email?.split('@')[0]}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.user_id === user?.id ? (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveMember(member.user_id, member.email)}
                        disabled={removeMember.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
