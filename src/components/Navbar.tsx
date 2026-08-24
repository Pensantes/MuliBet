/** @format */

import { createClient } from "@/lib/supabase/server";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let balance = 0;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", user.id)
      .single();

    profile = profileData;

    const { data: balanceData } = await supabase.rpc("get_balance");
    balance = balanceData || 0;
  }

  return <NavbarClient user={user} profile={profile} balance={balance} />;
}
