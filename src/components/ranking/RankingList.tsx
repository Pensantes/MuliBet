/** @format */

"use client";

import {
  Trophy,
  Medal,
  Crown,
  Coins,
  TrendingUp,
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

interface LeaderboardEntry {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  balance: number;
  rank_position: number;
}

interface RankingListProps {
  leaderboard: LeaderboardEntry[];
  currentUserId: string | null;
}

function getRankIcon(position: number) {
  if (position === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (position === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (position === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return null;
}

function getRankBadgeColor(position: number): string {
  if (position === 1)
    return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
  if (position === 2)
    return "bg-slate-400/10 text-slate-500 border-slate-400/30";
  if (position === 3)
    return "bg-amber-600/10 text-amber-700 border-amber-600/30";
  return "bg-muted text-muted-foreground";
}

export function RankingList({ leaderboard, currentUserId }: RankingListProps) {
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Posição do usuário atual
  const currentUserEntry = currentUserId
    ? leaderboard.find((e) => e.id === currentUserId)
    : null;

  // Ordena o pódio visualmente: 2º, 1º, 3º (padrão de pódio)
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Trophy className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ranking MuliMarket
        </h1>
        <p className="mt-2 text-muted-foreground">
          Os melhores previsores da comunidade, ordenados por saldo.
        </p>
      </div>

      {/* Card do usuário atual (se logado) */}
      {currentUserEntry && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                #{currentUserEntry.rank_position}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={currentUserEntry.avatar_url || undefined}
                  alt={currentUserEntry.username}
                />
                <AvatarFallback>
                  {currentUserEntry.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {currentUserEntry.display_name || currentUserEntry.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{currentUserEntry.username}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 font-bold text-primary">
                <Coins className="h-4 w-4" />
                {currentUserEntry.balance.toLocaleString()} Muli
              </div>
              <p className="text-xs text-muted-foreground">Seu saldo</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pódio (Top 3) */}
      {top3.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top 3
            </CardTitle>
            <CardDescription>Os maiores saldos da comunidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {podiumOrder.map((entry) => {
                if (!entry) return <div key="empty" />;
                const is1st = entry.rank_position === 1;

                return (
                  <div
                    key={entry.id}
                    className={`flex flex-col items-center rounded-lg border p-4 transition-colors ${
                      is1st
                        ? "border-yellow-500/30 bg-yellow-500/5 order-2"
                        : entry.rank_position === 2
                          ? "border-slate-400/30 bg-slate-400/5 order-1"
                          : "border-amber-600/30 bg-amber-600/5 order-3"
                    }`}
                  >
                    {/* Posição */}
                    <div
                      className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                        is1st
                          ? "bg-yellow-500/20"
                          : entry.rank_position === 2
                            ? "bg-slate-400/20"
                            : "bg-amber-600/20"
                      }`}
                    >
                      {getRankIcon(entry.rank_position)}
                    </div>

                    {/* Avatar */}
                    <Avatar
                      className={`mb-3 ${is1st ? "h-20 w-20" : "h-16 w-16"}`}
                    >
                      <AvatarImage
                        src={entry.avatar_url || undefined}
                        alt={entry.username}
                      />
                      <AvatarFallback className={is1st ? "text-xl" : "text-lg"}>
                        {entry.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Nome */}
                    <p className="text-center text-sm font-semibold leading-tight">
                      {entry.display_name || entry.username}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      @{entry.username}
                    </p>

                    {/* Saldo */}
                    <div className="mt-3 flex items-center gap-1 font-bold text-primary">
                      <Coins className="h-3.5 w-3.5" />
                      <span className="text-sm">
                        {entry.balance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resto da lista */}
      {rest.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Classificação completa
            </CardTitle>
            <CardDescription>
              {leaderboard.length}{" "}
              {leaderboard.length === 1 ? "usuário" : "usuários"} no ranking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {rest.map((entry) => {
              const isCurrentUser = entry.id === currentUserId;

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                    isCurrentUser
                      ? "border-primary/50 bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Posição */}
                    <Badge
                      variant="outline"
                      className={`min-w-12 justify-center font-mono ${getRankBadgeColor(
                        entry.rank_position,
                      )}`}
                    >
                      #{entry.rank_position}
                    </Badge>

                    {/* Avatar */}
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={entry.avatar_url || undefined}
                        alt={entry.username}
                      />
                      <AvatarFallback>
                        {entry.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Nome */}
                    <div>
                      <p className="text-sm font-medium leading-tight">
                        {entry.display_name || entry.username}
                        {isCurrentUser && (
                          <Badge
                            variant="secondary"
                            className="ml-2 text-[10px]"
                          >
                            Você
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{entry.username}
                      </p>
                    </div>
                  </div>

                  {/* Saldo */}
                  <div className="flex items-center gap-1 font-semibold">
                    <Coins className="h-4 w-4 text-primary" />
                    <span>{entry.balance.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {leaderboard.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <UserIcon className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">
              Ainda não há ninguém no ranking
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Assim que os usuários começarem a apostar, o ranking será formado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
