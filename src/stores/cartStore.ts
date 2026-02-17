import { create } from 'zustand';

export interface SelectedVariant {
  groupId: string;
  optionId: string;
  name: string;
  priceModifier: number;
}

export interface SelectedAddon {
  optionId: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  image_url?: string;
  selectedVariants?: Record<string, { optionId: string; name: string; priceModifier: number }>;
  selectedAddons?: SelectedAddon[];
  specialInstructions?: string;
  /** Unique key for items with different customizations */
  cartKey: string;
}

function makeCartKey(id: string, variants?: Record<string, any>, addons?: SelectedAddon[]): string {
  const vKey = variants ? Object.values(variants).map(v => v.optionId).sort().join(',') : '';
  const aKey = addons ? addons.map(a => a.optionId).sort().join(',') : '';
  return `${id}__${vKey}__${aKey}`;
}

interface CartStore {
  items: CartItem[];
  tableNumber: string;
  addItem: (item: Omit<CartItem, 'quantity' | 'cartKey'>) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  setTableNumber: (table: string) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  tableNumber: '',

  addItem: (item) => {
    const cartKey = makeCartKey(item.id, item.selectedVariants, item.selectedAddons);
    set((state) => {
      const existingItem = state.items.find((i) => i.cartKey === cartKey);
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1, cartKey }] };
    });
  },

  removeItem: (cartKey) => {
    set((state) => ({
      items: state.items.filter((i) => i.cartKey !== cartKey),
    }));
  },

  updateQuantity: (cartKey, quantity) => {
    set((state) => ({
      items: quantity <= 0
        ? state.items.filter((i) => i.cartKey !== cartKey)
        : state.items.map((i) => (i.cartKey === cartKey ? { ...i, quantity } : i)),
    }));
  },

  clearCart: () => set({ items: [] }),

  setTableNumber: (table) => set({ tableNumber: table }),

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce(
      (total, item) => {
        let itemPrice = item.price;
        // Add variant modifiers
        if (item.selectedVariants) {
          Object.values(item.selectedVariants).forEach(v => {
            itemPrice += v.priceModifier;
          });
        }
        // Add addon prices
        if (item.selectedAddons) {
          item.selectedAddons.forEach(a => {
            itemPrice += a.price;
          });
        }
        return total + itemPrice * item.quantity;
      },
      0
    );
  },
}));
