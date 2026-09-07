import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      // User state
      user: null,
      token: null,
      isAuthenticated: false,
      isProfileComplete: false,
      
      // Current vibe for dynamic theming
      currentVibe: 'Party',
      
      // Style profile
      styleProfile: {
        isComplete: false,
        undertone: '',
        preferredSilhouette: [],
        favoriteVibes: [],
        seasonalPreference: [],
        jewelryTone: '',
      },
      
      // Cart
      cart: [],
      
      // Favorites/Wishlist
      favorites: [],
      
      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: true,
        isProfileComplete: user?.isProfileComplete || user?.personalProfile?.isComplete || false
      }),
      setToken: (token) => set({ token }),
      setProfileComplete: (val) => set({ isProfileComplete: val }),
      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        isProfileComplete: false 
      }),
      
      setCurrentVibe: (vibe) => set({ currentVibe: vibe }),
      
      setStyleProfile: (profile) => set({ styleProfile: profile }),
      
      addToCart: (item) => set((state) => {
        const existingItem = state.cart.find(
          (i) => i.id === item.id && i.size === item.size && i.color === item.color
        );
        
        if (existingItem) {
          return {
            cart: state.cart.map((i) =>
              i.id === item.id && i.size === item.size && i.color === item.color
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          };
        }
        
        return { cart: [...state.cart, { ...item, quantity: 1 }] };
      }),
      
      removeFromCart: (id, size, color) => set((state) => ({
        cart: state.cart.filter(
          (item) => !(item.id === id && item.size === size && item.color === color)
        ),
      })),
      
      updateCartQuantity: (id, size, color, quantity) => set((state) => ({
        cart: state.cart.map((item) =>
          item.id === id && item.size === size && item.color === color
            ? { ...item, quantity }
            : item
        ),
      })),
      
      clearCart: () => set({ cart: [] }),
      
      // Favorites actions
      setFavorites: (favorites) => set({ favorites }),
      
      addToFavorites: (productId) => set((state) => ({
        favorites: [...state.favorites, productId]
      })),
      
      removeFromFavorites: (productId) => set((state) => ({
        favorites: state.favorites.filter(id => id !== productId)
      })),
      
      toggleFavorite: (productId) => set((state) => {
        const isFavorite = state.favorites.includes(productId);
        if (isFavorite) {
          return { favorites: state.favorites.filter(id => id !== productId) };
        } else {
          return { favorites: [...state.favorites, productId] };
        }
      }),
    }),
    {
      name: 'vibe-match-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isProfileComplete: state.isProfileComplete,
        styleProfile: state.styleProfile,
        currentVibe: state.currentVibe,
        cart: state.cart,
        favorites: state.favorites,
      }),
    }
  )
);

export default useStore;
