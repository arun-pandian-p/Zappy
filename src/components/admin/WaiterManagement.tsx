import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { invokeFunction } from "@/integrations/supabase/functions";
import { Trash2 } from "lucide-react";

export function WaiterManagement({ restaurantId }: { restaurantId: string }) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [newEmp, setNewEmp] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "WAITER",
    phone: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadEmployees();
    
    // Realtime subscription
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, (payload) => {
        loadEmployees();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  async function loadEmployees() {
    if (!restaurantId) return;
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  }

  async function handleDeleteEmployee(emp: any) {
    if (!confirm(`Are you sure you want to delete ${emp.full_name}? This will revoke their access.`)) return;
    setIsDeleting(emp.id);

    try {
      const { data: funcData, error: funcError } = await invokeFunction('manage-staff', {
        body: {
          action: 'delete',
          user_id: emp.user_id
        }
      });

      if (funcError) throw funcError;
      if (funcData?.error) throw new Error(funcData.error);

      // Delete from employees table
      const { error: dbError } = await supabase.from('employees').delete().eq('id', emp.id);
      if (dbError) throw dbError;

      toast({ title: "Success", description: "Employee deleted successfully." });
      loadEmployees();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Failed to delete employee", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  }

  async function handleCreateEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double execution
    if (!newEmp.username || !newEmp.password || !newEmp.full_name) {
      toast({ title: "Validation Error", description: "Username, password, and full name are required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      // 1. Existing user check to prevent duplicate faux emails
      const { data: existingEmp } = await supabase
        .from('employees')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('username', newEmp.username)
        .maybeSingle();

      if (existingEmp) {
        throw new Error(`Username '${newEmp.username}' is already taken. Please choose another.`);
      }

      // Get restaurant slug
      const { data: restData } = await supabase.from('restaurants').select('slug').eq('id', restaurantId).single();
      const slug = restData?.slug || restaurantId.substring(0,8);

      // Create user via Supabase Edge Function to bypass rate limits
      const fauxEmail = `${newEmp.username.toLowerCase().replace(/[^a-z0-9]/g, '')}@${slug}.zappy.local`;

      const roleMap: Record<string, string> = {
        WAITER: 'waiter_staff',
        KITCHEN_STAFF: 'kitchen_staff',
        MANAGER: 'restaurant_admin',
        CASHIER: 'billing_staff'
      };

      const { data: funcData, error: funcError } = await invokeFunction('manage-staff', {
        body: {
          action: 'create',
          email: fauxEmail,
          password: newEmp.password,
          name: newEmp.full_name,
          role: roleMap[newEmp.role] || 'waiter_staff',
          restaurant_id: restaurantId
        }
      });

      if (funcError) throw funcError;
      if (funcData?.error) throw new Error(funcData.error);

      const newUserId = funcData?.user_id;

      // Insert into employees table
      const { error: dbError } = await supabase.from('employees').insert({
        restaurant_id: restaurantId,
        user_id: newUserId,
        username: newEmp.username,
        full_name: newEmp.full_name,
        role: newEmp.role,
        phone: newEmp.phone,
        status: 'OFF_DUTY'
      });

      if (dbError) throw dbError;

      // Note: Edge function already inserts into user_roles and staff_profiles!

      toast({ title: "Success", description: "Employee created successfully." });
      setIsDialogOpen(false);
      setNewEmp({ username: "", password: "", full_name: "", role: "WAITER", phone: "" });
      loadEmployees();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Staff Directory</h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Staff</Button>
          </DialogTrigger>
          <DialogContent aria-describedby="add-staff-desc">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription id="add-staff-desc">Create a new login for a waiter or kitchen staff.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={newEmp.full_name} onChange={e => setNewEmp({...newEmp, full_name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={newEmp.username} onChange={e => setNewEmp({...newEmp, username: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={newEmp.password} onChange={e => setNewEmp({...newEmp, password: e.target.value})} required minLength={6} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newEmp.role} onValueChange={v => setNewEmp({...newEmp, role: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WAITER">Waiter</SelectItem>
                      <SelectItem value="KITCHEN_STAFF">Kitchen Staff</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="CASHIER">Cashier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Phone (Optional)</Label>
                  <Input value={newEmp.phone} onChange={e => setNewEmp({...newEmp, phone: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Create Employee"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center">No staff found.</TableCell></TableRow>
              ) : (
                employees.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.full_name}</TableCell>
                    <TableCell><Badge variant="outline">{emp.role.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">@{emp.username}</TableCell>
                    <TableCell>{emp.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={emp.status === 'ACTIVE' ? 'default' : emp.status === 'ON_BREAK' ? 'secondary' : 'outline'}>
                        {emp.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteEmployee(emp)}
                        disabled={isDeleting === emp.id}
                      >
                        {isDeleting === emp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
