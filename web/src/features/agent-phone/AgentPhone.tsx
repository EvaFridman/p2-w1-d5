"use client";

import { useState } from "react";

import { http } from "@/shared/api/http";

type Props = {
  agentId: number;
};

export function AgentPhone({ agentId }: Props) {
  const [phone, setPhone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);

    try {
      const { data } = await http.get<{ phone: string | null }>(`/agents/${agentId}/phone`);
      setPhone(data.phone);
    } finally {
      setIsLoading(false);
    }
  }

  if (phone) return <a href={`tel:${phone}`}>{phone}</a>;

  return (
    <button type="button" onClick={handleClick} disabled={isLoading}>
      {isLoading ? "Загрузка..." : "Показать телефон"}
    </button>
  );
}
