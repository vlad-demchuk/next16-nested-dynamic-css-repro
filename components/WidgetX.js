"use client";

import dynamic from "next/dynamic";

import styles from "./WidgetX.module.css";

const VariantY = dynamic(() => import("./VariantY").then((mod) => mod.VariantY));

export function WidgetX() {
  return (
    <section className={styles.levelOneWidget}>
      <VariantY />
    </section>
  );
}
