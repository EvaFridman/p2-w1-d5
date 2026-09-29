import styles from "./layout.module.css";

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return <section className={`container ${styles.page}`}>{children}</section>;
}
