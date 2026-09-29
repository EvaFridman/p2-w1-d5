import styles from "./DealSteps.module.css";

const steps = [
  {
    number: "1",
    title: "Выбираете вариант",
    description: "Отбор по району, цене, площади и числу комнат. Понравившиеся — в избранное.",
  },
  {
    number: "2",
    title: "Записываетесь на просмотр",
    description: "Оставляете имя, телефон и удобное время. Агент подтверждает заявку.",
  },
  {
    number: "3",
    title: "Смотрите и решаете",
    description: "Статус заявки виден в кабинете, контакты агента — там же.",
  },
];

export function DealSteps() {
  return (
    <section className={styles.list}>
      {steps.map((step) => (
        <article key={step.number} className={styles.item}>
          <span className={styles.number}>{step.number}</span>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
        </article>
      ))}
    </section>
  );
}
