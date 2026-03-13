import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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

const useAdminAccounts = () => {
  return useQuery({
    queryKey: ['admin-accounts'],
    queryFn: async () => {
      // Get restaurant_admin roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, restaurant_id, created_at')
        .eq('role', 'restaurant_admin');

      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      // Get staff profiles for these users
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
  });
};

const AdminAccountsTable = () => {
  const { data: admins = [], isLoading } = useAdminAccounts();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Restaurant Admins
        </CardTitle>
        <CardDescription>
          Only restaurant admin accounts are shown. Each admin manages their own staff independently.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {admins.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No restaurant admin accounts found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.user_id}>
                  <TableCell className="font-medium">
                    {admin.staff_name || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {admin.staff_email || '—'}
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
                    {admin.created_at
                      ? new Date(admin.created_at).toLocaleDateString()
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAccountsTable;
