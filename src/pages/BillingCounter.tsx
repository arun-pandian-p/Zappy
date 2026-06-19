import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Volume2, VolumeX, BarChart3, Receipt, Clock, ArrowLeft,
  FileText, Banknote, Smartphone, CreditCard as CardIcon, Printer,
  AlertCircle, RefreshCw, Users, TrendingUp, Percent, Eye, ChevronDown, ChevronUp,
  User, Phone, Hash, Calendar, IndianRupee, Wallet, Split, Search, Keyboard
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSound, SOUNDS } from '@/hooks/useSound';
import ThermalReceipt from '@/components/receipt/ThermalReceipt';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useOrders, useUpdateOrderPayment, type OrderWithItems } from '@/hooks/useOrders';
import { useRestaurantDetails } from '@/hooks/useRestaurant';
import { useCreateInvoice, useTodayInvoices, useInvoiceStats, generateInvoiceNumber, type Invoice } from '@/hooks/useInvoices';
import { useTables } from '@/hooks/useTables';
import DiscountButtons from '@/components/billing/DiscountButtons';
import SplitPaymentPanel from '@/components/billing/SplitPaymentPanel';
import { format } from 'date-fns';
import { useAtomicBilling } from '@/hooks/useAtomicBilling';

import { useAuth } from '@/hooks/useAuth';
import { TenantThemeProvider } from '@/components/admin/TenantThemeProvider';
import { LogOut } from 'lucide-react';
import { usePrinter } from '@/hooks/usePrinter';

interface BillingCounterProps {
  embedded?: boolean;
  restaurantId?: string;
}

const BillingCounter = ({ embedded = false, restaurantId: propRestaurantId }: BillingCounterProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { restaurantId: authRestaurantId, signOut } = useAuth();

  const urlRestaurantId = searchParams.get('r');
  const restaurantId = propRestaurantId || authRestaurantId || urlRestaurantId || undefined;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  const printer = usePrinter(restaurantId);

  const { data: restaurant } = useRestaurantDetails(restaurantId);
  const { data: tables = [] } = useTables(restaurantId);
  const { data: allOrders = [], isLoading: ordersLoading, refetch: refetchOrders } = useOrders(
    restaurantId,
    ['ready', 'served', 'billed', 'completed']
  );
  const { data: todayInvoices = [] } = useTodayInvoices(restaurantId);
  const { data: invoiceStats } = useInvoiceStats(restaurantId);

  const updatePayment = useUpdateOrderPayment();
  const createInvoice = useCreateInvoice();
  const { completeBilling, completeBillingFallback, offlineQueueCount, processOfflineQueue } = useAtomicBilling(restaurantId);

  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'wallet' | 'split'>('cash');
  const [splitAmounts, setSplitAmounts] = useState({ cash: 0, upi: 0, card: 0 });
  const [activeTab, setActiveTab] = useState<'billing' | 'history' | 'analytics'>('billing');
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<OrderWithItems | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTableFilter, setSelectedTableFilter] = useState<string | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState(0);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const itemSearchRef = useRef<HTMLInputElement>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  const { isMuted, toggleMute, play: playSound } = useSound(SOUNDS.ORDER_READY);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    if (selectedOrder) {
      setCustomerName(selectedOrder.customer_name || '');
      setCustomerPhone(selectedOrder.customer_phone || '');
    } else {
      setCustomerName('');
      setCustomerPhone('');
    }
  }, [selectedOrder]);

  const handlePhoneChange = async (phone: string) => {
    setCustomerPhone(phone);
    if (phone.trim().length >= 10 && restaurantId) {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('customer_name')
          .eq('restaurant_id', restaurantId)
          .eq('customer_phone', phone.trim())
          .order('created_at', { ascending: false })
          .limit(1);
        if (data && data[0]?.customer_name) {
          setCustomerName(data[0].customer_name);
          toast({ 
            title: 'Returning Customer Detected', 
            description: `Prefilled name: "${data[0].customer_name}"` 
          });
        }
      } catch (err) {
        console.error('Failed to search returning customer:', err);
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'F1') { e.preventDefault(); itemSearchRef.current?.focus(); }
      if (e.key === 'F9') { e.preventDefault(); setSelectedDiscount(prev => prev === 0 ? 5 : prev === 5 ? 10 : prev === 10 ? 15 : prev === 15 ? 20 : 0); }
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); handlePrintReceipt(); }
      if (e.key === '?') { setShowShortcuts(prev => !prev); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const readyOrders = useMemo(() => {
    const orders = allOrders.filter((o) => o.status === 'ready' || o.status === 'served');
    if (selectedTableFilter) return orders.filter(o => o.table_id === selectedTableFilter);
    return orders;
  }, [allOrders, selectedTableFilter]);

  const completedOrders = useMemo(() =>
    allOrders.filter((o) => o.status === 'completed'),
    [allOrders]
  );

  const currencySymbol = restaurant?.currency === 'USD' ? '$' : restaurant?.currency === 'EUR' ? '€' : restaurant?.currency === 'GBP' ? '£' : '₹';
  const taxRate = Number(restaurant?.tax_rate) || 5;
  const serviceChargeRate = Number(restaurant?.service_charge_rate) || 0;
  const restaurantName = restaurant?.name || 'Restaurant';

  // Compute discount
  const discountAmount = selectedOrder
    ? (Number(selectedOrder.subtotal || 0) * selectedDiscount) / 100
    : 0;
  const adjustedTotal = selectedOrder
    ? Math.max(0, Number(selectedOrder.total_amount || 0) - discountAmount)
    : 0;

  const handleCompletePayment = async () => {
    if (!selectedOrder || !restaurantId) return;

    setIsProcessing(true);

    const splitNote = selectedPaymentMethod === 'split'
      ? `Split: Cash ₹${splitAmounts.cash} + UPI ₹${splitAmounts.upi} + Card ₹${splitAmounts.card}`
      : undefined;

    try {
      // Attempt atomic billing transaction (single DB call)
      await completeBilling.mutateAsync({
        orderId: selectedOrder.id,
        paymentMethod: selectedPaymentMethod,
        discountAmount: discountAmount,
        totalAmount: adjustedTotal,
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        notes: splitNote || null,
        invoiceNumber: generateInvoiceNumber(restaurantId),
      });

      if (!isMuted) playSound();

      toast({
        title: '✅ Payment Completed',
        description: `Order #${selectedOrder.order_number} paid via ${selectedPaymentMethod}. Total: ${currencySymbol}${adjustedTotal.toFixed(2)}`,
      });

      setOrderToPrint(selectedOrder);
      setShowReceiptPreview(true);
      setSelectedOrder(null);
      setSelectedDiscount(0);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';

      // Handle specific error types
      if (errorMsg.includes('DUPLICATE_BILLING')) {
        toast({
          title: '⚠️ Already Billed',
          description: 'This order has already been billed. Check the history tab.',
          variant: 'destructive',
        });
      } else if (errorMsg.includes('ORDER_LOCKED')) {
        toast({
          title: '🔒 Order Locked',
          description: 'Another staff member is processing this order.',
          variant: 'destructive',
        });
      } else if (errorMsg.includes('ORDER_CLOSED')) {
        toast({
          title: '⚠️ Order Closed',
          description: 'This order is already completed or cancelled.',
          variant: 'destructive',
        });
      } else if (errorMsg.includes('OFFLINE_QUEUED')) {
        toast({
          title: '📡 Queued Offline',
          description: 'Payment saved locally. Will sync when connection resumes.',
        });
      } else if (errorMsg.includes('could not find the function') || errorMsg.includes('function') ) {
        // RPC not deployed yet — fallback to two-step approach
        try {
          const invoiceItems = selectedOrder.order_items?.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: Number(item.price),
            total: Number(item.price) * item.quantity,
          })) || [];

          await completeBillingFallback.mutateAsync({
            orderId: selectedOrder.id,
            paymentMethod: selectedPaymentMethod,
            discountAmount: discountAmount,
            totalAmount: adjustedTotal,
            customerName: customerName.trim() || null,
            customerPhone: customerPhone.trim() || null,
            notes: splitNote || null,
            invoiceNumber: generateInvoiceNumber(restaurantId),
            restaurantId,
            subtotal: Number(selectedOrder.subtotal) || 0,
            taxAmount: Number(selectedOrder.tax_amount) || 0,
            serviceCharge: Number(selectedOrder.service_charge) || 0,
            items: invoiceItems,
          });

          if (!isMuted) playSound();

          toast({
            title: '✅ Payment Completed',
            description: `Order #${selectedOrder.order_number} paid via ${selectedPaymentMethod}. Total: ${currencySymbol}${adjustedTotal.toFixed(2)}`,
          });

          setOrderToPrint(selectedOrder);
          setShowReceiptPreview(true);
          setSelectedOrder(null);
          setSelectedDiscount(0);
        } catch (fallbackErr) {
          toast({
            title: 'Payment Failed',
            description: 'Failed to process payment. Please try again.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Payment Failed',
          description: errorMsg || 'Failed to process payment. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = async (itemToPrint?: OrderWithItems | Invoice) => {
    const target = itemToPrint || orderToPrint;
    if (!target) {
      window.print();
      return;
    }

    let receiptData;
    if ('invoice_number' in target) {
      // It's an Invoice
      receiptData = {
        restaurantName: restaurantName,
        address: restaurant?.address || undefined,
        phone: restaurant?.phone || undefined,
        invoiceNumber: target.invoice_number,
        tableNumber: 'Table',
        date: new Date(target.created_at),
        items: target.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.total),
        })),
        subtotal: Number(target.subtotal) || 0,
        taxRate: taxRate,
        taxAmount: Number(target.tax_amount) || 0,
        serviceCharge: Number(target.service_charge) || 0,
        discount: Number(target.discount_amount) || 0,
        total: Number(target.total_amount) || 0,
        paymentMethod: target.payment_method,
      };
    } else {
      // It's an OrderWithItems
      receiptData = {
        restaurantName: restaurantName,
        address: restaurant?.address || undefined,
        phone: restaurant?.phone || undefined,
        invoiceNumber: String(target.order_number),
        tableNumber: target.table?.table_number || 'N/A',
        date: new Date(target.created_at || Date.now()),
        items: target.order_items?.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.price) * item.quantity,
        })) || [],
        subtotal: Number(target.subtotal) || 0,
        taxRate: taxRate,
        taxAmount: Number(target.tax_amount) || 0,
        serviceCharge: Number(target.service_charge) || 0,
        discount: target.id === selectedOrder?.id ? discountAmount : 0,
        total: Number(target.total_amount) || 0,
        paymentMethod: target.payment_method || 'cash',
      };
    }

    try {
      if (printer.isConnected) {
        await printer.printReceipt(receiptData, currencySymbol);
        toast({ title: 'Receipt Printed', description: 'Invoice sent to printer.' });
      } else {
        window.print();
      }
    } catch (err) {
      toast({ title: 'Print Failed', description: 'Failed, running browser fallback.', variant: 'destructive' });
      window.print();
    }
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    return mins < 1 ? 'Just now' : `${mins}m ago`;
  };

  const todayTotal = invoiceStats?.totalRevenue || 0;
  const completedCount = invoiceStats?.invoiceCount || 0;
  const paymentBreakdown = invoiceStats?.paymentBreakdown || { cash: 0, card: 0, upi: 0, wallet: 0, split: 0 };

  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-lg font-semibold mb-2">No Restaurant Selected</h2>
            <p className="text-muted-foreground mb-4">
              Please access this page with ?r=your-restaurant-id
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TenantThemeProvider primaryColor={restaurant?.primary_color} secondaryColor={restaurant?.secondary_color}>
    <div className="min-h-screen bg-background">
      {/* Header - hidden when embedded */}
      {!embedded && (
        <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate('/roles')}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h1 className="font-bold">{restaurantName} — Billing</h1>
                    <p className="text-xs text-muted-foreground">
                      {ordersLoading ? 'Loading...' : `${readyOrders.length} pending · ${completedCount} invoiced today`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Today's quick stat */}
                <div className="hidden md:flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg mr-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{currencySymbol}{todayTotal.toFixed(0)}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetchOrders()}
                  disabled={ordersLoading}
                >
                  <RefreshCw className={`w-5 h-5 ${ordersLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" size="icon" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
                  <LogOut className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setShowShortcuts(!showShortcuts)} title="Keyboard shortcuts (?)">
                  <Keyboard className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mb-6">
            <TabsTrigger value="billing" className="gap-2">
              <Receipt className="w-4 h-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <FileText className="w-4 h-4" />
              History ({todayInvoices.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* ════════════════════════ BILLING TAB ════════════════════════ */}
          <TabsContent value="billing">
            {/* Keyboard Shortcuts Banner */}
            <AnimatePresence>
              {showShortcuts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <Card className="bg-muted/50 border-dashed">
                    <CardContent className="p-4">
                      <p className="text-xs font-medium mb-2 text-muted-foreground">Keyboard Shortcuts</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <span><kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">F1</kbd> Search items</span>
                        <span><kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">F9</kbd> Cycle discount</span>
                        <span><kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">Ctrl+P</kbd> Print receipt</span>
                        <span><kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">?</kbd> Toggle shortcuts</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Item Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={itemSearchRef}
                  placeholder="Search items to add to order (F1)..."
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            {/* Table Selector */}
            {tables.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Filter by Table</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedTableFilter === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTableFilter(null)}
                    className="rounded-lg"
                  >
                    All ({readyOrders.length})
                  </Button>
                  {tables.map((table) => {
                    const orderCount = allOrders.filter(o =>
                      o.table_id === table.id && (o.status === 'ready' || o.status === 'served')
                    ).length;
                    return (
                      <Button
                        key={table.id}
                        variant={selectedTableFilter === table.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTableFilter(table.id)}
                        className={`rounded-lg ${orderCount > 0 ? 'border-success/50' : ''}`}
                      >
                        {table.table_number}
                        {orderCount > 0 && (
                          <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1 text-[10px]">
                            {orderCount}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ready Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-success" />
                    Ready for Billing
                    <Badge variant="secondary" className="ml-auto">{readyOrders.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[65vh] overflow-y-auto">
                  <AnimatePresence>
                    {ordersLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : readyOrders.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Receipt className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium">No orders ready for billing</p>
                        <p className="text-xs mt-1">Orders will appear here when kitchen marks them ready</p>
                      </div>
                    ) : (
                      readyOrders.map((order) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all border-2 hover:shadow-md ${
                              selectedOrder?.id === order.id
                                ? 'border-primary bg-primary/5 shadow-md'
                                : 'border-success/30 bg-success/5 hover:border-success/60'
                            }`}
                            onClick={() => {
                              setSelectedOrder(order);
                              setSelectedDiscount(0);
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-bold">
                                      {order.table?.table_number || 'Takeaway'}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[10px]">
                                      #{order.order_number}
                                    </Badge>
                                  </div>
                                  {(order.customer_name || order.customer_phone) && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {order.customer_name && (
                                        <span className="flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          {order.customer_name}
                                        </span>
                                      )}
                                      {order.customer_phone && (
                                        <span className="flex items-center gap-1">
                                          <Phone className="w-3 h-3" />
                                          {order.customer_phone}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg">
                                    {currencySymbol}{Number(order.total_amount || 0).toFixed(2)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {getTimeAgo(order.created_at || new Date().toISOString())}
                                  </p>
                                </div>
                              </div>
                              {/* Item summary */}
                              <div className="text-xs text-muted-foreground border-t pt-2 mt-1">
                                {order.order_items?.slice(0, 3).map((item, i) => (
                                  <span key={item.id}>
                                    {i > 0 && ' · '}
                                    {item.quantity}× {item.name}
                                  </span>
                                ))}
                                {(order.order_items?.length || 0) > 3 && (
                                  <span className="text-primary"> +{(order.order_items?.length || 0) - 3} more</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Invoice Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Invoice Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedOrder ? (
                    <div className="space-y-4">
                      {/* Order meta */}
                      <div className="flex flex-wrap gap-3 text-xs">
                        <Badge variant="outline" className="gap-1">
                          <Hash className="w-3 h-3" />
                          Order #{selectedOrder.order_number}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          {selectedOrder.table?.table_number || 'Takeaway'}
                        </Badge>
                        {selectedOrder.customer_name && (
                          <Badge variant="outline" className="gap-1">
                            <User className="w-3 h-3" />
                            {selectedOrder.customer_name}
                          </Badge>
                        )}
                        {selectedOrder.customer_phone && (
                          <Badge variant="outline" className="gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedOrder.customer_phone}
                          </Badge>
                        )}
                      </div>

                      {/* Order Items */}
                      <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Items</p>
                        {selectedOrder.order_items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <span className="bg-primary/10 text-primary text-xs font-bold w-6 h-6 rounded flex items-center justify-center">
                                {item.quantity}
                              </span>
                              {item.name}
                            </span>
                            <span className="font-medium">
                              {currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Subtotal</span>
                          <span>{currencySymbol}{Number(selectedOrder.subtotal || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Tax ({taxRate}%)</span>
                          <span>{currencySymbol}{Number(selectedOrder.tax_amount || 0).toFixed(2)}</span>
                        </div>
                        {serviceChargeRate > 0 && (
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Service Charge ({serviceChargeRate}%)</span>
                            <span>{currencySymbol}{Number(selectedOrder.service_charge || 0).toFixed(2)}</span>
                          </div>
                        )}
                        {selectedDiscount > 0 && (
                          <div className="flex justify-between text-sm text-success">
                            <span>Discount ({selectedDiscount}%)</span>
                            <span>−{currencySymbol}{discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                          <span>Total</span>
                          <span className="text-primary">
                            {currencySymbol}{adjustedTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div className="pt-3 border-t space-y-3">
                        <p className="text-sm font-semibold text-foreground">Customer Details</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="cust-phone-input" className="text-xs font-semibold">Phone Number</Label>
                            <Input
                              id="cust-phone-input"
                              placeholder="e.g. 9876543210"
                              value={customerPhone}
                              onChange={(e) => handlePhoneChange(e.target.value)}
                              className="h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="cust-name-input" className="text-xs font-semibold">Customer Name</Label>
                            <Input
                              id="cust-name-input"
                              placeholder="e.g. John Doe"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className="h-9 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Quick Discount */}
                      <DiscountButtons
                        selectedDiscount={selectedDiscount}
                        onSelectDiscount={setSelectedDiscount}
                      />

                      {/* Payment Methods */}
                      <div className="pt-2">
                        <p className="text-sm font-medium mb-3">Payment Method</p>
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            { id: 'cash', icon: Banknote, label: 'Cash' },
                            { id: 'upi', icon: Smartphone, label: 'UPI' },
                            { id: 'card', icon: CardIcon, label: 'Card' },
                            { id: 'wallet', icon: Wallet, label: 'Wallet' },
                            { id: 'split', icon: Split, label: 'Split' },
                          ].map(({ id, icon: Icon, label }) => (
                            <Button
                              key={id}
                              variant={selectedPaymentMethod === id ? 'default' : 'outline'}
                              className="flex flex-col h-auto py-3 gap-1"
                              onClick={() => setSelectedPaymentMethod(id as typeof selectedPaymentMethod)}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="text-xs">{label}</span>
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Split Payment Panel */}
                      {selectedPaymentMethod === 'split' && (
                        <SplitPaymentPanel
                          total={adjustedTotal}
                          currencySymbol={currencySymbol}
                          onSplitChange={setSplitAmounts}
                        />
                      )}

                      <Button
                        className="w-full bg-success hover:bg-success/90"
                        size="lg"
                        onClick={handleCompletePayment}
                        disabled={isProcessing || (selectedPaymentMethod === 'split' && Math.abs(adjustedTotal - splitAmounts.cash - splitAmounts.upi - splitAmounts.card) > 0.01)}
                      >
                        {isProcessing ? 'Processing...' : `Pay ${currencySymbol}${adjustedTotal.toFixed(2)} via ${selectedPaymentMethod.toUpperCase()}`}
                      </Button>

                      {/* Cash Received & Change */}
                      {selectedPaymentMethod === 'cash' && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-lg space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Cash Received</label>
                          <Input
                            type="number"
                            placeholder="Enter amount received..."
                            value={cashReceived || ''}
                            onChange={(e) => setCashReceived(Number(e.target.value))}
                            className="h-10"
                          />
                          {cashReceived > 0 && cashReceived >= adjustedTotal && (
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-sm font-medium text-success">Change to Return</span>
                              <span className="text-lg font-bold text-success">
                                {currencySymbol}{(cashReceived - adjustedTotal).toFixed(2)}
                              </span>
                            </div>
                          )}
                          {cashReceived > 0 && cashReceived < adjustedTotal && (
                            <p className="text-xs text-destructive">Insufficient amount (short by {currencySymbol}{(adjustedTotal - cashReceived).toFixed(2)})</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <Receipt className="w-14 h-14 mx-auto mb-4 opacity-30" />
                      <p className="font-medium">Select an order to view invoice</p>
                      <p className="text-xs mt-1">Click any order from the left panel</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ════════════════════════ HISTORY TAB ════════════════════════ */}
          <TabsContent value="history">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Today's Revenue</p>
                    <p className="text-xl font-bold text-primary">{currencySymbol}{todayTotal.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-success/5 border-success/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Invoices</p>
                    <p className="text-xl font-bold text-success">{completedCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-accent/50 border-accent">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg. Invoice</p>
                    <p className="text-xl font-bold">
                      {currencySymbol}{completedCount > 0 ? (todayTotal / completedCount).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-warning/5 border-warning/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Percent className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Discount Given</p>
                    <p className="text-xl font-bold text-warning">{currencySymbol}{(invoiceStats?.totalDiscount || 0).toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Today's Invoices</span>
                  <Badge variant="secondary">{todayInvoices.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayInvoices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No invoices today</p>
                    <p className="text-xs mt-1">Completed payments will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayInvoices.map((invoice) => {
                      const isExpanded = expandedInvoiceId === invoice.id;
                      return (
                        <Card key={invoice.id} className="bg-muted/30 border">
                          <CardContent
                            className="p-4 cursor-pointer"
                            onClick={() => setExpandedInvoiceId(isExpanded ? null : invoice.id)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <span className="text-sm font-medium">{invoice.invoice_number}</span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="secondary" className="text-[10px] h-5">
                                      {invoice.payment_method.toUpperCase()}
                                    </Badge>
                                    {invoice.customer_name && (
                                      <span className="text-[11px] text-muted-foreground">{invoice.customer_name}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="font-semibold">
                                    {currencySymbol}{Number(invoice.total_amount).toFixed(2)}
                                  </span>
                                  <p className="text-[10px] text-muted-foreground">
                                    {format(new Date(invoice.created_at), 'hh:mm a')}
                                  </p>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>

                            {/* Expanded details */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 pt-3 border-t space-y-2">
                                    {invoice.items.map((item) => (
                                      <div key={item.id} className="flex justify-between text-xs">
                                        <span>{item.quantity}× {item.name}</span>
                                        <span>{currencySymbol}{item.total.toFixed(2)}</span>
                                      </div>
                                    ))}
                                    <div className="border-t pt-2 mt-2 space-y-1 text-xs text-muted-foreground">
                                      <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Tax</span>
                                        <span>{currencySymbol}{invoice.tax_amount.toFixed(2)}</span>
                                      </div>
                                      {invoice.service_charge > 0 && (
                                        <div className="flex justify-between">
                                          <span>Service Charge</span>
                                          <span>{currencySymbol}{invoice.service_charge.toFixed(2)}</span>
                                        </div>
                                      )}
                                      {invoice.discount_amount > 0 && (
                                        <div className="flex justify-between text-success">
                                          <span>Discount</span>
                                          <span>−{currencySymbol}{invoice.discount_amount.toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                    {invoice.notes && (
                                      <p className="text-[11px] text-muted-foreground italic pt-1">
                                        Note: {invoice.notes}
                                      </p>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full mt-3 gap-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePrintReceipt(invoice);
                                      }}
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      Reprint
                                    </Button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════════════════════ ANALYTICS TAB ════════════════════════ */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground mb-1">Today's Revenue</p>
                  <p className="text-3xl font-bold text-primary">
                    {currencySymbol}{todayTotal.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-success/5 border-success/20">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground mb-1">Total Invoices</p>
                  <p className="text-3xl font-bold text-success">{completedCount}</p>
                </CardContent>
              </Card>
              <Card className="bg-accent/50 border-accent">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground mb-1">Avg. Invoice Value</p>
                  <p className="text-3xl font-bold">
                    {currencySymbol}{completedCount > 0 ? (todayTotal / completedCount).toFixed(2) : '0.00'}
                  </p>
                </CardContent>
              </Card>
              <Card className="border">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground mb-1">Pending Orders</p>
                  <p className="text-3xl font-bold text-warning">{readyOrders.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Method Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Method Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  {[
                    { label: 'Cash', count: paymentBreakdown.cash, icon: Banknote, color: 'text-success' },
                    { label: 'Card', count: paymentBreakdown.card, icon: CardIcon, color: 'text-primary' },
                    { label: 'UPI', count: paymentBreakdown.upi, icon: Smartphone, color: 'text-accent-foreground' },
                    { label: 'Wallet', count: paymentBreakdown.wallet || 0, icon: Wallet, color: 'text-warning' },
                    { label: 'Split', count: paymentBreakdown.split || 0, icon: Split, color: 'text-muted-foreground' },
                  ].map(({ label, count, icon: Icon, color }) => {
                    const pct = completedCount > 0 ? Math.round((count / completedCount) * 100) : 0;
                    return (
                      <div key={label} className="text-center p-4 rounded-lg bg-muted/50">
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{pct}%</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Receipt Preview Dialog */}
      <Dialog open={showReceiptPreview} onOpenChange={setShowReceiptPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Receipt Preview
            </DialogTitle>
          </DialogHeader>
          {orderToPrint && (
            <>
              <div className="border rounded-lg overflow-auto max-h-[60vh]">
                <ThermalReceipt
                  ref={receiptRef}
                  restaurantName={restaurantName}
                  restaurantAddress={restaurant?.address || ''}
                  restaurantPhone={restaurant?.phone || ''}
                  orderNumber={String(orderToPrint.order_number)}
                  tableNumber={orderToPrint.table?.table_number || 'N/A'}
                  items={orderToPrint.order_items?.map(item => ({
                    id: item.id,
                    order_id: item.order_id,
                    menu_item_id: item.menu_item_id || '',
                    name: item.name,
                    quantity: item.quantity,
                    price: Number(item.price),
                  })) || []}
                  subtotal={Number(orderToPrint.subtotal) || 0}
                  taxAmount={Number(orderToPrint.tax_amount) || 0}
                  taxRate={taxRate}
                  serviceCharge={Number(orderToPrint.service_charge) || 0}
                  serviceChargeRate={serviceChargeRate}
                  totalAmount={Number(orderToPrint.total_amount) || 0}
                  paymentMethod={orderToPrint.payment_method || 'cash'}
                  currencySymbol={currencySymbol}
                  createdAt={new Date(orderToPrint.created_at || Date.now())}
                />
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowReceiptPreview(false)}
                >
                  Close
                </Button>
                <Button className="flex-1" onClick={handlePrintReceipt}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </TenantThemeProvider>
  );
};

export default BillingCounter;
