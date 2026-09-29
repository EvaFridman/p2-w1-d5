import { AccountTabs } from "@/_pages/account/AccountTabs";

import styles from "./layout.module.css";

type Props = {
  children: React.ReactNode;
};

export default function AccountLayout({ children }: Props) {
  return (
    <section className={`container ${styles.page}`}>
      <h1>Личный кабинет</h1>

      <div className={styles.layout}>
        <AccountTabs />

        <div className={styles.content}>{children}</div>
      </div>
    </section>
  );
}
