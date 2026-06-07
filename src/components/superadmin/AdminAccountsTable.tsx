import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { invokeFunction } from '@/integrations/supabase/functions';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Loader2, Users, UserPlus, RefreshCw, Eye, EyeOff, Copy, Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRestaurants } from '@/hooks/useRestaurant';

interface AdminAccount {
  user_id: string;
  role: string;
  restaurant_id: string | null;
  created_at: string | null;
  staff_name: string | null;
  staff_email: string | null;
  staff_active: boolean;
  restaurant_name: string | null;
  restaurant_slug: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  restaurant_admin: 'Restaurant Admin',
  kitchen_staff: 'Kitchen Staff',
  waiter_staff: 'Waiter',
  billing_staff: 'Billing',
};

const useAdminAccounts = () => {
  return useQuery({
    queryKey: ['admin-accounts'],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, restaurant_id, created_at')
        .in('role', ['restaurant_admin', 'kitchen_staff', 'waiter_staff', 'billing_staff'])
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      const userIds = roles.map(r => r.user_id);
      const restaurantIds = roles.map(r => r.restaurant_id).filter(Boolean) as string[];

      const [profilesRes, restaurantsRes] = await Promise.all([
        supabase.from('staff_profiles').select('user_id, name, email, is_active').in('user_id', userIds),
        restaurantIds.length > 0
          ? supabase.from('restaurants').select('id, name, slug').in('id', restaurantIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
      const restaurantMap = new Map((restaurantsRes.data || []).map(r => [r.id, r]));

      return roles.map((role): AdminAccount => {
        const profile = profileMap.get(role.user_id);
        const restaurant = role.restaurant_id ? restaurantMap.get(role.restaurant_id) : null;
        return {
          user_id: role.user_id,
          role: role.role,
          restaurant_id: role.restaurant_id,
          created_at: role.created_at,
          staff_name: profile?.name || null,
          staff_email: profile?.email || null,
          staff_active: profile?.is_active ?? true,
          restaurant_name: restaurant?.name || null,
          restaurant_slug: restaurant?.slug || null,
        };
      });
    },
    refetchInterval: 10000, // auto-refresh every 10s for realtime feel
  });
};

function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let pw = '';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) pw += chars[arr[i] % chars.length];
  return pw;
}

const AdminAccountsTable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: admins = [], isLoading, refetch } = useAdminAccounts();
  const { data: restaurants = [] } = useRestaurants();

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: generatePassword(),
    role: 'restaurant_admin' as string,
    restaurant_id: '',
  });

  const handleCreate = async () => {
    if (!newUser.email || !newUser.password || !newUser.role) {
      toast({ title: 'Missing fields', description: 'Email, password, and role are required.', variant: 'destructive' });
      return;
    }
    if (newUser.password.length < 8) {
      toast({ title: 'Weak password', description: 'Password must be at least 8 characters.', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const response = await invokeFunction('manage-staff', {
        body: {
          action: 'create',
          email: newUser.email,
          password: newUser.password,
          name: newUser.name || newUser.email.split('@')[0],
          role: newUser.role,
          restaurant_id: newUser.restaurant_id || undefined,
        },
      });

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || response.error?.message || 'Failed to create user');
      }

      toast({
        title: '✅ User Created',
        description: `${newUser.email} has been added as ${ROLE_LABELS[newUser.role] || newUser.role}.`,
      });

      // Invalidate + refetch immediately for real-time feel
      await queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
      await refetch();

      setOpen(false);
      setNewUser({
        email: '', name: '', password: generatePassword(),
        role: 'restaurant_admin', restaurant_id: '',
      });
    } catch (err: any) {
      toast({ title: 'Error creating user', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newUser.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    await refetch();
    toast({ title: 'Refreshed', description: 'User list updated.' });
  };

  const roleBadgeVariant = (role: string) => {
    if (role === 'restaurant_admin') return 'default';
    if (role === 'kitchen_staff') return 'secondary';
    return 'outline';
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Staff & Admin Accounts
            </CardTitle>
            <CardDescription>
              Manage all restaurant staff accounts across the platform. Create users directly — no email confirmation required.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {/* ─── CREATE USER DIALOG ─── */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Staff Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">

                  {/* Name */}
                  <div className="space-y-1">
                    <Label>Full Name</Label>
                    <Input
                      value={newUser.name}
                      onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Ravi Kumar"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newUser.email}
                      onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                      placeholder="admin@hotel.com"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <Label>Password * <span className="text-xs text-muted-foreground">(min 8 chars)</span></Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showPw ? 'text' : 'password'}
                          value={newUser.password}
                          onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                          className="pr-8"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowPw(p => !p)}
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Button variant="outline" size="icon" onClick={handleCopyPassword} title="Copy password">
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => setNewUser(p => ({ ...p, password: generatePassword() }))}
                      >
                        Generate
                      </Button>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="space-y-1">
                    <Label>Role *</Label>
                    <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant_admin">Restaurant Admin</SelectItem>
                        <SelectItem value="kitchen_staff">Kitchen Staff</SelectItem>
                        <SelectItem value="waiter_staff">Waiter</SelectItem>
                        <SelectItem value="billing_staff">Billing Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Restaurant */}
                  <div className="space-y-1">
                    <Label>Assign to Restaurant</Label>
                    <Select
                      value={newUser.restaurant_id}
                      onValueChange={v => setNewUser(p => ({ ...p, restaurant_id: v === '__none__' ? '' : v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select restaurant..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None / Platform-wide —</SelectItem>
                        {restaurants.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full" onClick={handleCreate} disabled={creating}>
                    {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    Create Account
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Account is instantly active — no email confirmation needed.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No staff accounts found</p>
            <p className="text-sm mt-1">Click "Add User" to create the first admin or staff member.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.user_id}>
                    <TableCell className="font-medium">
                      {admin.staff_name || <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {admin.staff_email || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(admin.role)}>
                        {ROLE_LABELS[admin.role] || admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {admin.restaurant_name ? (
                        <Badge variant="outline">{admin.restaurant_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.staff_active ? 'default' : 'secondary'}>
                        {admin.staff_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {admin.created_at ? new Date(admin.created_at).toLocaleDateString('en-IN') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAccountsTable;
