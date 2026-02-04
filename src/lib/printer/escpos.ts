// ESC/POS Command Builder for 80mm thermal printers

export const ESC = 0x1B;
export const GS = 0x1D;
export const FS = 0x1C;
export const DLE = 0x10;
export const EOT = 0x04;
export const NUL = 0x00;

// Text formatting
export const COMMANDS = {
  // Initialize printer
  INIT: [ESC, 0x40],
  
  // Text alignment
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  
  // Text style
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  UNDERLINE_ON: [ESC, 0x2D, 0x01],
  UNDERLINE_OFF: [ESC, 0x2D, 0x00],
  DOUBLE_WIDTH_ON: [GS, 0x21, 0x10],
  DOUBLE_HEIGHT_ON: [GS, 0x21, 0x01],
  DOUBLE_SIZE_ON: [GS, 0x21, 0x11],
  NORMAL_SIZE: [GS, 0x21, 0x00],
  
  // Line spacing
  LINE_SPACING_DEFAULT: [ESC, 0x32],
  LINE_SPACING_SET: (n: number) => [ESC, 0x33, n],
  
  // Paper handling
  FEED_LINE: [ESC, 0x64, 0x01],
  FEED_LINES: (n: number) => [ESC, 0x64, n],
  CUT_PAPER: [GS, 0x56, 0x00],
  CUT_PAPER_PARTIAL: [GS, 0x56, 0x01],
  
  // Cash drawer
  CASH_DRAWER_KICK: [ESC, 0x70, 0x00, 0x19, 0xFA],
};

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ReceiptData {
  restaurantName: string;
  address?: string;
  phone?: string;
  invoiceNumber: string;
  tableNumber: string;
  date: Date;
  items: ReceiptItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  serviceCharge: number;
  discount?: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  footerText?: string;
}

export class ESCPOSBuilder {
  private buffer: number[] = [];
  private charWidth = 48; // Characters per line for 80mm paper

  constructor() {
    this.init();
  }

  private init(): this {
    this.buffer.push(...COMMANDS.INIT);
    return this;
  }

  alignLeft(): this {
    this.buffer.push(...COMMANDS.ALIGN_LEFT);
    return this;
  }

  alignCenter(): this {
    this.buffer.push(...COMMANDS.ALIGN_CENTER);
    return this;
  }

  alignRight(): this {
    this.buffer.push(...COMMANDS.ALIGN_RIGHT);
    return this;
  }

  bold(on: boolean = true): this {
    this.buffer.push(...(on ? COMMANDS.BOLD_ON : COMMANDS.BOLD_OFF));
    return this;
  }

  underline(on: boolean = true): this {
    this.buffer.push(...(on ? COMMANDS.UNDERLINE_ON : COMMANDS.UNDERLINE_OFF));
    return this;
  }

  doubleSize(): this {
    this.buffer.push(...COMMANDS.DOUBLE_SIZE_ON);
    return this;
  }

  normalSize(): this {
    this.buffer.push(...COMMANDS.NORMAL_SIZE);
    return this;
  }

  text(str: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    this.buffer.push(...Array.from(bytes));
    return this;
  }

  newline(): this {
    this.buffer.push(0x0A);
    return this;
  }

  feed(lines: number = 1): this {
    this.buffer.push(...COMMANDS.FEED_LINES(lines));
    return this;
  }

  cut(partial: boolean = false): this {
    this.buffer.push(...(partial ? COMMANDS.CUT_PAPER_PARTIAL : COMMANDS.CUT_PAPER));
    return this;
  }

  openCashDrawer(): this {
    this.buffer.push(...COMMANDS.CASH_DRAWER_KICK);
    return this;
  }

  line(char: string = "-"): this {
    this.text(char.repeat(this.charWidth));
    this.newline();
    return this;
  }

  doubleLine(char: string = "="): this {
    return this.line(char);
  }

  row(left: string, right: string): this {
    const padding = this.charWidth - left.length - right.length;
    if (padding > 0) {
      this.text(left + " ".repeat(padding) + right);
    } else {
      this.text(left.slice(0, this.charWidth - right.length - 1) + " " + right);
    }
    this.newline();
    return this;
  }

  itemRow(name: string, qty: number, price: number, total: number, currencySymbol: string = "₹"): this {
    const qtyStr = `${qty}x`;
    const priceStr = `${currencySymbol}${price.toFixed(2)}`;
    const totalStr = `${currencySymbol}${total.toFixed(2)}`;
    
    // Item name (may wrap)
    const maxNameLen = this.charWidth - qtyStr.length - totalStr.length - 4;
    const displayName = name.length > maxNameLen ? name.slice(0, maxNameLen - 2) + ".." : name;
    
    const leftPart = `${qtyStr} ${displayName}`;
    const padding = this.charWidth - leftPart.length - totalStr.length;
    
    this.text(leftPart + " ".repeat(Math.max(1, padding)) + totalStr);
    this.newline();
    return this;
  }

  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  static buildReceipt(data: ReceiptData, currencySymbol: string = "₹"): Uint8Array {
    const builder = new ESCPOSBuilder();

    // Header
    builder
      .alignCenter()
      .doubleSize()
      .bold()
      .text(data.restaurantName)
      .newline()
      .normalSize()
      .bold(false);

    if (data.address) {
      builder.text(data.address).newline();
    }
    if (data.phone) {
      builder.text(`Tel: ${data.phone}`).newline();
    }

    builder
      .feed(1)
      .doubleLine()
      .alignLeft()
      .bold()
      .text("TAX INVOICE")
      .newline()
      .bold(false)
      .row("Invoice:", data.invoiceNumber)
      .row("Table:", data.tableNumber)
      .row("Date:", data.date.toLocaleDateString())
      .row("Time:", data.date.toLocaleTimeString());

    if (data.customerName) {
      builder.row("Customer:", data.customerName);
    }

    builder.line();

    // Items
    builder.bold().row("Item", "Amount").bold(false).line("-");

    data.items.forEach((item) => {
      builder.itemRow(item.name, item.quantity, item.price, item.total, currencySymbol);
    });

    builder.line();

    // Totals
    builder.row("Subtotal:", `${currencySymbol}${data.subtotal.toFixed(2)}`);

    if (data.serviceCharge > 0) {
      builder.row("Service Charge:", `${currencySymbol}${data.serviceCharge.toFixed(2)}`);
    }

    builder.row(`Tax (${data.taxRate}%):`, `${currencySymbol}${data.taxAmount.toFixed(2)}`);

    if (data.discount && data.discount > 0) {
      builder.row("Discount:", `-${currencySymbol}${data.discount.toFixed(2)}`);
    }

    builder
      .doubleLine()
      .bold()
      .doubleSize()
      .row("TOTAL:", `${currencySymbol}${data.total.toFixed(2)}`)
      .normalSize()
      .bold(false)
      .line()
      .row("Payment:", data.paymentMethod.toUpperCase());

    // Footer
    builder
      .feed(1)
      .alignCenter()
      .text(data.footerText || "Thank you for dining with us!")
      .newline()
      .text("Please visit again")
      .feed(3)
      .cut();

    return builder.build();
  }

  static buildKitchenOrder(
    orderNumber: string,
    tableNumber: string,
    items: { name: string; quantity: number; notes?: string }[],
    timestamp: Date
  ): Uint8Array {
    const builder = new ESCPOSBuilder();

    builder
      .alignCenter()
      .doubleSize()
      .bold()
      .text("** KITCHEN ORDER **")
      .newline()
      .normalSize()
      .bold(false)
      .feed(1)
      .alignLeft()
      .bold()
      .row("Order:", orderNumber)
      .row("Table:", tableNumber)
      .bold(false)
      .row("Time:", timestamp.toLocaleTimeString())
      .doubleLine();

    items.forEach((item) => {
      builder.bold().text(`${item.quantity}x ${item.name}`).bold(false).newline();
      if (item.notes) {
        builder.text(`   → ${item.notes}`).newline();
      }
    });

    builder.doubleLine().feed(2).cut();

    return builder.build();
  }
}

export default ESCPOSBuilder;
