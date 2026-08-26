/** @format */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatementClient } from "@/components/statement/StatementClient";

export const metadata = {
  title: "Extrato — MuliBet",
};

export default async function StatementPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const fromParam = typeof params.from === "string" ? params.from : "";
  const toParam = typeof params.to === "string" ? params.to : "";
  const typeParam = typeof params.type === "string" ? params.type : "";

  // Converte os filtros pra timestamps válidos
  const from = fromParam ? new Date(fromParam).toISOString() : null;
  const to = toParam ? new Date(toParam).toISOString() : null;
  const type = typeParam || null;

  // Busca o extrato
  const { data: transactions, error } = await supabase.rpc("get_statement", {
    p_from: from,
    p_to: to,
    p_type: type,
  });

  if (error) {
    console.error("Erro ao buscar extrato:", error);
  }

  // Saldo atual
  const { data: balanceData } = await supabase.rpc("get_balance");
  const balance = balanceData || 0;

  return (
    <StatementClient
      transactions={transactions || []}
      balance={balance}
      filters={{ from: fromParam, to: toParam, type: typeParam }}
    />
  );
}
