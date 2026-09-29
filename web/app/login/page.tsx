import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/features/auth/login/LoginForm";
import { Loader } from "@/shared/ui";

import styles from "./page.module.css";

export const metadata: Metadata = { title: "Вход" };

type Props = {
  searchParams: Promise<{ returnUrl?: string }>;
};

async function LoginPageContent({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Вход</h1>
        <p className={styles.description}>Войдите, чтобы продолжить</p>
        <LoginForm returnUrl={params.returnUrl} />
      </div>
    </section>
  );
}

export default function LoginPage(props: Props) {
  return (
    <Suspense fallback={<Loader />}>
      <LoginPageContent {...props} />
    </Suspense>
  );
}
