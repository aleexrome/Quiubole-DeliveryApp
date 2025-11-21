// Mock data for demo mode when backend is not available

export const DEMO_MODE = false; // Set to true for demo mode without backend

export const mockCategories = [
  { id: '1', name: 'Tacos', icon: 'taco', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200' },
  { id: '2', name: 'Pizza', icon: 'pizza', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200' },
  { id: '3', name: 'Hamburguesas', icon: 'hamburger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200' },
  { id: '4', name: 'Sushi', icon: 'fish', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200' },
  { id: '5', name: 'Postres', icon: 'cake', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200' },
  { id: '6', name: 'Bebidas', icon: 'glass-cocktail', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200' },
];

export const mockRestaurants = [
  {
    id: '1',
    name: 'Tacos El Paisa',
    description: 'Los mejores tacos de la ciudad con recetas tradicionales',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
    rating: 4.8,
    reviewCount: 234,
    deliveryTime: '20-30 min',
    deliveryFee: 25,
    minOrder: 100,
    categories: ['Tacos', 'Mexicana'],
    isOpen: true,
    address: 'Av. Insurgentes Sur 1234',
    phone: '55 1234 5678',
  },
  {
    id: '2',
    name: 'Pizza Napolitana',
    description: 'Pizza artesanal horneada en horno de lena',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    rating: 4.6,
    reviewCount: 189,
    deliveryTime: '25-35 min',
    deliveryFee: 30,
    minOrder: 150,
    categories: ['Pizza', 'Italiana'],
    isOpen: true,
    address: 'Calle Roma 567',
    phone: '55 8765 4321',
  },
  {
    id: '3',
    name: 'Burger Lab',
    description: 'Hamburguesas gourmet con ingredientes premium',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    rating: 4.7,
    reviewCount: 312,
    deliveryTime: '20-25 min',
    deliveryFee: 20,
    minOrder: 120,
    categories: ['Hamburguesas', 'Americana'],
    isOpen: true,
    address: 'Av. Reforma 890',
    phone: '55 2468 1357',
  },
  {
    id: '4',
    name: 'Sushi Master',
    description: 'Sushi fresco preparado por chefs japoneses',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
    rating: 4.9,
    reviewCount: 156,
    deliveryTime: '30-40 min',
    deliveryFee: 45,
    minOrder: 200,
    categories: ['Sushi', 'Japonesa'],
    isOpen: true,
    address: 'Calle Polanco 123',
    phone: '55 9876 5432',
  },
  {
    id: '5',
    name: 'Dulce Tentacion',
    description: 'Postres artesanales y pasteles deliciosos',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400',
    rating: 4.5,
    reviewCount: 98,
    deliveryTime: '25-35 min',
    deliveryFee: 35,
    minOrder: 80,
    categories: ['Postres', 'Cafeteria'],
    isOpen: false,
    address: 'Calle Condesa 456',
    phone: '55 1357 2468',
  },
];

export const mockProducts: Record<string, any[]> = {
  '1': [ // Tacos El Paisa
    { id: 'p1', name: 'Taco al Pastor', description: 'Carne de cerdo marinada con pina', price: 25, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200', category: 'Tacos' },
    { id: 'p2', name: 'Taco de Bistec', description: 'Carne de res a la plancha', price: 28, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200', category: 'Tacos' },
    { id: 'p3', name: 'Taco de Carnitas', description: 'Cerdo cocido en su propia grasa', price: 26, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200', category: 'Tacos' },
    { id: 'p4', name: 'Orden de Quesadillas', description: '3 quesadillas con queso oaxaca', price: 65, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200', category: 'Quesadillas' },
    { id: 'p5', name: 'Agua de Horchata', description: 'Bebida tradicional de arroz', price: 30, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200', category: 'Bebidas' },
  ],
  '2': [ // Pizza Napolitana
    { id: 'p6', name: 'Pizza Margherita', description: 'Tomate, mozzarella y albahaca', price: 180, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200', category: 'Pizzas' },
    { id: 'p7', name: 'Pizza Pepperoni', description: 'Con pepperoni y queso extra', price: 200, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200', category: 'Pizzas' },
    { id: 'p8', name: 'Pizza 4 Quesos', description: 'Mozzarella, gorgonzola, parmesano y fontina', price: 220, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200', category: 'Pizzas' },
    { id: 'p9', name: 'Pasta Carbonara', description: 'Pasta con salsa cremosa y tocino', price: 150, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200', category: 'Pastas' },
  ],
  '3': [ // Burger Lab
    { id: 'p10', name: 'Classic Burger', description: 'Carne de res, lechuga, tomate y cebolla', price: 120, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200', category: 'Hamburguesas' },
    { id: 'p11', name: 'Bacon Burger', description: 'Con tocino crujiente y queso cheddar', price: 145, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200', category: 'Hamburguesas' },
    { id: 'p12', name: 'BBQ Burger', description: 'Con salsa BBQ, aros de cebolla y jalapeño', price: 155, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200', category: 'Hamburguesas' },
    { id: 'p13', name: 'Papas Fritas', description: 'Porcion grande de papas crujientes', price: 55, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200', category: 'Complementos' },
  ],
  '4': [ // Sushi Master
    { id: 'p14', name: 'Roll California', description: '8 piezas con cangrejo y aguacate', price: 140, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200', category: 'Rolls' },
    { id: 'p15', name: 'Roll Philadelphia', description: '8 piezas con salmon y queso crema', price: 160, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200', category: 'Rolls' },
    { id: 'p16', name: 'Sashimi Mixto', description: '12 piezas de salmon, atun y robalo', price: 280, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200', category: 'Sashimi' },
  ],
  '5': [ // Dulce Tentacion
    { id: 'p17', name: 'Pastel de Chocolate', description: 'Pastel de chocolate con ganache', price: 85, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200', category: 'Pasteles' },
    { id: 'p18', name: 'Cheesecake', description: 'Cheesecake de frutos rojos', price: 90, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200', category: 'Pasteles' },
    { id: 'p19', name: 'Brownie', description: 'Brownie con nueces y helado', price: 65, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200', category: 'Postres' },
  ],
};

export const mockOrders = [
  {
    id: 'o1',
    orderNumber: 'QUI-001',
    restaurant: mockRestaurants[0],
    items: [
      { product: mockProducts['1'][0], quantity: 3 },
      { product: mockProducts['1'][4], quantity: 1 },
    ],
    subtotal: 105,
    deliveryFee: 25,
    total: 130,
    status: 'delivered',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'o2',
    orderNumber: 'QUI-002',
    restaurant: mockRestaurants[1],
    items: [
      { product: mockProducts['2'][0], quantity: 1 },
      { product: mockProducts['2'][1], quantity: 1 },
    ],
    subtotal: 380,
    deliveryFee: 30,
    total: 410,
    status: 'on_the_way',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const mockUser = {
  id: 'demo-user',
  firstName: 'Usuario',
  lastName: 'Demo',
  email: 'demo@quiubole.com',
  phone: '55 1234 5678',
  role: 'client',
};

export const mockAddresses = [
  {
    id: 'a1',
    street: 'Av. Insurgentes Sur',
    number: '1234',
    neighborhood: 'Del Valle',
    city: 'Ciudad de Mexico',
    zipCode: '03100',
    reference: 'Frente al parque',
    isDefault: true,
  },
  {
    id: 'a2',
    street: 'Calle Roma',
    number: '567',
    neighborhood: 'Roma Norte',
    city: 'Ciudad de Mexico',
    zipCode: '06700',
    reference: 'Edificio azul',
    isDefault: false,
  },
];
