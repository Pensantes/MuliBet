/** @format */

"use client";

import Link from "next/link";
import {
  Wallet,
  Coins,
  Target,
  Trophy,
  ArrowUpCircle,
  ArrowDownCircle,
  Gift,
  Calendar,
  User as UserIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  created_at: string;
  prediction_id: string | null;
  prediction: { title: string } | null; // <-- Mudou para aceitar null
  related_user_id: string | null;
  related_user: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null; // <-- Mudou para aceitar null
}

interface PublicProfileProps {
  profile: Profile;
  balance: number;
  activeBets: number;
  transactions: Transaction[];
  currentUserId: string | null;
}

function getTransactionInfo(type: string) {
  switch (type) {
    case "INITIAL_BALANCE":
      return {
        icon: Gift,
        label: "Saldo inicial",
        color: "text-blue-600",
        bgColor: "bg-blue-500/10",
      };
    case "BET":
      return {
        icon: Target,
        label: "Aposta",
        color: "text-destructive",
        bgColor: "bg-destructive/10",
      };
    case "BET_WIN":
      return {
        icon: Trophy,
        label: "Ganho em aposta",
        color: "text-green-600",
        bgColor: "bg-green-500/10",
      };
    case "CREATOR_FEE":
      return {
        icon: Coins,
        label: "Taxa de criador",
        color: "text-primary",
        bgColor: "bg-primary/10",
      };
    case "TRANSFER_IN":
      return {
        icon: ArrowUpCircle,
        label: "Transferência recebida",
        color: "text-green-600",
        bgColor: "bg-green-500/10",
      };
    case "TRANSFER_OUT":
      return {
        icon: ArrowDownCircle,
        label: "Transferência enviada",
        color: "text-destructive",
        bgColor: "bg-destructive/10",
      };
    default:
      return {
        icon: Coins,
        label: "Transação",
        color: "text-muted-foreground",
        bgColor: "bg-muted",
      };
  }
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PublicProfile({
  profile,
  balance,
  activeBets,
  transactions,
  currentUserId,
}: PublicProfileProps) {
  const isOwnProfile = currentUserId === profile.id;
  const netWorth = balance + activeBets;

  // Calcula estatísticas
  const totalGains = transactions
    .filter(
      (t) =>
        t.type === "BET_WIN" ||
        t.type === "CREATOR_FEE" ||
        t.type === "TRANSFER_IN",
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const totalLosses = transactions
    .filter((t) => t.type === "BET" || t.type === "TRANSFER_OUT")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      {/* Header do Perfil */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar Grande */}
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage
                src={profile.avatar_url || undefined}
                alt={profile.username}
              />
              <AvatarFallback className="text-3xl">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Informações */}
            <div className="flex-1 text-center sm:text-left">
              <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-bold">
                  {profile.display_name || profile.username}
                </h1>
                {isOwnProfile && (
                  <Badge variant="secondary" className="text-xs">
                    Você
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">@{profile.username}</p>
              <div className="mt-3 flex items-center justify-center gap-1 text-sm text-muted-foreground sm:justify-start">
                <Calendar className="h-4 w-4" />
                <span>
                  Membro desde{" "}
                  {new Date(profile.created_at).toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Botão de Ação */}
            {isOwnProfile && (
              <Link href="/profile">
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                >
                  Editar perfil
                </Badge>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Saldo em conta</p>
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold">
              {balance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Muli disponível</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Em apostas</p>
              <Target className="h-4 w-4 text-orange-600" />
            </div>
            <div className="mt-2 text-2xl font-bold">
              {activeBets.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Muli preso</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Patrimônio total</p>
              <Coins className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold">
              {netWorth.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Saldo + apostas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Resultado líquido</p>
              {totalGains - totalLosses >= 0 ? (
                <ArrowUpCircle className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div
              className={`mt-2 text-2xl font-bold ${
                totalGains - totalLosses >= 0
                  ? "text-green-600"
                  : "text-destructive"
              }`}
            >
              {totalGains - totalLosses >= 0 ? "+" : ""}
              {(totalGains - totalLosses).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Ganhos - Perdas</p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Transações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5 text-muted-foreground" />
            Histórico de Transações
          </CardTitle>
          <CardDescription>
            {transactions.length}{" "}
            {transactions.length === 1 ? "transação" : "transações"} recentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <UserIcon className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Nenhuma transação ainda</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                As transações aparecerão aqui assim que o usuário começar a usar
                o MuliMarket.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const info = getTransactionInfo(tx.type);
                const Icon = info.icon;
                const isPositive = tx.amount > 0;

                // Contexto da transação
                let context: React.ReactNode = null;
                if (tx.prediction?.title) {
                  context = (
                    <Link
                      href={`/predictions/${tx.prediction_id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {tx.prediction.title}
                    </Link>
                  );
                } else if (tx.related_user) {
                  const isOut = tx.type === "TRANSFER_OUT";
                  context = (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-4 w-4">
                        <AvatarImage
                          src={tx.related_user.avatar_url || undefined}
                          alt={tx.related_user.username}
                        />
                        <AvatarFallback className="text-[8px]">
                          {tx.related_user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Link
                        href={`/profile/${tx.related_user.username}`}
                        className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {isOut ? "para" : "de"}{" "}
                        <span className="font-medium">
                          {tx.related_user.display_name ||
                            tx.related_user.username}
                        </span>
                      </Link>
                    </div>
                  );
                }

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30"
                  >
                    {/* Ícone */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${info.bgColor}`}
                    >
                      <Icon className={`h-5 w-5 ${info.color}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{info.label}</p>
                      </div>
                      {context && <div className="mt-0.5">{context}</div>}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(tx.created_at)}
                      </p>
                    </div>

                    {/* Valor */}
                    <div className="text-right shrink-0">
                      <div
                        className={`text-sm font-bold ${
                          isPositive ? "text-green-600" : "text-destructive"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {tx.amount.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">Muli</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
