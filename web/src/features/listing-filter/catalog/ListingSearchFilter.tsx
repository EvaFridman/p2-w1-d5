import styles from "./ListingsFilter.module.scss";

type Props = {
    value: string;
    onChange: (value: string) => void;
};

export function ListingSearchFilter({ value, onChange }: Props) {
    return (
        <fieldset className={styles.fieldset}>
            <legend>Название или адрес</legend>

            <input
                type="search"
                className={styles.searchInput}
                placeholder="Название или адрес"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </fieldset>
    );
}