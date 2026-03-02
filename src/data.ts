import { Product, Category } from './types';

export const categories: Category[] = [
    {
        id: 'students',
        name: 'Students',
        icon: '🎓',
        description: 'Campus essentials & study vibes',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80',
        productCount: 24,
    },
    {
        id: 'romantic',
        name: 'Romantic',
        icon: '💕',
        description: 'Express your love beautifully',
        image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=80',
        productCount: 18,
    },
    {
        id: 'friendship',
        name: 'Friendship',
        icon: '🤝',
        description: 'Celebrate your bond',
        image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80',
        productCount: 21,
    },
    {
        id: 'gifting',
        name: 'Gifting',
        icon: '🎁',
        description: 'Perfect gifts for every occasion',
        image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&q=80',
        productCount: 32,
    },
    {
        id: 'birthday',
        name: 'Birthday',
        icon: '🎂',
        description: 'Make birthdays unforgettable',
        image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&q=80',
        productCount: 15,
    },
    {
        id: 'special',
        name: 'Special Edition',
        icon: '⭐',
        description: 'Limited & exclusive drops',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80',
        productCount: 9,
    },
];

export const products: Product[] = [
    // Students
    {
        id: 1,
        name: 'Aesthetic Desk Organizer',
        price: 799,
        originalPrice: 1299,
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=80',
        category: 'students',
        rating: 4.5,
        reviews: 128,
        description: 'Minimalist wooden desk organizer with multiple compartments. Perfect for keeping your study space tidy and aesthetic.',
        badge: 'sale',
        inStock: true,
        colors: ['Natural', 'Walnut', 'Black'],
    },
    // Romantic
    {
        id: 5,
        name: 'Eternal Rose Crystal',
        price: 1899,
        originalPrice: 2999,
        image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500&q=80',
        category: 'romantic',
        rating: 4.9,
        reviews: 312,
        description: 'Handcrafted crystal rose that lasts forever. A timeless symbol of your eternal love.',
        badge: 'trending',
        inStock: true,
        colors: ['Red', 'Pink', 'Gold'],
    },
    // Friendship
    {
        id: 9,
        name: 'BFF Bracelet Set',
        price: 499,
        originalPrice: 799,
        image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=500&q=80',
        category: 'friendship',
        rating: 4.5,
        reviews: 203,
        description: 'Matching friendship bracelets with magnetic heart clasp. One for you, one for your bestie.',
        badge: 'trending',
        inStock: true,
        colors: ['Silver', 'Gold', 'Rose Gold'],
    },

    // Gifting
    {
        id: 12,
        name: 'Premium Gift Box - Luxury',
        price: 3499,
        originalPrice: 4999,
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238f7e1?w=500&q=80',
        category: 'gifting',
        rating: 4.9,
        reviews: 445,
        description: 'Curated luxury gift box with premium chocolates, scented candle, and personalized card.',
        badge: 'trending',
        inStock: true,
    },

    // Birthday
    {
        id: 16,
        name: 'Surprise Birthday Box',
        price: 2499,
        originalPrice: 3999,
        image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=500&q=80',
        category: 'birthday',
        rating: 4.8,
        reviews: 289,
        description: 'Pop-up surprise box with confetti, treats, and personalized message. The ultimate birthday surprise!',
        badge: 'trending',
        inStock: true,
    },

    // Special
    {
        id: 42,
        name: 'VibExpert Premium Hoodie',
        price: 999,
        originalPrice: 700,
        image: 'profile image.jpeg',
        category: 'special',
        rating: 4.9,
        reviews: 512,
        description: 'Limited edition VibExpert branded hoodie. Ultra-soft cotton blend with embroidered logo.',
        badge: 'trending',
        inStock: true,
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Black', 'Navy', 'Purple'],
    },
];

export const getProductsByCategory = (categoryId: string): Product[] => {
    return products.filter(p => p.category === categoryId);
};

export const getProductById = (id: number): Product | undefined => {
    return products.find(p => p.id === id);
};

export const searchProducts = (query: string): Product[] => {
    const q = query.toLowerCase();
    return products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
};



export const getDeals = (): Product[] => {
    return products.filter(p => p.badge === 'sale').sort((a, b) => {
        const discountA = ((a.originalPrice - a.price) / a.originalPrice) * 100;
        const discountB = ((b.originalPrice - b.price) / b.originalPrice) * 100;
        return discountB - discountA;
    });
};
