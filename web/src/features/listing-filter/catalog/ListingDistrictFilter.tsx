import styles from "./ListingsFilter.module.scss";

type District = {
    id: number;
    title: string;
    city: string;
    publishedListingsCount: number;
};

type Props = {
    districts: District[];
    value: string;
    search: string;
    lockedDistrictId?: number;
    onChange: (value: string) => void;
    onSearchChange: (value: string) => void;
};

export function ListingDistrictFilter({
    districts,
    value,
    search,
    lockedDistrictId,
    onChange,
    onSearchChange,
}: Props) {
    const filteredDistricts = districts.filter((district) => district.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <fieldset className={styles.fieldset}>
            <legend>Район</legend>

            <input
                type="search"
                className={styles.searchInput}
                placeholder="Поиск района"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
            />

            <section className={styles.districts}>
                {filteredDistricts.map((district) => (
                    <label key={district.id} className={styles.district}>
                        <input
                            type="radio"
                            name="district"
                            value={district.id}
                            checked={value === String(district.id)}
                            disabled={lockedDistrictId !== undefined}
                            onChange={(event) => onChange(event.target.value)}
                        />
                        <span className={styles.districtTitle}>{district.title}</span>
                        <span className={styles.districtCount}>{district.publishedListingsCount}</span>
                    </label>
                ))}
            </section>
        </fieldset>
    );
}