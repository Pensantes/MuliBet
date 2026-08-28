/** @format */

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicProfile } from "@/components/profile/PublicProfile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("username", username)
    .single();

  return {
    title: profile
      ? `${profile.display_name || profile.username} — MuliMarket`
      : "Perfil — MuliMarket",
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Busca o perfil pelo username
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, created_at")
    .eq("username", username)
    .single();

  if (error || !profile) {
    notFound();
  }

  // Busca o saldo atual
  const { data: balanceData } = await supabase.rpc("get_balance_for_user", {
    p_user_id: profile.id,
  });
  const balance = balanceData || 0;

  // Busca apostas ativas (patrimônio)
  const { data: activeBetsData } = await supabase
    .from("bets")
    .select("amount, prediction:predictions(status)")
    .eq("user_id", profile.id)
    .in("prediction.status", ["OPEN", "CLOSED"]);

  const activeBets = activeBetsData?.reduce((sum, b) => sum + b.amount, 0) || 0;

  // Busca transações recentes (últimas 50)
  const { data: transactionsRaw } = await supabase
    .from("transactions")
    .select(
      `
      id,
      amount,
      type,
      created_at,
      prediction_id,
      prediction:predictions(title),
      related_user_id,
      related_user:profiles!transactions_related_user_id_fkey(username, display_name, avatar_url)
    `,
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // NORMALIZAÇÃO: Converte arrays em objetos únicos
  const transactions = (transactionsRaw || []).map((tx) => ({
    id: tx.id,
    amount: tx.amount,
    type: tx.type,
    created_at: tx.created_at,
    prediction_id: tx.prediction_id,
    prediction: Array.isArray(tx.prediction)
      ? tx.prediction[0] || null
      : tx.prediction,
    related_user_id: tx.related_user_id,
    related_user: Array.isArray(tx.related_user)
      ? tx.related_user[0] || null
      : tx.related_user,
  }));

  return (
    <PublicProfile
      profile={profile}
      balance={balance}
      activeBets={activeBets}
      transactions={transactions}
      currentUserId={user?.id || null}
    />
  );
}
