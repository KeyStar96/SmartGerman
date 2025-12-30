"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface MagnifierContextType {
  isMagnifierActive: boolean;
  toggleMagnifier: () => void;
}

const MagnifierContext = createContext<MagnifierContextType | undefined>(
  undefined
);

export function MagnifierProvider({ children }: { children: ReactNode }) {
  const [isMagnifierActive, setIsMagnifierActive] = useState(false);

  const toggleMagnifier = () => {
    setIsMagnifierActive((prev) => !prev);
  };

  return (
    <MagnifierContext.Provider value={{ isMagnifierActive, toggleMagnifier }}>
      {children}
    </MagnifierContext.Provider>
  );
}

export function useMagnifier() {
  const context = useContext(MagnifierContext);
  if (context === undefined) {
    throw new Error("useMagnifier must be used within a MagnifierProvider");
  }
  return context;
}

