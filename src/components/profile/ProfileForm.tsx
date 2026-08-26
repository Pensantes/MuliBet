/** @format */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Link as LinkIcon,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfileData {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ProfileFormProps {
  user: { id: string };
  profile: ProfileData;
}

export function ProfileForm({ user, profile }: ProfileFormProps) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      setFeedback({
        type: "error",
        message: "Não foi possível salvar as alterações. Tente novamente.",
      });
    } else {
      setFeedback({
        type: "success",
        message: "Perfil atualizado com sucesso!",
      });
      // Força o Next.js a recarregar os Server Components (como a Navbar)
      // para mostrar a nova foto imediatamente
      router.refresh();
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="mt-1 text-muted-foreground">
          Gerencie como você aparece para a comunidade.
        </p>
      </div>

      <Card>
        <CardHeader className="text-center">
          {/* Avatar Grande para Preview */}
          <div className="mx-auto mb-4">
            <Avatar className="h-24 w-24 border-2 border-background shadow-sm">
              <AvatarImage
                src={avatarUrl || undefined}
                alt={profile.username}
              />
              <AvatarFallback className="text-2xl">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-xl">@{profile.username}</CardTitle>
          <CardDescription>Username não pode ser alterado.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {feedback && (
              <Alert
                variant={feedback.type === "error" ? "destructive" : "default"}
                className={
                  feedback.type === "success"
                    ? "border-green-500 text-green-700 dark:text-green-400"
                    : ""
                }
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{feedback.message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de exibição</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome ou apelido"
                  className="pl-9"
                  maxLength={50}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Opcional. Se deixado em branco, seu username será exibido.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">URL da foto de perfil</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="avatarUrl"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://exemplo.com/sua-foto.jpg"
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Cole o link direto de uma imagem (ex: Imgur, Discord, etc).
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t bg-muted/20 p-6">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Salvando..." : "Salvar alterações"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
