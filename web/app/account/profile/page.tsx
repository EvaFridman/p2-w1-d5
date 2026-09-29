import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getSession } from "@/shared/session";
import { Loader } from "@/shared/ui";
import { ChangePasswordForm } from "@/features/profile/ChangePasswordForm";

import styles from "./page.module.css";

async function AccountProfileContent() {
  const session = await getSession();

  if (!session) redirect("/login?returnUrl=/account/profile");

  return (
    <div className={styles.profile}>
      <div className={styles.field}>
        <span className={styles.label}>Имя</span>
        <p>{session.user.name}</p>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Телефон</span>
        <p>{session.user.phone || "Не указан"}</p>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Почта</span>
        <p>{session.user.email}</p>
      </div>

      <ChangePasswordForm />
    </div>
  );
}

export default function AccountProfilePage() {
  return (
    <Suspense fallback={<Loader />}>
      <AccountProfileContent />
    </Suspense>
  );
}
