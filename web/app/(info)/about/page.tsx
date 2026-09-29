import type { Metadata } from "next";

export const metadata: Metadata = { title: "О сервисе" };

export default function AboutPage() {
  return (
    <>
      <h1>О сервисе</h1>
      <p>Информация о сервисе «Витрина недвижимости».</p>
    </>
  );
}
