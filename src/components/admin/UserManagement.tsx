import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  Mail,
  Shield,
  ChefHat,
  Receipt,
  UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface StaffMember {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  role: AppRole;
  is_active: boolean;
  created_at: string;
}

const roleConfig: Record<AppRole, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  super_admin: { label: 'Super Admin', icon: Shield, color: 'bg-purple-100 text-purple-700' },
  restaurant_admin: { label: 'Admin', icon: UserCog, color: 'bg-blue-100 text-blue-700' },
  manager: { label: 'Manager', icon: UserCog, color: 'bg-indigo-100 text-indigo-700' },
  kitchen_staff: { label: 'Kitchen', icon: ChefHat, color: 'bg-orange-100 text-orange-700' },
  waiter_staff: { label: 'Waiter', icon: Users, color: 'bg-green-100 text-green-700' },
  billing_staff: { label: 'Billing', icon: Receipt, color: 'bg-emerald-100 text-emerald-700' },
};

const staffRoles: AppRole[] = ['manager', 'kitchen_staff', 'waiter_staff', 'billing_staff'];

const UserManagement = () => {
  const { toast } = useToast();
  const { restaurantId } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffMember | null>(null);
  
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    role: 'kitchen_staff' as AppRole,
  });

  // Fetch staff profiles with their roles
  const { data: staffMembers = [], isLoading } = useQuery({
    queryKey: ['staff-members', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      if (!profiles?.length) return [];

      // Fetch roles for these users
      const userIds = profiles.map(p => p.user_id);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      
      return profiles.map(p => ({
        id: p.id,
        user_id: p.user_id,
        email: p.email,
        name: p.name,
        role: rolesMap.get(p.user_id) || 'kitchen_staff' as AppRole,
        is_active: p.is_active,
        created_at: p.created_at,
      }));
    },
    enabled: !!restaurantId,
  });

  // Create new staff user via secure edge function
  const createStaffMutation = useMutation({
    mutationFn: async (data: typeof newUser) => {
      if (!restaurantId) throw new Error('No restaurant context');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('manage-staff', {
        body: {
          action: 'create',
          email: data.email,
          password: data.password,
          name: data.name,
          role: data.role,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      toast({ title: 'Staff Created', description: 'New staff member added successfully' });
      setNewUser({ email: '', name: '', password: '', role: 'kitchen_staff' });
      setShowAddForm(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create staff member',
        variant: 'destructive',
      });
    },
  });

  // Update staff role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      toast({ title: 'Role Updated', description: 'Staff role updated successfully' });
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role',
        variant: 'destructive',
      });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('staff_profiles')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      toast({ title: 'Status Updated', description: 'Staff status updated' });
    },
  });

  // Delete staff via secure edge function
  const deleteStaffMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await supabase.functions.invoke('manage-staff', {
        body: { action: 'delete', user_id: userId },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      toast({ title: 'Staff Removed', description: 'Staff member has been removed' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove staff member',
        variant: 'destructive',
      });
    },
  });

  const filteredStaff = useMemo(() => {
    if (!searchQuery) return staffMembers;
    const query = searchQuery.toLowerCase();
    return staffMembers.filter(
      (s) =>
        s.email.toLowerCase().includes(query) ||
        s.name?.toLowerCase().includes(query) ||
        roleConfig[s.role].label.toLowerCase().includes(query)
    );
  }, [staffMembers, searchQuery]);

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.password) {
      toast({
        title: 'Missing Fields',
        description: 'Email and password are required',
        variant: 'destructive',
      });
      return;
    }
    createStaffMutation.mutate(newUser);
  };

  if (!restaurantId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No restaurant context available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Staff Management
            </CardTitle>
            <CardDescription>
              Manage your restaurant staff accounts and permissions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 border rounded-lg bg-muted/50"
            >
              <h3 className="font-medium mb-4">Add New Staff Member</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="john@restaurant.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(v: AppRole) => setNewUser({ ...newUser, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {staffRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleConfig[role].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleCreateUser}
                  disabled={createStaffMutation.isPending}
                >
                  {createStaffMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Create Staff
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Staff Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No staff members found</p>
            <p className="text-sm">Add your first staff member to get started</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((staff) => {
                const config = roleConfig[staff.role];
                const Icon = config.icon;
                return (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">
                      {staff.name || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {staff.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingUser?.id === staff.id ? (
                        <Select
                          value={editingUser.role}
                          onValueChange={(v: AppRole) => setEditingUser({ ...editingUser, role: v })}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {staffRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {roleConfig[role].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary" className={config.color}>
                          <Icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={staff.is_active}
                        onCheckedChange={(checked) => 
                          toggleActiveMutation.mutate({ id: staff.id, isActive: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {editingUser?.id === staff.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateRoleMutation.mutate({ 
                                userId: staff.user_id, 
                                role: editingUser.role 
                              })}
                              disabled={updateRoleMutation.isPending}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingUser(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingUser(staff)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove {staff.email} from your restaurant. They will no longer be able to access any dashboards.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteStaffMutation.mutate(staff.user_id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;
