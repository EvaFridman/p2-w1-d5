import type { Metadata } from "next";

export const metadata: Metadata = { title: "Справка" };

export default function HelpPage() {
  return (
    <>
      <h1>Помощь</h1>
      <p>Здесь будет информация о работе с сервисом.</p>
    </>
  );
}
