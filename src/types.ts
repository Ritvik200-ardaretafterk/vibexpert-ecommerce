export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  description: string;
  badge?: 'sale' | 'new' | 'trending';
  inStock: boolean;
  stockQuantity?: number;
  colors?: string[];
  sizes?: string[];
  deliveryDays?: number;
  deliveryNote?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  image: string;
  productCount: number;
}

export interface FilterState {
  category: string;
  priceRange: [number, number];
  rating: number;
  sortBy: 'popular' | 'newest' | 'price-low' | 'price-high' | 'rating' | 'category';
  searchQuery: string;
}
