import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/register/RegisterForm";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Регистрация</h1>
        <p className={styles.description}>Создайте аккаунт, чтобы продолжить</p>
        <RegisterForm />
      </div>
    </section>
  );
}
