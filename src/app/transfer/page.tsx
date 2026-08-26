/** @format */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TransferForm } from "@/components/transfer/TransferForm";

export const metadata = {
  title: "Transferir Muli — MuliBet",
};

export default async function TransferPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Busca o saldo atual
  const { data: balanceData } = await supabase.rpc("get_balance");
  const balance = balanceData || 0;

  return <TransferForm currentUserId={user.id} balance={balance} />;
}
