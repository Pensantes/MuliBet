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
    title: prediction
      ? `${prediction.title} — MuliMarket`
      : "Previsão — MuliMarket",
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

  // 1. Fecha previsões expiradas automaticamente (lazy evaluation)
  if (user) {
    await supabase.rpc("close_expired_predictions");
  }

  // 2. Query otimizada: sem join de perfis em bets, apenas dados agregados necessários
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
      bets(
        id,
        user_id,
        option_id,
        amount
      )
    `,
    )
    .eq("id", id)
    .single();

  // 3. Se não existir ou der erro, mostra 404
  if (error || !predictionRaw) {
    notFound();
  }

  // console.log(predictionRaw);

  // 4. Normaliza os dados (Supabase retorna relações como array)
  const prediction = {
    ...predictionRaw,
    creator: Array.isArray(predictionRaw.creator)
      ? predictionRaw.creator[0]
      : predictionRaw.creator || {
          username: "unknown",
          display_name: null,
          avatar_url: null,
        },
    prediction_options: predictionRaw.prediction_options || [],
    prediction_winning_options: predictionRaw.prediction_winning_options || [],
    bets: predictionRaw.bets || [],
  };

  // 5. Busca dados específicos do usuário logado (se houver)
  let userBet: { id: string; option_id: string; amount: number } | null = null;
  let balance = 0;

  if (user) {
    // Busca se o usuário já apostou nesta previsão específica
    const { data: betData } = await supabase
      .from("bets")
      .select("id, option_id, amount")
      .eq("prediction_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    userBet = betData;

    // Busca o saldo atual do usuário
    const { data: balanceData } = await supabase.rpc("get_balance");
    balance = balanceData || 0;
  }

  // 6. Renderiza o componente cliente com os dados prontos
  return (
    <PredictionDetail
      prediction={prediction}
      userBet={userBet}
      currentUserId={user?.id || null}
      userBalance={balance}
    />
  );
}
