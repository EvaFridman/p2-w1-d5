import Shdr19 from "./shdr-19";

import styles from "./Loader.module.css";

type Props = {
  size?: number;
};

export function Loader({ size = 64 }: Props) {
  return (
    <div className={styles.loader} role="status" aria-label="Загрузка">
      <Shdr19 size={size} state="thinking" />
    </div>
  );
}
