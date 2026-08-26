/** @format */

"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Coins,
  Trophy,
  User as UserIcon,
  CalendarClock,
  Lock,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BetForm } from "./BetForm";

interface Profile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface PredictionOption {
  id: string;
  label: string;
}

// Simplificado: não precisamos mais de user_profile ou created_at aqui
interface Bet {
  id: string;
  user_id: string;
  option_id: string;
  amount: number;
}

interface Prediction {
  id: string;
  title: string;
  description: string | null;
  status: "OPEN" | "CLOSED" | "RESOLVED";
  closes_at: string;
  resolved_at: string | null;
  creator_id: string;
  creator: Profile;
  prediction_options: PredictionOption[];
  prediction_winning_options: { option_id: string }[];
  bets: Bet[];
}

interface UserBet {
  id: string;
  option_id: string;
  amount: number;
}

interface PredictionDetailProps {
  prediction: Prediction;
  userBet: UserBet | null;
  currentUserId: string | null;
  userBalance: number;
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(Math.abs(diffMs) / 60000);
  const diffHours = Math.floor(Math.abs(diffMs) / 3600000);
  const diffDays = Math.floor(Math.abs(diffMs) / 86400000);

  const isPast = diffMs < 0;
  let text: string;
  if (diffMins < 60) text = `${diffMins} min`;
  else if (diffHours < 24) text = `${diffHours}h`;
  else text = `${diffDays}d`;

  return isPast ? `há ${text}` : `em ${text}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "OPEN":
      return (
        <Badge variant="default" className="gap-1">
          <Clock className="h-3 w-3" />
          Aberta
        </Badge>
      );
    case "CLOSED":
      return (
        <Badge variant="secondary" className="gap-1">
          <Lock className="h-3 w-3" />
          Encerrada
        </Badge>
      );
    case "RESOLVED":
      return (
        <Badge variant="outline" className="gap-1 text-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Resolvida
        </Badge>
      );
    default:
      return null;
  }
}

export function PredictionDetail({
  prediction,
  userBet,
  currentUserId,
  userBalance,
}: PredictionDetailProps) {
  const {
    id,
    title,
    description,
    status,
    closes_at,
    creator,
    prediction_options,
    prediction_winning_options,
    bets,
  } = prediction;

  const totalAmount = bets.reduce((sum, b) => sum + b.amount, 0);
  const totalBets = bets.length;
  const isCreator = currentUserId === prediction.creator_id;

  // 1. CRIA O SET COM OS IDS DAS OPÇÕES VENCEDORAS
  const winningOptionIds = new Set(
    (prediction_winning_options || []).map((w) => w.option_id),
  );

  // 2. ESTATÍSTICAS POR OPÇÃO (AGREGADAS)
  const optionsStats = prediction_options.map((opt, index) => {
    const optionBets = bets.filter((b) => b.option_id === opt.id);
    const amount = optionBets.reduce((sum, b) => sum + b.amount, 0);
    const count = optionBets.length;
    const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;

    const isWinner = winningOptionIds.has(opt.id);
    const isUserChoice = userBet?.option_id === opt.id;

    return {
      option: opt,
      count,
      amount,
      percentage,
      isWinner,
      isUserChoice,
      index,
    };
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/predictions"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para previsões
        </Link>
      </div>

      {/* Card principal */}
      <Card className="mb-6">
        <CardHeader>
          <div className="mb-3 flex items-center gap-2">
            {getStatusBadge(status)}
            {userBet && status !== "RESOLVED" && (
              <Badge variant="outline" className="gap-1 text-blue-600">
                <Trophy className="h-3 w-3" />
                Você apostou
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={creator.avatar_url || undefined}
                  alt={creator.username}
                />
                <AvatarFallback>
                  {creator.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Link
                href={`/profile/${creator.username}`}
                className="font-medium text-foreground hover:underline"
              >
                {creator.display_name || creator.username}
              </Link>
            </div>

            <div className="flex items-center gap-1">
              <CalendarClock className="h-4 w-4" />
              <span>
                {status === "OPEN"
                  ? `Encerra ${formatRelativeTime(closes_at)}`
                  : `Encerrou ${formatDateTime(closes_at)}`}
              </span>
            </div>
          </div>
        </CardHeader>

        {description && (
          <CardContent className="border-t pt-4">
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {description}
            </p>
          </CardContent>
        )}
      </Card>

      {/* Opções com Totais Agregados */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Opções e Apostas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {optionsStats.map(
            ({
              option,
              count,
              amount,
              percentage,
              isWinner,
              isUserChoice,
              index,
            }) => (
              <div
                key={option.id}
                className={`relative overflow-hidden rounded-lg border p-4 transition-colors ${
                  isWinner
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : isUserChoice
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/30"
                }`}
              >
                {/* Barra de progresso de porcentagem */}
                {totalAmount > 0 && (
                  <div
                    className={`absolute inset-y-0 left-0 ${
                      isWinner
                        ? "bg-green-500/10"
                        : isUserChoice
                          ? "bg-primary/10"
                          : "bg-muted/50"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                )}

                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={isWinner ? "default" : "outline"}
                      className={`font-mono text-xs ${
                        isWinner ? "bg-green-600 hover:bg-green-700" : ""
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </Badge>
                    <span className="font-medium">{option.label}</span>

                    {isWinner && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-green-500 text-green-600"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Vencedora
                      </Badge>
                    )}
                    {isUserChoice && !isWinner && (
                      <Badge variant="outline" className="gap-1">
                        Sua escolha
                      </Badge>
                    )}
                  </div>

                  {/* TOTAIS AGREGADOS (Sem mostrar quem) */}
                  <div className="flex items-center gap-5 text-sm">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 font-semibold text-primary">
                        <Coins className="h-4 w-4" />
                        <span>{amount.toLocaleString()} Muli</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>
                          {count} {count === 1 ? "aposta" : "apostas"}
                        </span>
                      </div>
                    </div>

                    {totalAmount > 0 && (
                      <div className="w-14 text-right text-xs font-medium text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ),
          )}
        </CardContent>
      </Card>

      {/* Área de aposta / resultado */}
      <div className="space-y-4">
        {/* Estatísticas totais */}
        <Card>
          <CardContent className="flex items-center justify-around py-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <Coins className="h-5 w-5 text-primary" />
                {totalAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total no pool</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <Users className="h-5 w-5 text-primary" />
                {totalBets}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalBets === 1 ? "aposta" : "apostas"}
              </p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold">
                {prediction_options.length}
              </div>
              <p className="text-xs text-muted-foreground">opções</p>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de aposta */}
        {status === "OPEN" && currentUserId && !userBet && !isCreator && (
          <BetForm
            predictionId={id}
            options={prediction_options}
            userBalance={userBalance}
          />
        )}

        {/* Mensagens de estado */}
        {status === "OPEN" && userBet && (
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Você já apostou nesta previsão</p>
                <p className="text-sm text-muted-foreground">
                  Aguarde o encerramento para ver o resultado.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {status === "OPEN" && isCreator && (
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Você é o criador desta previsão e não pode apostar nela.
              </p>
            </CardContent>
          </Card>
        )}

        {status === "CLOSED" && (
          <Card>
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Previsão encerrada</p>
                  <p className="text-sm text-muted-foreground">
                    {isCreator
                      ? "Defina a(s) opção(ões) vencedora(s) para distribuir as recompensas."
                      : "Aguardando o criador definir a opção vencedora."}
                  </p>
                </div>
              </div>
              {isCreator && (
                <Link href={`/predictions/${id}/resolve`}>
                  <Button>
                    <Trophy className="mr-2 h-4 w-4" />
                    Resolver
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {status === "RESOLVED" && userBet && (
          <Card
            className={
              winningOptionIds.has(userBet.option_id)
                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                : "border-destructive/50"
            }
          >
            <CardContent className="flex items-center gap-3 py-4">
              {winningOptionIds.has(userBet.option_id) ? (
                <>
                  <Trophy className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">
                      Você acertou!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      As recompensas foram distribuídas para o seu saldo.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">
                      Você não acertou dessa vez
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tente novamente na próxima previsão!
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {!currentUserId && status === "OPEN" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Entre na sua conta para apostar nesta previsão.
              </p>
              <Link href="/login">
                <Button>Entrar</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
