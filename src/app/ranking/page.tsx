/** @format */

import { createClient } from "@/lib/supabase/server";
import { RankingList } from "@/components/ranking/RankingList";

export const metadata = {
  title: "Ranking — MuliMarket",
};

export const dynamic = "force-dynamic"; // Ranking sempre fresco

export default async function RankingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Busca o ranking completo
  const { data: leaderboard, error } = await supabase.rpc("get_leaderboard");

  if (error) {
    console.error("Erro ao buscar ranking:", error);
  }

  return (
    <RankingList
      leaderboard={leaderboard || []}
      currentUserId={user?.id || null}
    />
  );
}
