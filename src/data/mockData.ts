export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
  is_vegetarian: boolean;
  prep_time_minutes: number;
}

export interface Order {
  id: string;
  order_number: string;
  table_number: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  payment_mode?: string | null;
  created_at: string;
  prep_time_minutes?: number;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  name: string;
  special_notes?: string;
}

export interface Table {
  id: string;
  table_number: string;
  capacity: number;
  status: 'idle' | 'occupied' | 'ordering' | 'waiting';
}

export interface WaiterCall {
  id: string;
  table_number: string;
  reason: string;
  status: 'pending' | 'acknowledged' | 'resolved';
  created_at: string;
}

export const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Classic Burger',
    description: 'Juicy beef patty with fresh lettuce, tomato, and our special sauce',
    price: 249,
    category: 'Burgers',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    is_available: true,
    is_vegetarian: false,
    prep_time_minutes: 15,
  },
  {
    id: '2',
    name: 'Veggie Delight Burger',
    description: 'Crispy vegetable patty with fresh greens and tangy mayo',
    price: 199,
    category: 'Burgers',
    image_url: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400',
    is_available: true,
    is_vegetarian: true,
    prep_time_minutes: 12,
  },
  {
    id: '3',
    name: 'Margherita Pizza',
    description: 'Classic Italian pizza with fresh mozzarella and basil',
    price: 349,
    category: 'Pizza',
    image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400',
    is_available: true,
    is_vegetarian: true,
    prep_time_minutes: 20,
  },
  {
    id: '4',
    name: 'Pepperoni Pizza',
    description: 'Loaded with spicy pepperoni and melted cheese',
    price: 399,
    category: 'Pizza',
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
    is_available: true,
    is_vegetarian: false,
    prep_time_minutes: 20,
  },
  {
    id: '5',
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice with tender chicken and spices',
    price: 299,
    category: 'Main Course',
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
    is_available: true,
    is_vegetarian: false,
    prep_time_minutes: 25,
  },
  {
    id: '6',
    name: 'Paneer Butter Masala',
    description: 'Creamy tomato gravy with soft paneer cubes',
    price: 279,
    category: 'Main Course',
    image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400',
    is_available: true,
    is_vegetarian: true,
    prep_time_minutes: 18,
  },
  {
    id: '7',
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with parmesan and croutons',
    price: 179,
    category: 'Starters',
    image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    is_available: true,
    is_vegetarian: true,
    prep_time_minutes: 8,
  },
  {
    id: '8',
    name: 'Chicken Wings',
    description: 'Crispy fried wings with your choice of sauce',
    price: 249,
    category: 'Starters',
    image_url: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400',
    is_available: true,
    is_vegetarian: false,
    prep_time_minutes: 15,
  },
  {
    id: '9',
    name: 'Chocolate Brownie',
    description: 'Warm fudgy brownie with vanilla ice cream',
    price: 149,
    category: 'Desserts',
    image_url: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400',
    is_available: true,
    is_vegetarian: true,
    prep_time_minutes: 5,
  },
  {
    id: '10',
    name: 'Mango Lassi',
    description: 'Refreshing yogurt drink with fresh mangoes',
    price: 99,
    category: 'Beverages',
    image_url: 'https://images.unsplash.com/photo-1527685609591-44b0aef2400b?w=400',
    is_available: true,
    is_vegetarian: true,
    prep_time_minutes: 3,
  },
  {
    id: '11',
    name: 'Cold Coffee',
    description: 'Creamy iced coffee with a hint of chocolate',
    price: 129,
    category: 'Beverages',
    image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
    is_available: true,
    is_vegetarian: true,
    prep_time_minutes: 5,
  },
  {
    id: '12',
    name: 'French Fries',
    description: 'Crispy golden fries with seasoning',
    price: 99,
    category: 'Sides',
    image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
    is_available: true,
    is_vegetarian: true,
    prep_time_minutes: 8,
  },
];

export const mockOrders: Order[] = [
  {
    id: 'ORD001',
    order_number: 'ORD001',
    table_number: 'T1',
    status: 'pending',
    total_amount: 548,
    subtotal: 498,
    tax_amount: 25,
    service_charge: 25,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    prep_time_minutes: 20,
    items: [
      { id: '1', order_id: 'ORD001', menu_item_id: '1', quantity: 1, price: 249, name: 'Classic Burger' },
      { id: '2', order_id: 'ORD001', menu_item_id: '5', quantity: 1, price: 299, name: 'Chicken Biryani' },
    ],
  },
  {
    id: 'ORD002',
    order_number: 'ORD002',
    table_number: 'T3',
    status: 'preparing',
    total_amount: 727,
    subtotal: 660,
    tax_amount: 33,
    service_charge: 34,
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
    prep_time_minutes: 15,
    items: [
      { id: '3', order_id: 'ORD002', menu_item_id: '3', quantity: 1, price: 349, name: 'Margherita Pizza' },
      { id: '4', order_id: 'ORD002', menu_item_id: '6', quantity: 1, price: 279, name: 'Paneer Butter Masala' },
      { id: '5', order_id: 'ORD002', menu_item_id: '12', quantity: 1, price: 99, name: 'French Fries' },
    ],
  },
  {
    id: 'ORD003',
    order_number: 'ORD003',
    table_number: 'T5',
    status: 'ready',
    total_amount: 438,
    subtotal: 399,
    tax_amount: 20,
    service_charge: 19,
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    items: [
      { id: '6', order_id: 'ORD003', menu_item_id: '4', quantity: 1, price: 399, name: 'Pepperoni Pizza' },
    ],
  },
];

export const mockTables: Table[] = [
  { id: '1', table_number: 'T1', capacity: 4, status: 'occupied' },
  { id: '2', table_number: 'T2', capacity: 2, status: 'idle' },
  { id: '3', table_number: 'T3', capacity: 6, status: 'ordering' },
  { id: '4', table_number: 'T4', capacity: 4, status: 'idle' },
  { id: '5', table_number: 'T5', capacity: 2, status: 'waiting' },
  { id: '6', table_number: 'T6', capacity: 8, status: 'idle' },
  { id: '7', table_number: 'T7', capacity: 4, status: 'occupied' },
  { id: '8', table_number: 'T8', capacity: 2, status: 'idle' },
];

export const mockWaiterCalls: WaiterCall[] = [
  {
    id: '1',
    table_number: 'T1',
    reason: 'Need assistance',
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: '2',
    table_number: 'T5',
    reason: 'Request bill',
    status: 'pending',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
  },
];

export const categories = ['All', 'Starters', 'Burgers', 'Pizza', 'Main Course', 'Sides', 'Desserts', 'Beverages'];

export const systemSettings = {
  restaurant_name: 'ZAPPY',
  currency_symbol: '₹',
  tax_rate: 5,
  service_charge: 10,
};
