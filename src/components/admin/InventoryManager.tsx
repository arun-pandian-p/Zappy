import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInventoryItems, useCreateInventoryItem, useUpdateInventoryStock, useDeleteInventoryItem } from "@/hooks/useInventory";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, Package, AlertTriangle, CheckCircle2 } from "lucide-react";

interface InventoryManagerProps {
  restaurantId: string;
}

export function InventoryManager({ restaurantId }: InventoryManagerProps) {
  const { toast } = useToast();
  const { data: items = [], isLoading } = useInventoryItems(restaurantId);
  const createItem = useCreateInventoryItem();
  const updateStock = useUpdateInventoryStock();
  const deleteItem = useDeleteInventoryItem();

  const [newItem, setNewItem] = useState({ name: "", unit: "pcs", current_stock: "0", low_stock_threshold: "10" });
  const [adjustments, setAdjustments] = useState<Record<string, string>>({});

  const handleAdd = async () => {
    if (!newItem.name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    try {
      await createItem.mutateAsync({
        restaurant_id: restaurantId,
        name: newItem.name,
        unit: newItem.unit,
        current_stock: parseFloat(newItem.current_stock) || 0,
        low_stock_threshold: parseFloat(newItem.low_stock_threshold) || 10,
      });
      toast({ title: "Item Added" });
      setNewItem({ name: "", unit: "pcs", current_stock: "0", low_stock_threshold: "10" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAdjust = async (id: string, currentStock: number) => {
    const adj = parseFloat(adjustments[id] || "0");
    if (!adj) return;
    try {
      await updateStock.mutateAsync({ id, current_stock: currentStock + adj, restaurantId });
      toast({ title: "Stock Updated" });
      setAdjustments(prev => ({ ...prev, [id]: "" }));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getStockStatus = (item: { current_stock: number; low_stock_threshold: number }) => {
    if (item.current_stock <= 0) return "out";
    if (item.current_stock <= item.low_stock_threshold) return "low";
    return "ok";
  };

  return (
    <div className="space-y-6">
      {/* Add New Item */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Add Inventory Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 flex-1 min-w-[150px]">
              <Label className="text-xs">Name</Label>
              <Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="e.g. Chicken breast" />
            </div>
            <div className="space-y-1 w-24">
              <Label className="text-xs">Unit</Label>
              <Input value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} />
            </div>
            <div className="space-y-1 w-24">
              <Label className="text-xs">Stock</Label>
              <Input type="number" value={newItem.current_stock} onChange={(e) => setNewItem({ ...newItem, current_stock: e.target.value })} />
            </div>
            <div className="space-y-1 w-24">
              <Label className="text-xs">Low Threshold</Label>
              <Input type="number" value={newItem.low_stock_threshold} onChange={(e) => setNewItem({ ...newItem, low_stock_threshold: e.target.value })} />
            </div>
            <Button onClick={handleAdd} disabled={createItem.isPending}>
              {createItem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Inventory ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No inventory items yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Adjust</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.name}
                        <span className="text-xs text-muted-foreground ml-1">({item.unit})</span>
                      </TableCell>
                      <TableCell>{item.current_stock}</TableCell>
                      <TableCell>
                        {status === "out" && <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="w-3 h-3 mr-1" />Out</Badge>}
                        {status === "low" && <Badge className="bg-warning/20 text-warning border-0 text-[10px]"><AlertTriangle className="w-3 h-3 mr-1" />Low</Badge>}
                        {status === "ok" && <Badge className="bg-success/20 text-success border-0 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            className="w-20 h-8 text-sm"
                            placeholder="+/-"
                            value={adjustments[item.id] || ""}
                            onChange={(e) => setAdjustments(prev => ({ ...prev, [item.id]: e.target.value }))}
                          />
                          <Button size="sm" variant="outline" className="h-8" onClick={() => handleAdjust(item.id, item.current_stock)}>
                            Apply
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => {
                            if (confirm("Delete this inventory item?"))
                              deleteItem.mutate({ id: item.id, restaurantId });
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
