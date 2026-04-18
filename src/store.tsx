import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { Product, CartItem } from './types';

// ─── State ───────────────────────────────────────────
interface StoreState {
    cart: CartItem[];
    wishlist: Product[];
    isCartOpen: boolean;
    toast: { message: string; type: 'success' | 'error' | 'info' } | null;
}

const initialState: StoreState = {
    cart: [],
    wishlist: [],
    isCartOpen: false,
    toast: null,
};

// ─── Actions ─────────────────────────────────────────
type Action =
    | { type: 'ADD_TO_CART'; product: Product; quantity?: number; color?: string; size?: string }
    | { type: 'REMOVE_FROM_CART'; productId: number }
    | { type: 'UPDATE_QUANTITY'; productId: number; quantity: number }
    | { type: 'CLEAR_CART' }
    | { type: 'TOGGLE_WISHLIST'; product: Product }
    | { type: 'SET_CART_OPEN'; open: boolean }
    | { type: 'SET_TOAST'; toast: StoreState['toast'] };

// ─── Reducer ─────────────────────────────────────────
function storeReducer(state: StoreState, action: Action): StoreState {
    switch (action.type) {
        case 'ADD_TO_CART': {
            const maxStock = action.product.stockQuantity != null ? action.product.stockQuantity : Infinity;
            const existing = state.cart.find(item => item.product.id === action.product.id);
            if (existing) {
                const newQty = Math.min(existing.quantity + (action.quantity || 1), maxStock);
                return {
                    ...state,
                    cart: state.cart.map(item =>
                        item.product.id === action.product.id
                            ? { ...item, quantity: newQty }
                            : item
                    ),
                };
            }
            const qty = Math.min(action.quantity || 1, maxStock);
            return {
                ...state,
                cart: [...state.cart, {
                    product: action.product,
                    quantity: qty,
                    selectedColor: action.color,
                    selectedSize: action.size,
                }],
            };
        }
        case 'REMOVE_FROM_CART':
            return {
                ...state,
                cart: state.cart.filter(item => item.product.id !== action.productId),
            };
        case 'UPDATE_QUANTITY': {
            if (action.quantity <= 0) {
                return {
                    ...state,
                    cart: state.cart.filter(item => item.product.id !== action.productId),
                };
            }
            const cartItem = state.cart.find(item => item.product.id === action.productId);
            const stockLimit = cartItem?.product.stockQuantity != null ? cartItem.product.stockQuantity : Infinity;
            const clampedQty = Math.min(action.quantity, stockLimit);
            return {
                ...state,
                cart: state.cart.map(item =>
                    item.product.id === action.productId
                        ? { ...item, quantity: clampedQty }
                        : item
                ),
            };
        }
        case 'CLEAR_CART':
            return { ...state, cart: [] };
        case 'TOGGLE_WISHLIST': {
            const exists = state.wishlist.find(p => p.id === action.product.id);
            return {
                ...state,
                wishlist: exists
                    ? state.wishlist.filter(p => p.id !== action.product.id)
                    : [...state.wishlist, action.product],
            };
        }
        case 'SET_CART_OPEN':
            return { ...state, isCartOpen: action.open };
        case 'SET_TOAST':
            return { ...state, toast: action.toast };
        default:
            return state;
    }
}

// ─── Context ─────────────────────────────────────────
interface StoreContextType {
    state: StoreState;
    addToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    toggleWishlist: (product: Product) => void;
    isInWishlist: (productId: number) => boolean;
    setCartOpen: (open: boolean) => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    cartTotal: number;
    cartCount: number;
    cartSavings: number;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(storeReducer, initialState);

    const addToCart = useCallback((product: Product, quantity = 1, color?: string, size?: string) => {
        const maxStock = product.stockQuantity != null ? product.stockQuantity : Infinity;
        if (maxStock <= 0) {
            dispatch({ type: 'SET_TOAST', toast: { message: `${product.name} is out of stock!`, type: 'error' } });
            setTimeout(() => dispatch({ type: 'SET_TOAST', toast: null }), 3000);
            return;
        }
        // Check if adding would exceed stock
        const existingItem = state.cart.find(item => item.product.id === product.id);
        const currentQty = existingItem ? existingItem.quantity : 0;
        if (currentQty >= maxStock) {
            dispatch({ type: 'SET_TOAST', toast: { message: `Cannot add more — only ${maxStock} in stock!`, type: 'error' } });
            setTimeout(() => dispatch({ type: 'SET_TOAST', toast: null }), 3000);
            return;
        }
        dispatch({ type: 'ADD_TO_CART', product, quantity, color, size });
        dispatch({ type: 'SET_TOAST', toast: { message: `${product.name} added to cart!`, type: 'success' } });
        setTimeout(() => dispatch({ type: 'SET_TOAST', toast: null }), 3000);
    }, [state.cart]);

    const removeFromCart = useCallback((productId: number) => {
        dispatch({ type: 'REMOVE_FROM_CART', productId });
    }, []);

    const updateQuantity = useCallback((productId: number, quantity: number) => {
        dispatch({ type: 'UPDATE_QUANTITY', productId, quantity });
    }, []);

    const clearCart = useCallback(() => {
        dispatch({ type: 'CLEAR_CART' });
    }, []);

    const toggleWishlist = useCallback((product: Product) => {
        dispatch({ type: 'TOGGLE_WISHLIST', product });
        const exists = state.wishlist.find(p => p.id === product.id);
        dispatch({
            type: 'SET_TOAST',
            toast: {
                message: exists ? `Removed from wishlist` : `${product.name} added to wishlist!`,
                type: exists ? 'info' : 'success',
            },
        });
        setTimeout(() => dispatch({ type: 'SET_TOAST', toast: null }), 3000);
    }, [state.wishlist]);

    const isInWishlist = useCallback((productId: number) => {
        return state.wishlist.some(p => p.id === productId);
    }, [state.wishlist]);

    const setCartOpen = useCallback((open: boolean) => {
        dispatch({ type: 'SET_CART_OPEN', open });
    }, []);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        dispatch({ type: 'SET_TOAST', toast: { message, type } });
        setTimeout(() => dispatch({ type: 'SET_TOAST', toast: null }), 3000);
    }, []);

    const cartTotal = state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartSavings = state.cart.reduce(
        (sum, item) => sum + (item.product.originalPrice - item.product.price) * item.quantity,
        0
    );

    return (
        <StoreContext.Provider
            value={{
                state,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                toggleWishlist,
                isInWishlist,
                setCartOpen,
                showToast,
                cartTotal,
                cartCount,
                cartSavings,
            }}
        >
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = (): StoreContextType => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};
