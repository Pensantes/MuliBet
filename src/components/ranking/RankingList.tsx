/** @format */

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Trophy,
  Medal,
  Crown,
  Coins,
  TrendingUp,
  User as UserIcon,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderboardEntry {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  metric_value: number;
  rank_position: number;
}

interface RankingListProps {
  leaderboard: LeaderboardEntry[];
  currentUserId: string | null;
  initialType: string;
  initialPeriod: string;
}

type RankingType = "balance" | "net_worth" | "gains" | "losses";
type RankingPeriod = "day" | "week" | "month" | "total";

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

function getTypeConfig(type: RankingType) {
  switch (type) {
    case "balance":
      return {
        title: "Saldo em Conta",
        description: "Os maiores saldos disponíveis no momento.",
        userLabel: "Seu saldo",
        icon: Wallet,
        color: "text-primary",
      };
    case "net_worth":
      return {
        title: "Patrimônio Total",
        description:
          "Saldo em conta + dinheiro preso em apostas não resolvidas.",
        userLabel: "Seu patrimônio",
        icon: Coins,
        color: "text-primary",
      };
    case "gains":
      return {
        title: "Maiores Ganhos",
        description: "Usuários com maior lucro líquido no período.",
        userLabel: "Seus ganhos",
        icon: ArrowUpCircle,
        color: "text-green-600",
      };
    case "losses":
      return {
        title: "Maiores Prejuízos",
        description: "Usuários com maior perda líquida no período.",
        userLabel: "Seu prejuízo",
        icon: ArrowDownCircle,
        color: "text-destructive",
      };
  }
}

export function RankingList({
  leaderboard,
  currentUserId,
  initialType,
  initialPeriod,
}: RankingListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const currentUserEntry = currentUserId
    ? leaderboard.find((e) => e.id === currentUserId)
    : null;
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  const config = getTypeConfig(initialType as RankingType);
  const Icon = config.icon;

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);

    if (key === "type" && value !== "gains" && value !== "losses") {
      params.delete("period");
    }

    router.push(`/ranking?${params.toString()}`);
  }

  const showPeriodFilter = initialType === "gains" || initialType === "losses";

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
          Acompanhe o desempenho dos melhores da comunidade.
        </p>
      </div>

      {/* Filtros com TABS e Dropdown melhorados */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full">
          <span className="mb-2 block text-sm font-medium text-muted-foreground">
            Tipo de Ranking
          </span>
          <Tabs
            value={initialType}
            onValueChange={(v) => updateFilter("type", v)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-10 p-1">
              <TabsTrigger
                value="balance"
                className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Saldo
              </TabsTrigger>
              <TabsTrigger
                value="net_worth"
                className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Coins className="mr-2 h-4 w-4" />
                Patrimônio
              </TabsTrigger>
              <TabsTrigger
                value="gains"
                className="text-xs sm:text-sm data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                Ganhos
              </TabsTrigger>
              <TabsTrigger
                value="losses"
                className="text-xs sm:text-sm data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
              >
                <ArrowDownCircle className="mr-2 h-4 w-4" />
                Prejuízos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {showPeriodFilter && (
          <div className="w-full sm:w-56 space-y-2 -mb-2">
            <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Período
            </span>
            <Select
              value={initialPeriod || "total"}
              onValueChange={(v) => updateFilter("period", v || "")}
            >
              <SelectTrigger className="w-full">
                <span>
                  {initialPeriod === "day" && "Últimas 24 horas"}
                  {initialPeriod === "week" && "Últimos 7 dias"}
                  {initialPeriod === "month" && "Últimos 30 dias"}
                  {(!initialPeriod || initialPeriod === "total") &&
                    "Todo o período"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Últimas 24 horas</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Últimos 30 dias</SelectItem>
                <SelectItem value="total">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Card do usuário atual */}
      {currentUserEntry && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                #{currentUserEntry.rank_position}
              </div>
              <Link href={`/profile/${currentUserEntry.username}`}>
                <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage
                    src={currentUserEntry.avatar_url || undefined}
                    alt={currentUserEntry.username}
                  />
                  <AvatarFallback>
                    {currentUserEntry.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <Link
                  href={`/profile/${currentUserEntry.username}`}
                  className="font-medium hover:underline hover:text-primary transition-colors"
                >
                  {currentUserEntry.display_name || currentUserEntry.username}
                </Link>
                <p className="text-xs text-muted-foreground">
                  @{currentUserEntry.username}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`flex items-center justify-end gap-1 font-bold ${config.color}`}
              >
                <Icon className="h-4 w-4" />
                {currentUserEntry.metric_value.toLocaleString()} Muli
              </div>
              <p className="text-xs text-muted-foreground">
                {config.userLabel}
              </p>
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
            <CardDescription>{config.description}</CardDescription>
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

                    <Link href={`/profile/${entry.username}`}>
                      <Avatar
                        className={`mb-3 cursor-pointer hover:opacity-80 transition-opacity ${
                          is1st ? "h-20 w-20" : "h-16 w-16"
                        }`}
                      >
                        <AvatarImage
                          src={entry.avatar_url || undefined}
                          alt={entry.username}
                        />
                        <AvatarFallback
                          className={is1st ? "text-xl" : "text-lg"}
                        >
                          {entry.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>

                    <Link
                      href={`/profile/${entry.username}`}
                      className="text-center text-sm font-semibold leading-tight hover:underline hover:text-primary transition-colors"
                    >
                      {entry.display_name || entry.username}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      @{entry.username}
                    </p>

                    <div
                      className={`mt-3 flex items-center gap-1 font-bold ${config.color}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-sm">
                        {entry.metric_value.toLocaleString()}
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
              const isNegative = entry.metric_value < 0;

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
                    <Badge
                      variant="outline"
                      className={`min-w-12 justify-center font-mono ${getRankBadgeColor(
                        entry.rank_position,
                      )}`}
                    >
                      #{entry.rank_position}
                    </Badge>

                    <Link href={`/profile/${entry.username}`}>
                      <Avatar className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarImage
                          src={entry.avatar_url || undefined}
                          alt={entry.username}
                        />
                        <AvatarFallback>
                          {entry.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>

                    <div>
                      <Link
                        href={`/profile/${entry.username}`}
                        className="text-sm font-medium leading-tight hover:underline hover:text-primary transition-colors"
                      >
                        {entry.display_name || entry.username}
                        {isCurrentUser && (
                          <Badge
                            variant="secondary"
                            className="ml-2 text-[10px]"
                          >
                            Você
                          </Badge>
                        )}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        @{entry.username}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-1 font-semibold ${
                      isNegative ? "text-destructive" : config.color
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{entry.metric_value.toLocaleString()}</span>
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
              Ainda não há dados para este ranking
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Assim que os usuários começarem a apostar, os dados aparecerão
              aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
