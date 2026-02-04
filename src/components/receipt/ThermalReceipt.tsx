import { forwardRef } from 'react';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ReceiptProps {
  restaurantName: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  orderNumber: number | string;
  tableNumber: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  taxRate?: number;
  serviceCharge: number;
  serviceChargeRate?: number;
  totalAmount: number;
  paymentMethod: string;
  currencySymbol?: string;
  createdAt?: Date;
}

const ThermalReceipt = forwardRef<HTMLDivElement, ReceiptProps>(
  (
    {
      restaurantName,
      restaurantAddress = '',
      restaurantPhone = '',
      orderNumber,
      tableNumber,
      items,
      subtotal,
      taxAmount,
      taxRate = 5,
      serviceCharge,
      serviceChargeRate = 0,
      totalAmount,
      paymentMethod,
      currencySymbol = '₹',
      createdAt = new Date(),
    },
    ref
  ) => {
    const formatCurrency = (amount: number) =>
      `${currencySymbol}${amount.toFixed(2)}`;

    return (
      <div
        ref={ref}
        className="thermal-receipt bg-white text-black font-mono text-xs p-4 w-[80mm] mx-auto print:shadow-none"
        style={{
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          lineHeight: '1.4',
        }}
      >
        {/* Header */}
        <div className="text-center mb-3">
          <div className="text-base font-bold mb-1">{restaurantName}</div>
          {restaurantAddress && (
            <div className="text-[10px]">{restaurantAddress}</div>
          )}
          {restaurantPhone && (
            <div className="text-[10px]">Tel: {restaurantPhone}</div>
          )}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* Order Info */}
        <div className="flex justify-between mb-1">
          <span>Date: {format(createdAt, 'dd/MM/yyyy')}</span>
          <span>Time: {format(createdAt, 'HH:mm')}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Table: {tableNumber}</span>
          <span>Order: #{orderNumber}</span>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* Column Headers */}
        <div className="flex justify-between font-bold mb-1">
          <span className="w-8">Qty</span>
          <span className="flex-1 text-left">Item</span>
          <span className="w-20 text-right">Amount</span>
        </div>

        <div className="border-t border-solid border-black my-1" />

        {/* Items */}
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span className="w-8">{item.quantity}x</span>
              <span className="flex-1 text-left truncate pr-2">
                {item.name}
              </span>
              <span className="w-20 text-right">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-solid border-black my-2" />

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({taxRate}%):</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          {serviceCharge > 0 && (
            <div className="flex justify-between">
              <span>Service{serviceChargeRate > 0 ? ` (${serviceChargeRate}%)` : ''}:</span>
              <span>{formatCurrency(serviceCharge)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-double border-black my-2" />

        {/* Grand Total */}
        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL:</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>

        <div className="border-t border-double border-black my-2" />

        {/* Payment Method */}
        <div className="text-center mb-3">
          <span>Payment: {paymentMethod.toUpperCase()}</span>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* Footer */}
        <div className="text-center text-[10px] mt-3 space-y-1">
          <div>Thank you for dining!</div>
          <div>Please visit again.</div>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .thermal-receipt,
            .thermal-receipt * {
              visibility: visible;
            }
            .thermal-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm !important;
              padding: 5mm !important;
              margin: 0 !important;
              background: white !important;
              color: black !important;
            }
            @page {
              size: 80mm auto;
              margin: 0;
            }
          }
        `}</style>
      </div>
    );
  }
);

ThermalReceipt.displayName = 'ThermalReceipt';

export default ThermalReceipt;
