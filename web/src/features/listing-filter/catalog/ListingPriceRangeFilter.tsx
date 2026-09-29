import styles from "./ListingsFilter.module.scss";

type Props = {
    min: string;
    max: string;
    onMinChange: (value: string) => void;
    onMaxChange: (value: string) => void;
};

export function ListingPriceRangeFilter({ min, max, onMinChange, onMaxChange }: Props) {
    return (
        <fieldset className={styles.fieldset}>
            <legend>Цена, ₽</legend>

            <fieldset className={styles.range}>
                <input
                    type="number"
                    min="0"
                    placeholder="От"
                    value={min}
                    onChange={(event) => onMinChange(event.target.value)}
                />
                <input
                    type="number"
                    min="0"
                    placeholder="До"
                    value={max}
                    onChange={(event) => onMaxChange(event.target.value)}
                />
            </fieldset>
        </fieldset>
    );
}