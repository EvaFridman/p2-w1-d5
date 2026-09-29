"use client";

import { createContext, type ReactNode, useContext, useState, useEffect } from "react";
import { useStore } from "zustand";
import { createInitialAppStore, type AppStore } from "./app-store";

export const AppStoreContext = createContext<ReturnType<typeof createInitialAppStore> | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createInitialAppStore());

  useEffect(() => {
    store.persist.rehydrate();
  }, [store]);

  return <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>;
}

export function useAppStore<T>(selector: (store: AppStore) => T): T {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error("useAppStore должен использоваться внутри AppStoreProvider");
  return useStore(context, selector);
}
