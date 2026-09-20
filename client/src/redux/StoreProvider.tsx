'use client'
import React, { useEffect } from 'react'
import { Provider, useDispatch } from 'react-redux'
import { store } from './store'
import { setCart } from './cartSlice'

function CartSync() {
  const dispatch = useDispatch()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('snapcart_cart')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            dispatch(setCart(parsed))
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [dispatch])

  return null
}

function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <CartSync />
      {children}
    </Provider>
  )
}

export default StoreProvider
