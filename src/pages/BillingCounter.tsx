import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Volume2, VolumeX, BarChart3, Receipt, Clock, ArrowLeft, FileText, Banknote, Smartphone, CreditCard as CardIcon, Printer, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
import { useRestaurant } from '@/hooks/useRestaurant';
import { useCreateInvoice, useTodayInvoices, useInvoiceStats, generateInvoiceNumber, type Invoice } from '@/hooks/useInvoices';

// Demo restaurant ID - in production, this would come from auth context
const DEMO_RESTAURANT_ID = import.meta.env.VITE_DEMO_RESTAURANT_ID || '';

const BillingCounter = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('r') || DEMO_RESTAURANT_ID;
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);

  // Fetch restaurant settings
  const { data: restaurant } = useRestaurant(restaurantId);

  // Fetch orders - ready and completed
  const { data: allOrders = [], isLoading: ordersLoading, refetch: refetchOrders } = useOrders(
    restaurantId,
    ['ready', 'served', 'completed']
  );

  // Fetch invoices
  const { data: todayInvoices = [] } = useTodayInvoices(restaurantId);
  const { data: invoiceStats } = useInvoiceStats(restaurantId);

  // Mutations
  const updatePayment = useUpdateOrderPayment();
  const createInvoice = useCreateInvoice();

  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [activeTab, setActiveTab] = useState<'billing' | 'history' | 'analytics'>('billing');
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<OrderWithItems | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { isMuted, toggleMute, play: playSound } = useSound(SOUNDS.ORDER_READY);

  // Filter orders
  const readyOrders = useMemo(() => 
    allOrders.filter((o) => o.status === 'ready' || o.status === 'served'),
    [allOrders]
  );
  const completedOrders = useMemo(() => 
    allOrders.filter((o) => o.status === 'completed'),
    [allOrders]
  );

  // Restaurant settings with defaults
  const currencySymbol = restaurant?.currency || '₹';
  const taxRate = Number(restaurant?.tax_rate) || 5;
  const serviceChargeRate = Number(restaurant?.service_charge_rate) || 0;
  const restaurantName = restaurant?.name || 'Restaurant';

  const handleCompletePayment = async () => {
    if (!selectedOrder || !restaurantId) return;

    setIsProcessing(true);
    try {
      // Update order status and payment
      await updatePayment.mutateAsync({
        id: selectedOrder.id,
        paymentMethod: selectedPaymentMethod,
        paymentStatus: 'paid',
      });

      // Create invoice
      const invoiceItems = selectedOrder.order_items?.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.price) * item.quantity,
      })) || [];

      await createInvoice.mutateAsync({
        restaurant_id: restaurantId,
        order_id: selectedOrder.id,
        invoice_number: generateInvoiceNumber(restaurantId),
        subtotal: Number(selectedOrder.subtotal) || 0,
        tax_amount: Number(selectedOrder.tax_amount) || 0,
        service_charge: Number(selectedOrder.service_charge) || 0,
        total_amount: Number(selectedOrder.total_amount) || 0,
        payment_method: selectedPaymentMethod,
        items: invoiceItems,
        customer_name: selectedOrder.customer_name || undefined,
        customer_phone: selectedOrder.customer_phone || undefined,
      });

      if (!isMuted) playSound();

      toast({
        title: 'Payment Completed',
        description: `Order #${selectedOrder.order_number} has been paid via ${selectedPaymentMethod}.`,
      });

      // Show receipt preview
      setOrderToPrint(selectedOrder);
      setShowReceiptPreview(true);
      setSelectedOrder(null);
    } catch (err) {
      toast({
        title: 'Payment Failed',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    return mins < 1 ? 'Just now' : `${mins}m ago`;
  };

  const todayTotal = invoiceStats?.totalRevenue || 0;
  const completedCount = invoiceStats?.invoiceCount || 0;

  // Error state
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
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                  <h1 className="font-bold">Billing Counter</h1>
                  <p className="text-xs text-muted-foreground">
                    {ordersLoading ? 'Loading...' : `${readyOrders.length} orders ready for billing`}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetchOrders()}
                disabled={ordersLoading}
              >
                <RefreshCw className={`w-5 h-5 ${ordersLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

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
              History
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="billing">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ready Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-success" />
                    Ready for Billing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AnimatePresence>
                    {ordersLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-24 bg-muted rounded animate-pulse" />
                        ))}
                      </div>
                    ) : readyOrders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No orders ready for billing</p>
                      </div>
                    ) : (
                      readyOrders.map((order) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <Card
                            className={`cursor-pointer card-hover border-2 ${
                              selectedOrder?.id === order.id
                                ? 'border-primary bg-primary/5'
                                : 'border-success/30 bg-success/5'
                            }`}
                            onClick={() => setSelectedOrder(order)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <Badge variant="outline" className="font-bold mb-2">
                                    {order.table?.table_number || 'N/A'}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground">
                                    Order #{order.order_number}
                                  </p>
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
                    Invoice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedOrder ? (
                    <div className="space-y-4">
                      {/* Order Items */}
                      <div className="space-y-2">
                        {selectedOrder.order_items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span>
                              {currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>{currencySymbol}{Number(selectedOrder.subtotal || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tax ({taxRate}%)</span>
                          <span>{currencySymbol}{Number(selectedOrder.tax_amount || 0).toFixed(2)}</span>
                        </div>
                        {serviceChargeRate > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Service Charge ({serviceChargeRate}%)</span>
                            <span>{currencySymbol}{Number(selectedOrder.service_charge || 0).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                          <span>Total</span>
                          <span className="text-primary">
                            {currencySymbol}{Number(selectedOrder.total_amount || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div className="pt-4">
                        <p className="text-sm font-medium mb-3">Payment Method</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'cash', icon: Banknote, label: 'Cash' },
                            { id: 'upi', icon: Smartphone, label: 'UPI' },
                            { id: 'card', icon: CardIcon, label: 'Card' },
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

                      <Button
                        className="w-full bg-success hover:bg-success/90"
                        size="lg"
                        onClick={handleCompletePayment}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Processing...' : 'Complete Payment'}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select an order to view invoice</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Today's Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {todayInvoices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No invoices today</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayInvoices.map((invoice) => (
                      <Card key={invoice.id} className="bg-muted/50">
                        <CardContent className="p-4 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div>
                              <span className="text-sm font-medium">
                                {invoice.invoice_number}
                              </span>
                              {invoice.payment_method && (
                                <Badge variant="secondary" className="ml-2">
                                  {invoice.payment_method.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">
                              {currencySymbol}{Number(invoice.total_amount).toFixed(2)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Today's Revenue</p>
                  <p className="text-3xl font-bold text-primary">
                    {currencySymbol}{todayTotal.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-success/5 border-success/20">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Invoices Today</p>
                  <p className="text-3xl font-bold text-success">{completedCount}</p>
                </CardContent>
              </Card>
              <Card className="bg-warning/5 border-warning/20">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Avg. Invoice Value</p>
                  <p className="text-3xl font-bold text-warning">
                    {currencySymbol}
                    {completedCount > 0
                      ? (todayTotal / completedCount).toFixed(2)
                      : '0.00'}
                  </p>
                </CardContent>
              </Card>
            </div>
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
  );
};

export default BillingCounter;
