import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Currency = 'USD' | 'SAR'

// الريال السعودي مربوط بالدولار بسعر ثابت منذ 1986 (لا يحتاج تحديثًا حيًا).
const SAR_RATE = 3.75

type CurrencyCtx = {
  currency: Currency
  toggle: () => void
  formatMoney: (amount: number, digits?: number) => string
}

const CurrencyContext = createContext<CurrencyCtx>({
  currency: 'USD',
  toggle: () => {},
  formatMoney: (n, digits = 2) => `$${n.toFixed(digits)}`,
})

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem('currency')
      return saved === 'SAR' ? 'SAR' : 'USD'
    } catch {
      return 'USD'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('currency', currency)
    } catch {
      // تجاهل: بعض المتصفحات تمنع localStorage في أوضاع معينة
    }
  }, [currency])

  function toggle() {
    setCurrency((c) => (c === 'USD' ? 'SAR' : 'USD'))
  }

  function formatMoney(amount: number, digits = 2) {
    const value = currency === 'SAR' ? amount * SAR_RATE : amount
    const formatted = value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })
    return currency === 'SAR' ? `${formatted} ر.س` : `$${formatted}`
  }

  return (
    <CurrencyContext.Provider value={{ currency, toggle, formatMoney }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
