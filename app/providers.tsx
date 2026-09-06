"use client";

import { type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/src/store/store";

const store = makeStore();

export function Providers({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
