"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { makeStore, startPersist } from "./store";

export default function StoreProvider({ children }) {
  // Lazy-initialized once per mount; makeStore() is itself a guarded module
  // singleton, so server and client always share the same instance.
  const [store] = useState(makeStore);

  // Start persistence after mount (never during render) so redux-persist
  // rehydration can't race React's hydration: no mismatch warnings, and the
  // app renders immediately with default state instead of waiting on storage.
  useEffect(() => {
    startPersist(store);
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
