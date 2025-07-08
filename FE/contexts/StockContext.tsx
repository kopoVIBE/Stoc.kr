"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Stock } from "@/api/stock";

interface StockContextType {
  stock: Stock | null;
  setStock: (stock: Stock | null) => void;
}

export const StockContext = createContext<StockContextType>({
  stock: null,
  setStock: () => {},
});

export function StockProvider({ children }: { children: ReactNode }) {
  const [stock, setStock] = useState<Stock | null>(null);

  return (
    <StockContext.Provider value={{ stock, setStock }}>
      {children}
    </StockContext.Provider>
  );
}

export const useStock = () => useContext(StockContext);
