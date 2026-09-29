import styles from "./ListingsFilter.module.scss";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function ListingDealTypeFilter({ value, onChange }: Props) {
  return (
    <fieldset className={styles.fieldset}>
      <legend>Тип сделки</legend>

      <div className={styles.dealTypes}>
        <button
          type="button"
          className={value === "sale" ? styles.dealActive : styles.dealButton}
          onClick={() => onChange("sale")}
        >
          Купить
        </button>
        <button
          type="button"
          className={value === "rent" ? styles.dealActive : styles.dealButton}
          onClick={() => onChange("rent")}
        >
          Снять
        </button>
      </div>
    </fieldset>
  );
}
