import styles from "./ListingsFilter.module.scss";

type Props = {
  selectedRooms: string[];
  onToggle: (value: string) => void;
};

const ROOMS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4+" },
];

export function ListingRoomsFilter({ selectedRooms, onToggle }: Props) {
  return (
    <fieldset className={styles.fieldset}>
      <legend>Комнат</legend>

      <div className={styles.rooms}>
        {ROOMS.map((room) => (
          <label
            key={room.value}
            className={selectedRooms.includes(room.value) ? styles.roomActive : styles.room}
          >
            <input
              type="checkbox"
              checked={selectedRooms.includes(room.value)}
              onChange={() => onToggle(room.value)}
            />
            <span>{room.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
