"use client";

import dynamic from "next/dynamic";

const WidgetX = dynamic(() => import("./WidgetX").then((mod) => mod.WidgetX));

export function Resolver() {
  return <WidgetX />;
}
