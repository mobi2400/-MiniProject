"use server";

import { redirect } from "next/navigation";
import { deletePreparation } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";

export async function confirmDeletion(id: string, form: FormData) {
  const account = await requireAccount();
  if (form.get("confirm") !== "yes") redirect(`/preparations/${id}/delete?confirm=required`);
  deletePreparation(account, id);
  redirect("/dashboard");
}
