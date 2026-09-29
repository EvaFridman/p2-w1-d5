import type { InputHTMLAttributes } from "react";
import styles from "./Input.module.css";

export type Props = InputHTMLAttributes<HTMLInputElement> & { error?: boolean };

export function Input({ error = false, className = "", ...props }: Props) {
  return (
    <input className={`${styles.input} ${error ? styles.error : ""} ${className}`} {...props} />
  );
}
