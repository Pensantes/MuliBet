/** @format */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata = {
  title: "Meu Perfil — MuliMarket",
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Busca os dados atuais do perfil
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    // Fallback caso algo dê muito errado, embora o trigger deva garantir a existência
    redirect("/");
  }

  return <ProfileForm user={user} profile={profile} />;
}
