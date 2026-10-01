"use server";

import { revalidatePath } from "next/cache";

import { viewingRequestSchema } from "@/entities/viewing/model/schema";
import { getSession } from "@/shared/session";
import { apiFetch } from "@/shared/api/api-fetch";
import { ApiError } from "@/shared/api/errors";
import { APP_UTC_OFFSET } from "@/shared/lib/format";

type ViewingRequestActionState = {
  fieldErrors?: Record<string, string[]>;
  error?: string;
  success?: boolean;
};

export async function createViewingRequest(
  listingId: number,
  _: ViewingRequestActionState,
  formData: FormData,
): Promise<ViewingRequestActionState> {
  const session = await getSession();
  const isClient = session?.user.role === "client";
  const isEditing = formData.get("editContact") === "true";

  const formValues = {
    name: isClient && !isEditing ? session.user.name : String(formData.get("name") ?? ""),
    phone: isClient && !isEditing ? session.user.phone : String(formData.get("phone") ?? ""),
    email: isClient && !isEditing ? session.user.email : String(formData.get("email") ?? ""),
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    comment: String(formData.get("comment") ?? ""),
  };

  const result = viewingRequestSchema.safeParse(formValues);

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};

    result.error.issues.forEach((issue) => {
      const field = issue.path[0];
      if (typeof field !== "string") return;
      fieldErrors[field] ??= [];
      fieldErrors[field].push(issue.message);
    });

    return { fieldErrors };
  }

  const { name, phone, email, date, time, comment } = result.data;

  try {
    await apiFetch(`/public/listings/${listingId}/viewings`, {
      method: "POST",
      body: {
        clientName: name,
        clientPhone: phone,
        clientEmail: email,
        preferredAt: `${date}T${time}:00${APP_UTC_OFFSET}`,
        comment: comment || undefined,
      },
    });

    revalidatePath(`/listings/${listingId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      return { error: "Вы отправили слишком много заявок. Попробуйте позже." };
    }

    return { error: "Не удалось отправить заявку. Попробуйте ещё раз." };
  }
}
