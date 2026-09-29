"use client";

import { FormEvent, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import styles from "./ListingsFilter.module.scss";

import { ListingAreaRangeFilter } from "./ListingAreaRangeFilter";
import { ListingDealTypeFilter } from "./ListingDealTypeFilter";
import { ListingDistrictFilter } from "./ListingDistrictFilter";
import { ListingPriceRangeFilter } from "./ListingPriceRangeFilter";
import { ListingPropertyTypeFilter } from "./ListingPropertyTypeFilter";
import { ListingRoomsFilter } from "./ListingRoomsFilter";
import { ListingSearchFilter } from "./ListingSearchFilter";

type District = {
    id: number;
    title: string;
    city: string;
    publishedListingsCount: number;
};

type Props = {
    districts: District[];
    lockedDistrictId?: number;
};

export function ListingFilterPanel({ districts, lockedDistrictId }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [dealType, setDealType] = useState(searchParams.get("dealType") ?? "sale");
    const [propertyType, setPropertyType] = useState(searchParams.get("propertyType") ?? "");
    const [districtId, setDistrictId] = useState(lockedDistrictId ? String(lockedDistrictId) : searchParams.get("districtId") ?? "");
    const [selectedRooms, setSelectedRooms] = useState(searchParams.getAll("rooms"));
    const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") ?? "");
    const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "");
    const [areaMin, setAreaMin] = useState(searchParams.get("areaMin") ?? "");
    const [areaMax, setAreaMax] = useState(searchParams.get("areaMax") ?? "");
    const [search, setSearch] = useState(searchParams.get("search") ?? "");
    const [districtSearch, setDistrictSearch] = useState("");

    function toggleRoom(value: string) {
        setSelectedRooms((current) => current.includes(value) ? current.filter((room) => room !== value) : [...current, value]);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const params = new URLSearchParams(searchParams.toString());

        params.delete("dealType");
        params.delete("propertyType");
        if (lockedDistrictId === undefined) params.delete("districtId");
        params.delete("rooms");
        params.delete("priceMin");
        params.delete("priceMax");
        params.delete("areaMin");
        params.delete("areaMax");
        params.delete("search");

        if (dealType) params.set("dealType", dealType);
        if (propertyType) params.set("propertyType", propertyType);
        if (districtId) params.set("districtId", districtId);
        if (priceMin) params.set("priceMin", priceMin);
        if (priceMax) params.set("priceMax", priceMax);
        if (areaMin) params.set("areaMin", areaMin);
        if (areaMax) params.set("areaMax", areaMax);
        if (search.trim()) params.set("search", search.trim());

        selectedRooms.forEach((room) => { params.append("rooms", room) });

        params.set("page", "1");

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }

    function resetFilters() {
        setDealType("sale");
        setPropertyType("");
        setDistrictId(lockedDistrictId !== undefined ? String(lockedDistrictId) : "");
        setSelectedRooms([]);
        setPriceMin("");
        setPriceMax("");
        setAreaMin("");
        setAreaMax("");
        setSearch("");
        setDistrictSearch("");

        const params = new URLSearchParams(searchParams.toString());

        [
            "dealType",
            "propertyType",
            "rooms",
            "priceMin",
            "priceMax",
            "areaMin",
            "areaMax",
            "search",
        ].forEach((name) => params.delete(name));

        if (lockedDistrictId === undefined) params.delete("districtId");
        else params.set("districtId", String(lockedDistrictId));

        params.set("page", "1");

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }

    return (
        <form className={styles.panel} onSubmit={handleSubmit}>
            <div className={styles.header}>
                <h2>Фильтры</h2>
                <button type="button" className={styles.reset} onClick={resetFilters}>Сбросить</button>
            </div>

            <ListingDealTypeFilter value={dealType} onChange={setDealType} />
            <ListingPropertyTypeFilter value={propertyType} onChange={setPropertyType} />
            <ListingDistrictFilter districts={districts} value={districtId} search={districtSearch} lockedDistrictId={lockedDistrictId} onChange={setDistrictId} onSearchChange={setDistrictSearch} />
            <ListingPriceRangeFilter min={priceMin} max={priceMax} onMinChange={setPriceMin} onMaxChange={setPriceMax} />
            <ListingAreaRangeFilter min={areaMin} max={areaMax} onMinChange={setAreaMin} onMaxChange={setAreaMax} />
            <ListingRoomsFilter selectedRooms={selectedRooms} onToggle={toggleRoom} />
            <ListingSearchFilter value={search} onChange={setSearch} />

            <button type="submit" className={styles.submit}>Показать объявления</button>
        </form>
    );
}