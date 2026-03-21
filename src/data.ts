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

export const products: Product[] = [];

export const getProductsByCategory = (categoryId: string): Product[] => {
    return products.filter(p => p.category === categoryId);
};

export const getProductById = (id: number | string): Product | undefined | any => {
    return products.find(p => p.id === id || String(p.id) === String(id));
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
