/** @format */

import { createClient } from "@/lib/supabase/server";
import { RankingList } from "@/components/ranking/RankingList";

export const metadata = {
  title: "Ranking — MuliMarket",
};

export const dynamic = "force-dynamic";

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Lê os filtros da URL com valores padrão
  const type = typeof params.type === "string" ? params.type : "balance";
  const period = typeof params.period === "string" ? params.period : "total";

  // Chama a nova RPC
  const { data: leaderboard, error } = await supabase.rpc(
    "get_leaderboard_v2",
    {
      p_type: type,
      p_period: period,
    },
  );

  if (error) {
    console.error("Erro ao buscar ranking:", error);
  }

  return (
    <RankingList
      leaderboard={leaderboard || []}
      currentUserId={user?.id || null}
      initialType={type}
      initialPeriod={period}
    />
  );
}
