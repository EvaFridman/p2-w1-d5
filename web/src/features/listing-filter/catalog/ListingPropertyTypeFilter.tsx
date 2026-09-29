import styles from "./ListingsFilter.module.scss";

type Props = {
    value: string;
    onChange: (value: string) => void;
};

const PROPERTY_TYPES = [
    { value: "flat", label: "Квартира" },
    { value: "house", label: "Дом" },
    { value: "room", label: "Комната" },
    { value: "commercial", label: "Коммерческая" },
];

export function ListingPropertyTypeFilter({ value, onChange }: Props) {
    return (
        <fieldset className={styles.fieldset}>
            <legend>Тип недвижимости</legend>

            <div className={styles.options}>
                {PROPERTY_TYPES.map((type) => (
                    <label key={type.value} className={styles.option}>
                        <input type="radio" name="propertyType" value={type.value} checked={value === type.value} onChange={(event) => onChange(event.target.value)} />
                        <span>{type.label}</span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}