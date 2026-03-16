import { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Loader2, User, Upload, X, ImageIcon, Plus, Trash2, Users, Mail, Camera } from 'lucide-react';
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
        body: { action: 'list' }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.members || []) as TeamMember[];
    }
  });

  const addMember = useMutation({
    mutationFn: async ({ email, name }: {email: string;name?: string;}) => {
      const { data, error } = await supabase.functions.invoke('manage-super-admins', {
        body: { action: 'add', email, name }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin-team'] })
  });

  const removeMember = useMutation({
    mutationFn: async (user_id: string) => {
      const { data, error } = await supabase.functions.invoke('manage-super-admins', {
        body: { action: 'remove', user_id }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin-team'] })
  });

  return { members: query.data || [], isLoading: query.isLoading, addMember, removeMember };
}

async function uploadAvatarToStorage(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const filePath = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage.
  from('avatars').
  upload(filePath, file, { upsert: true });

  if (error) throw error;

  const { data: urlData } = supabase.storage.
  from('avatars').
  getPublicUrl(filePath);

  // Add cache-bust to force refresh
  return `${urlData.publicUrl}?t=${Date.now()}`;
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
    theme_preference: 'system'
  });
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        avatar_url: profile.avatar_url || '',
        phone: profile.phone || '',
        theme_preference: profile.theme_preference || 'system'
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
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setSelectedEmoji(null);
    };
    reader.readAsDataURL(file);
    setPendingFile(file);
  }, [toast]);

  // WhatsApp-style: click avatar to upload
  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {e.preventDefault();e.stopPropagation();}, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {e.preventDefault();e.stopPropagation();}, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();e.stopPropagation();
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
    setPendingFile(null);
    setForm((prev) => ({ ...prev, avatar_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!user?.id) return;

    let avatarUrl = form.avatar_url;

    // Upload file to storage if pending
    if (pendingFile) {
      setIsUploading(true);
      try {
        avatarUrl = await uploadAvatarToStorage(pendingFile, user.id);
      } catch (err: any) {
        toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    } else if (selectedEmoji) {
      avatarUrl = `emoji:${selectedEmoji}`;
    }

    upsertProfile.mutate(
      { ...form, avatar_url: avatarUrl },
      {
        onSuccess: () => {
          toast({ title: 'Profile Updated', description: 'Your profile has been saved.' });
          setSelectedEmoji(null);
          setPreviewUrl(null);
          setPendingFile(null);
        },
        onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
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

      {/* Avatar Card — WhatsApp Style */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Photo</CardTitle>
          <CardDescription>Click your photo to change it, just like WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            {/* WhatsApp-style clickable avatar */}
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <Avatar className="w-28 h-28 ring-4 ring-primary/10 transition-all group-hover:ring-primary/30">
                {displayAvatar ? <AvatarImage src={displayAvatar} className="object-cover" /> : null}
                <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                  {displayEmoji || form.display_name?.charAt(0) || 'SA'}
                </AvatarFallback>
              </Avatar>
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-[10px] text-white font-medium uppercase tracking-wide">Change</span>
              </div>
              {isUploading &&
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              }
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarInputChange}
                className="hidden" />
              
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-medium">{form.display_name || 'Super Admin'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              {(displayAvatar || displayEmoji) &&
              <Button variant="outline" size="sm" onClick={(e) => {e.stopPropagation();clearAvatar();}}>
                  <X className="w-3 h-3 mr-1" /> Remove Photo
                </Button>
              }

              {/* Drag & drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50">
                
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInputChange} className="hidden" />
                <div className="flex items-center gap-2 justify-center">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Or drag & drop here</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            
            











            
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

      <Button onClick={handleSave} disabled={upsertProfile.isPending || isUploading}>
        {upsertProfile.isPending || isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
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
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter email address to add..."
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTeamMember()} />
              
            </div>
            <Button onClick={handleAddTeamMember} disabled={isAddingMember || !newEmail}>
              {isAddingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Add
            </Button>
          </div>

          {teamLoading ?
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div> :
          members.length === 0 ?
          <p className="text-sm text-muted-foreground text-center py-4">No team members found.</p> :

          <div className="space-y-2">
              {members.map((member) =>
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
                    {member.user_id === user?.id ?
                <Badge variant="secondary" className="text-xs">You</Badge> :

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveMember(member.user_id, member.email)}
                  disabled={removeMember.isPending}>
                  
                        <Trash2 className="w-4 h-4" />
                      </Button>
                }
                  </div>
                </div>
            )}
            </div>
          }
        </CardContent>
      </Card>
    </div>);

}