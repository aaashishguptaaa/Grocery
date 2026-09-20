import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface IGrocery {
    _id: string,
    name: string,
    category: string,
    price: string,
    mrp?: string,
    description?: string,
    inStock?: boolean,
    unit: string,
    quantity: number,
    image: string,
    images?: string[],
    createdAt?: Date,
    updatedAt?: Date
}

interface ICartSlice {
    cartData: IGrocery[],
    subTotal: number,
    deliveryFee: number,
    finalTotal: number
}

const initialState: ICartSlice = {
    cartData: [],
    subTotal: 0,
    deliveryFee: 0,
    finalTotal: 0
}

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addToCart: (state, action: PayloadAction<IGrocery>) => {
            const existing = state.cartData.find(i => i._id?.toString() === action.payload._id?.toString())
            if (existing) {
                existing.quantity = (Number(existing.quantity) || 1) + (Number(action.payload.quantity) || 1)
            } else {
                state.cartData.push({
                    ...action.payload,
                    quantity: Number(action.payload.quantity) || 1
                })
            }
            cartSlice.caseReducers.calculateTotals(state)
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('snapcart_cart', JSON.stringify(state.cartData))
                } catch (e) {
                    console.error(e)
                }
            }
        },
        increaseQuantity: (state, action: PayloadAction<string>) => {
            const item = state.cartData.find(i => i._id?.toString() === action.payload?.toString())
            if (item) {
                item.quantity = (Number(item.quantity) || 1) + 1
            }
            cartSlice.caseReducers.calculateTotals(state)
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('snapcart_cart', JSON.stringify(state.cartData))
                } catch (e) {
                    console.error(e)
                }
            }
        },
        decreaseQuantity: (state, action: PayloadAction<string>) => {
            const item = state.cartData.find(i => i._id?.toString() === action.payload?.toString())
            if (item && item.quantity > 1) {
                item.quantity = item.quantity - 1
            } else {
                state.cartData = state.cartData.filter(i => i._id?.toString() !== action.payload?.toString())
            }
            cartSlice.caseReducers.calculateTotals(state)
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('snapcart_cart', JSON.stringify(state.cartData))
                } catch (e) {
                    console.error(e)
                }
            }
        },
        removeFromCart: (state, action: PayloadAction<string>) => {
            state.cartData = state.cartData.filter(i => i._id?.toString() !== action.payload?.toString())
            cartSlice.caseReducers.calculateTotals(state)
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('snapcart_cart', JSON.stringify(state.cartData))
                } catch (e) {
                    console.error(e)
                }
            }
        },
        clearCart: (state) => {
            state.cartData = []
            state.subTotal = 0
            state.deliveryFee = 0
            state.finalTotal = 0
            if (typeof window !== 'undefined') {
                try {
                    localStorage.removeItem('snapcart_cart')
                    localStorage.removeItem('cart')
                } catch (e) {
                    console.error(e)
                }
            }
        },
        setCart: (state, action: PayloadAction<IGrocery[]>) => {
            state.cartData = action.payload || []
            cartSlice.caseReducers.calculateTotals(state)
        },
        calculateTotals: (state) => {
            state.subTotal = state.cartData.reduce((sum, item) => sum + Number(item.price) * (Number(item.quantity) || 1), 0)
            state.deliveryFee = state.cartData.length === 0 ? 0 : (state.subTotal > 100 ? 0 : 40)
            state.finalTotal = state.subTotal + state.deliveryFee
        }
    }
})

export const { addToCart, increaseQuantity, decreaseQuantity, removeFromCart, clearCart, setCart } = cartSlice.actions
export default cartSlice.reducer
