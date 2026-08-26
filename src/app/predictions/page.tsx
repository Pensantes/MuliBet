/** @format */

import { createClient } from "@/lib/supabase/server";
import { PredictionsList } from "@/components/predictions/PredictionsList";

export const metadata = {
  title: "Previsões — MuliBet",
};

export const dynamic = "force-dynamic"; // Garante que roda sempre, sem cache

export default async function PredictionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fecha previsões expiradas automaticamente (lazy)
  if (user) {
    await supabase.rpc("close_expired_predictions");
  }

  // Busca previsões com joins explícitos
  const { data: predictionsRaw, error } = await supabase
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
      bets(id, user_id, option_id, amount)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar previsões:", error);
  }

  const predictions = (predictionsRaw || []).map((p) => ({
    ...p,
    creator: Array.isArray(p.creator) ? p.creator[0] : p.creator,
  }));

  // Busca apostas do usuário atual
  let userBets: { prediction_id: string; option_id: string; amount: number }[] =
    [];
  if (user) {
    const { data } = await supabase
      .from("bets")
      .select("prediction_id, option_id, amount")
      .eq("user_id", user.id);
    userBets = data || [];
  }

  return (
    <PredictionsList
      predictions={predictions}
      userBets={userBets}
      currentUserId={user?.id || null}
    />
  );
}
