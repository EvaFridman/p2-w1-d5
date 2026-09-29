import { z } from "zod";

export const viewingRequestSchema = z.object({
  name: z.string().trim().min(2, "Введите имя"),
  phone: z.string().trim().min(5, "Введите телефон"),
  email: z.string().trim().email("Введите корректный email"),
  date: z.string().min(1, "Выберите дату"),
  time: z.string().min(1, "Выберите время"),
  comment: z.string().trim().optional(),
});

export type ViewingRequestFormData = z.infer<typeof viewingRequestSchema>;
