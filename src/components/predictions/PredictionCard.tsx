/** @format */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Clock,
  Users,
  Coins,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Profile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface PredictionOption {
  id: string;
  label: string;
}

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
  created_at: string;
  closes_at: string;
  resolved_at: string | null;
  creator_id: string;
  creator: Profile;
  prediction_options: PredictionOption[];
  prediction_winning_options: { option_id: string }[]; // <-- ADICIONADO
  bets: Bet[];
}

interface UserBet {
  prediction_id: string;
  option_id: string;
  amount: number;
}

interface PredictionCardProps {
  prediction: Prediction;
  userBet: UserBet | undefined;
  currentUserId: string | null;
  userBalance: number;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(Math.abs(diffMs) / 60000);
  const diffHours = Math.floor(Math.abs(diffMs) / 3600000);
  const diffDays = Math.floor(Math.abs(diffMs) / 86400000);

  if (diffMs < 0) {
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    return `há ${diffDays}d`;
  } else {
    if (diffMins < 60) return `em ${diffMins} min`;
    if (diffHours < 24) return `em ${diffHours}h`;
    return `em ${diffDays}d`;
  }
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
          <XCircle className="h-3 w-3" />
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

export function PredictionCard({
  prediction,
  userBet,
  currentUserId,
  userBalance,
}: PredictionCardProps) {
  const router = useRouter();
  const {
    id,
    title,
    description,
    status,
    closes_at,
    creator,
    prediction_options,
    prediction_winning_options, // <-- ADICIONADO
    bets,
  } = prediction;

  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [betAmount, setBetAmount] = useState<string>("");
  const [isBetting, setIsBetting] = useState(false);
  const [betError, setBetError] = useState("");
  const [betSuccess, setBetSuccess] = useState(false);

  const totalBets = bets.length;
  const totalAmount = bets.reduce((sum, b) => sum + b.amount, 0);

  const isCreator = currentUserId === prediction.creator_id;
  const hasBet = !!userBet;
  const canBet =
    status === "OPEN" && !hasBet && !isCreator && currentUserId !== null;

  // Set de IDs vencedores para busca rápida
  const winningOptionIds = new Set(
    (prediction_winning_options || []).map((w) => w.option_id),
  );

  // Agrupa apostas e calcula a porcentagem do pool
  const betsByOption = prediction_options.map((opt, index) => {
    const optionBets = bets.filter((b) => b.option_id === opt.id);
    const amount = optionBets.reduce((sum, b) => sum + b.amount, 0);
    const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
    const isWinner = winningOptionIds.has(opt.id);
    const isUserChoice = userBet?.option_id === opt.id;

    return {
      option: opt,
      count: optionBets.length,
      amount,
      percentage,
      isWinner,
      isUserChoice,
      index,
    };
  });

  async function handlePlaceBet(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBetError("");
    setBetSuccess(false);

    const amountNum = parseInt(betAmount, 10);

    if (!selectedOptionId) {
      setBetError("Selecione uma opção.");
      return;
    }
    if (isNaN(amountNum) || amountNum < 1) {
      setBetError("Valor mínimo de 1 Muli.");
      return;
    }
    if (amountNum > userBalance) {
      setBetError("Saldo insuficiente.");
      return;
    }

    setIsBetting(true);
    const supabase = createClient();

    const { error } = await supabase.rpc("place_bet", {
      p_prediction_id: id,
      p_option_id: selectedOptionId,
      p_amount: amountNum,
    });

    setIsBetting(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("insufficient")) setBetError("Saldo insuficiente.");
      else if (msg.includes("already"))
        setBetError("Você já apostou nesta previsão.");
      else if (msg.includes("not_open") || msg.includes("expired"))
        setBetError("Esta previsão não está mais aberta.");
      else setBetError("Não foi possível apostar. Tente novamente.");
      return;
    }

    setBetSuccess(true);
    setBetAmount("");
    setSelectedOptionId("");
    router.refresh();
  }

  const quickAmounts = [10, 50, 100, 500];

  return (
    <div className="group rounded-lg border bg-background p-5 transition-colors hover:border-primary/30">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {getStatusBadge(status)}
            {hasBet && (
              <Badge
                variant="outline"
                className={`gap-1 ${status === "RESOLVED" && winningOptionIds.has(userBet.option_id) ? "text-green-600 border-green-500" : "text-blue-600"}`}
              >
                {status === "RESOLVED" &&
                winningOptionIds.has(userBet.option_id) ? (
                  <Trophy className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3" />
                )}
                {status === "RESOLVED" &&
                winningOptionIds.has(userBet.option_id)
                  ? "Você acertou!"
                  : "Você apostou"}
              </Badge>
            )}
          </div>
          <Link href={`/predictions/${id}`} className="hover:underline">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
          </Link>
        </div>
      </div>

      {/* Descrição */}
      {description && (
        <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      )}

      {/* Opções com Porcentagem e Seleção Visual */}
      <div className="mb-4 space-y-2">
        {betsByOption.map(
          ({
            option,
            count,
            amount,
            percentage,
            isWinner,
            isUserChoice,
            index,
          }) => {
            const isSelected = selectedOptionId === option.id;

            return (
              <div
                key={option.id}
                onClick={() => canBet && setSelectedOptionId(option.id)}
                className={`relative overflow-hidden rounded-md border px-3 py-2.5 text-sm transition-all ${
                  status === "RESOLVED" && isWinner
                    ? "border-green-500 bg-green-50 dark:bg-green-950/30 cursor-default" // DESTAQUE DO VENCEDOR
                    : hasBet
                      ? "bg-muted/30 border-transparent cursor-default"
                      : canBet && isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/20 cursor-pointer"
                        : canBet
                          ? "border-border hover:bg-muted/50 hover:border-primary/30 cursor-pointer"
                          : "bg-muted/20 border-transparent cursor-default"
                }`}
              >
                {/* Barra de progresso de porcentagem no fundo */}
                {totalAmount > 0 && (
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                      status === "RESOLVED" && isWinner
                        ? "bg-green-500/15"
                        : hasBet && isUserChoice
                          ? "bg-primary/10"
                          : canBet && isSelected
                            ? "bg-primary/20"
                            : "bg-muted"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                )}

                <div className="relative flex items-center justify-between gap-2">
                  <div className="flex flex-1 items-center gap-2">
                    {/* Ícone de Check se for vencedor ou selecionado, senão mostra a letra */}
                    {status === "RESOLVED" && isWinner ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : canBet && isSelected ? (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] h-5 shrink-0"
                      >
                        {String.fromCharCode(65 + index)}
                      </Badge>
                    )}

                    <span className="font-medium truncate">{option.label}</span>

                    {/* Badge de Vencedora */}
                    {status === "RESOLVED" && isWinner && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-green-500 text-green-600 shrink-0 bg-green-500/10"
                      >
                        <Trophy className="h-3 w-3" />
                        Vencedora
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="flex items-center gap-1 font-medium text-foreground text-xs">
                        <Coins className="h-3 w-3 text-primary" />
                        {amount.toLocaleString()}
                      </span>
                      {totalAmount > 0 && (
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          },
        )}
      </div>

      {/* Área de Aposta Rápida ou Footer Normal */}
      {canBet ? (
        <form
          onSubmit={handlePlaceBet}
          className="mt-4 space-y-3 border-t pt-4"
          onClick={(e) => e.stopPropagation()}
        >
          {betError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                {betError}
              </AlertDescription>
            </Alert>
          )}
          {betSuccess && (
            <Alert className="py-2 border-green-500 text-green-700 dark:text-green-400 bg-green-500/10">
              <CheckCircle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                Aposta realizada com sucesso!
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Coins className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                min={1}
                max={userBalance}
                placeholder="Valor"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="pl-8 h-9 text-sm"
                disabled={isBetting}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={isBetting || !selectedOptionId || !betAmount}
              className="h-9 px-4"
            >
              {isBetting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Apostar"
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((qa) => (
              <Button
                key={qa}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setBetAmount(String(qa))}
                disabled={isBetting || qa > userBalance}
              >
                {qa}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => setBetAmount(String(userBalance))}
              disabled={isBetting || userBalance === 0}
            >
              Máx
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-right">
            Saldo disponível: {userBalance.toLocaleString()} Muli
          </p>
        </form>
      ) : (
        /* Footer Normal (quando não pode apostar) */
        <div className="mt-4 flex items-center justify-between border-t pt-4">
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
            <span className="text-xs text-muted-foreground">
              por{" "}
              <Link
                href={`/profile/${creator.username}`}
                className="font-medium text-foreground hover:underline"
              >
                {creator.display_name || creator.username}
              </Link>
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {totalBets} {totalBets === 1 ? "aposta" : "apostas"}
            </span>
            <span className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              {totalAmount.toLocaleString()} Muli
            </span>
            <Link href={`/predictions/${id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
              >
                Detalhes <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Data limite */}
      {status === "OPEN" && (
        <div className="mt-3 text-center text-xs text-muted-foreground">
          Encerra {formatRelativeTime(closes_at)}
        </div>
      )}
    </div>
  );
}
