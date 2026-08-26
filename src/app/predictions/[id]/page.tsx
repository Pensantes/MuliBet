/** @format */

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PredictionDetail } from "@/components/predictions/PredictionDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: prediction } = await supabase
    .from("predictions")
    .select("title")
    .eq("id", id)
    .single();

  return {
    title: prediction ? `${prediction.title} — MuliBet` : "Previsão — MuliBet",
  };
}

export default async function PredictionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fecha previsões expiradas (lazy)
  if (user) {
    await supabase.rpc("close_expired_predictions");
  }

  // Busca a previsão com todos os dados relacionados
  const { data: predictionRaw, error } = await supabase
    .from("predictions")
    .select(
      `
    id,
    title,
    description,
    status,
    closes_at,
    resolved_at,
    creator_id,
    creator:profiles!predictions_creator_id_fkey(username, display_name, avatar_url),
    prediction_options!prediction_options_prediction_id_fkey(id, label),
    prediction_winning_options(option_id),
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
    creator: Array.isArray(predictionRaw.creator)
      ? predictionRaw.creator[0]
      : predictionRaw.creator,
  };

  // Busca aposta do usuário atual nessa previsão
  let userBet: { id: string; option_id: string; amount: number } | null = null;
  let balance = 0;

  if (user) {
    const { data: betData } = await supabase
      .from("bets")
      .select("id, option_id, amount")
      .eq("prediction_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    userBet = betData;

    const { data: balanceData } = await supabase.rpc("get_balance");
    balance = balanceData || 0;
  }

  return (
    <PredictionDetail
      prediction={prediction}
      userBet={userBet}
      currentUserId={user?.id || null}
      userBalance={balance}
    />
  );
}
