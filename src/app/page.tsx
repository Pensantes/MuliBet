/** @format */

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  Target,
  Trophy,
  ArrowRight,
  TrendingUp,
  Users,
  Sparkles,
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let balance = 0;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .eq("id", user.id)
      .single();

    profile = profileData;

    const { data: balanceData } = await supabase.rpc("get_balance");
    balance = balanceData || 0;
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            {user && profile ? (
              <>
                <Badge variant="secondary" className="mb-4">
                  <Coins className="mr-1 h-3 w-3" />
                  {balance.toLocaleString()} Muli no saldo
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                  Olá,{" "}
                  <span className="text-primary">
                    {profile.display_name || profile.username}
                  </span>
                </h1>
                <p className="mt-6 text-lg text-muted-foreground">
                  O que você vai apostar hoje? Explore as previsões abertas ou
                  crie a sua própria.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link href="/predictions">
                    <Button size="lg">
                      Ver previsões
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/predictions/new">
                    <Button variant="outline" size="lg">
                      Criar previsão
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Badge variant="outline" className="mb-4">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Previsões da comunidade
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                  Aposte no que vai{" "}
                  <span className="text-primary">acontecer</span>
                </h1>
                <p className="mt-6 text-lg text-muted-foreground">
                  MuliMarket é a plataforma de previsões da comunidade. Crie
                  apostas sobre qualquer coisa, desafie seus amigos e suba no
                  ranking — tudo com Muli, nossa moeda virtual.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link href="/signup">
                    <Button size="lg">
                      Criar conta grátis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg">
                      Já tenho conta
                    </Button>
                  </Link>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Comece com 1.000 Muli grátis. Sem dinheiro real envolvido.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Decorative blur */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </section>

      {/* Como funciona */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Como funciona
          </h2>
          <p className="mt-4 text-muted-foreground">
            Três passos para começar a apostar e ganhar Muli.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            {
              icon: Target,
              title: "1. Escolha uma previsão",
              description:
                "Navegue pelas previsões abertas da comunidade ou crie a sua própria sobre qualquer assunto.",
            },
            {
              icon: Coins,
              title: "2. Aposte seus Muli",
              description:
                "Escolha a opção que você acha que vai acontecer e aposte a quantidade de Muli que quiser.",
            },
            {
              icon: Trophy,
              title: "3. Ganhe recompensas",
              description:
                "Se você acertar, recebe sua aposta de volta mais uma parte das apostas dos outros usuários.",
            },
          ].map((step) => (
            <div
              key={step.title}
              className="group relative rounded-xl border bg-background p-6 transition-colors hover:border-primary/50"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Mais do que só apostas
            </h2>
            <p className="mt-4 text-muted-foreground">
              Uma pequena economia interna baseada em previsões, reputação e
              competição saudável.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {[
              {
                icon: TrendingUp,
                title: "Ranking",
                description:
                  "Veja quem são os melhores previsores da comunidade e compita pelo topo do ranking.",
              },
              {
                icon: Users,
                title: "Comunidade",
                description:
                  "Crie previsões sobre eventos reais, memes internos ou qualquer coisa que a comunidade quiser.",
              },
              {
                icon: Coins,
                title: "Economia Muli",
                description:
                  "Transfira Muli para amigos, acompanhe seu histórico e construa sua reputação.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-background p-6"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      {!user && (
        <section className="border-t">
          <div className="container mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 p-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Pronto para começar?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Crie sua conta em segundos e ganhe 1.000 Muli pra começar a
                apostar.
              </p>
              <div className="mt-8">
                <Link href="/signup">
                  <Button size="lg">
                    Criar minha conta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
