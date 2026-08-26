/** @format */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreatePredictionForm } from "@/components/predictions/CreatePredictionForm";

export const metadata = {
  title: "Criar previsão — MuliMarket",
};

export default async function NewPredictionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <CreatePredictionForm />;
}
