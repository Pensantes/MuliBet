/** @format */

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResolvePredictionForm } from "@/components/predictions/ResolvePredictionForm";

export const metadata = {
  title: "Resolver previsão — MuliMarket",
};

export default async function ResolvePredictionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Busca a previsão
  const { data: predictionRaw, error } = await supabase
    .from("predictions")
    .select(
      `
      id,
      title,
      status,
      closes_at,
      creator_id,
      prediction_options!prediction_options_prediction_id_fkey(id, label),
      bets(id, user_id, option_id, amount)
    `,
    )
    .eq("id", id)
    .single();

  if (error || !predictionRaw) {
    notFound();
  }

  const prediction = {
    ...predictionRaw,
    prediction_options: predictionRaw.prediction_options || [],
    bets: predictionRaw.bets || [],
  };

  // Só o criador pode acessar
  if (prediction.creator_id !== user.id) {
    redirect(`/predictions/${id}`);
  }

  // Só pode resolver se CLOSED (ou OPEN expirada)
  const isExpired =
    prediction.status === "OPEN" &&
    new Date(prediction.closes_at) <= new Date();
  const canResolve = prediction.status === "CLOSED" || isExpired;

  if (!canResolve) {
    redirect(`/predictions/${id}`);
  }

  return (
    <ResolvePredictionForm
      predictionId={prediction.id}
      title={prediction.title}
      options={prediction.prediction_options}
      bets={prediction.bets}
    />
  );
}
