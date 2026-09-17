"use client";

import styles from "./VariantY.module.css";

export function VariantY() {
  return (
    <div className={styles.levelTwoGrid}>
      <div className={styles.levelTwoLeft}>left column</div>
      <div className={styles.levelTwoRight}>right column</div>
    </div>
  );
}
