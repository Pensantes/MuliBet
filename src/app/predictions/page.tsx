/** @format */

import { createClient } from "@/lib/supabase/server";
import { PredictionsList } from "@/components/predictions/PredictionsList";

export const metadata = {
  title: "Previsões — MuliBet",
};

export const dynamic = "force-dynamic";

// 1. Define o tipo exato do que o Supabase retorna antes da normalização
interface RawPredictionRow {
  id: string;
  title: string;
  description: string | null;
  status: "OPEN" | "CLOSED" | "RESOLVED";
  created_at: string;
  closes_at: string;
  resolved_at: string | null;
  creator_id: string;
  creator:
    | {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
      }[]
    | {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
      }
    | null;
  prediction_options: { id: string; label: string }[] | null;
  bets:
    | { id: string; user_id: string; option_id: string; amount: number }[]
    | null;
}

export default async function PredictionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.rpc("close_expired_predictions");
  }

  const { data: predictionsRaw, error } = await supabase.from("predictions")
    .select(`
      id,
      title,
      description,
      status,
      created_at,
      closes_at,
      resolved_at,
      creator_id,
      creator:profiles!predictions_creator_id_fkey(username, display_name, avatar_url),
      prediction_options!prediction_options_prediction_id_fkey(id, label),
      bets(id, user_id, option_id, amount)
    `);

  if (error) {
    console.error("Erro ao buscar previsões:", error);
  }

  // 2. Normaliza os dados com tipagem segura (sem 'any' e sem spread '...')
  const predictions = ((predictionsRaw || []) as RawPredictionRow[]).map(
    (p) => {
      const safeCreator = Array.isArray(p.creator)
        ? (p.creator[0] ?? {
            username: "unknown",
            display_name: null,
            avatar_url: null,
          })
        : (p.creator ?? {
            username: "unknown",
            display_name: null,
            avatar_url: null,
          });

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        created_at: p.created_at,
        closes_at: p.closes_at,
        resolved_at: p.resolved_at,
        creator_id: p.creator_id,
        creator: safeCreator,
        prediction_options: p.prediction_options ?? [],
        bets: p.bets ?? [],
      };
    },
  );

  // 3. Busca apostas do usuário atual
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
