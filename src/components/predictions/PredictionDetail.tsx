/** @format */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const router = useRouter();
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

  // Estados para aposta inline
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [betAmount, setBetAmount] = useState<string>("");
  const [isBetting, setIsBetting] = useState(false);
  const [betError, setBetError] = useState("");
  const [betSuccess, setBetSuccess] = useState(false);

  const totalAmount = bets.reduce((sum, b) => sum + b.amount, 0);
  const totalBets = bets.length;
  const isCreator = currentUserId === prediction.creator_id;
  const hasBet = !!userBet;

  // Pode apostar se: estiver aberta, não tiver apostado, não for o criador e estiver logado
  const canBet =
    status === "OPEN" && !hasBet && !isCreator && currentUserId !== null;

  const winningOptionIds = new Set(
    (prediction_winning_options || []).map((w) => w.option_id),
  );

  const optionsStats = prediction_options.map((opt, index) => {
    const optionBets = bets.filter((b) => b.option_id === opt.id);
    const amount = optionBets.reduce((sum, b) => sum + b.amount, 0);
    const count = optionBets.length;
    const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;

    return {
      option: opt,
      count,
      amount,
      percentage,
      isWinner: winningOptionIds.has(opt.id),
      isUserChoice: userBet?.option_id === opt.id,
      index,
    };
  });

  async function handlePlaceBet(e: React.FormEvent) {
    e.preventDefault();
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
            {hasBet && status !== "RESOLVED" && (
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

      {/* CARD UNIFICADO: Opções + Área de Aposta (se aplicável) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">
            {canBet ? "Escolha uma opção e aposte" : "Opções e Apostas"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de Opções */}
          <div className="space-y-2">
            {optionsStats.map(
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
                    className={`relative overflow-hidden rounded-lg border p-4 transition-all ${
                      hasBet
                        ? "bg-muted/30 border-transparent cursor-default"
                        : canBet && isSelected
                          ? "border-primary bg-primary/10 ring-1 ring-primary/20 cursor-pointer"
                          : canBet
                            ? "border-border hover:bg-muted/50 hover:border-primary/30 cursor-pointer"
                            : "bg-muted/20 border-transparent cursor-default"
                    }`}
                  >
                    {/* Barra de progresso */}
                    {totalAmount > 0 && (
                      <div
                        className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                          hasBet && isUserChoice
                            ? "bg-primary/10"
                            : canBet && isSelected
                              ? "bg-primary/20"
                              : isWinner
                                ? "bg-green-500/10"
                                : "bg-muted"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    )}

                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {canBet && isSelected ? (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        ) : (
                          <Badge
                            variant={isWinner ? "default" : "outline"}
                            className={`font-mono text-xs shrink-0 ${isWinner ? "bg-green-600" : ""}`}
                          >
                            {String.fromCharCode(65 + index)}
                          </Badge>
                        )}
                        <span className="font-medium">{option.label}</span>

                        {isWinner && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-green-500 text-green-600 shrink-0"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Vencedora
                          </Badge>
                        )}
                        {isUserChoice && !isWinner && (
                          <Badge variant="outline" className="gap-1 shrink-0">
                            Sua escolha
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-5 text-sm shrink-0">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5 font-semibold text-primary">
                            <Coins className="h-4 w-4" />
                            <span>{amount.toLocaleString()}</span>
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
                );
              },
            )}
          </div>

          {/* Formulário de Aposta Inline (Só aparece se canBet for true) */}
          {canBet && (
            <form
              onSubmit={handlePlaceBet}
              className="mt-6 space-y-4 border-t pt-6"
              onClick={(e) => e.stopPropagation()}
            >
              {betError && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {betError}
                  </AlertDescription>
                </Alert>
              )}
              {betSuccess && (
                <Alert className="py-2 border-green-500 text-green-700 dark:text-green-400 bg-green-500/10">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Aposta realizada com sucesso!
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Coins className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    min={1}
                    max={userBalance}
                    placeholder="Valor da aposta"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="pl-10 h-11 text-base"
                    disabled={isBetting}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isBetting || !selectedOptionId || !betAmount}
                  className="h-11 px-6 text-base"
                >
                  {isBetting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirmar Aposta"
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
                    onClick={() => setBetAmount(String(qa))}
                    disabled={isBetting || qa > userBalance}
                    className="h-8 text-xs"
                  >
                    {qa}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount(String(userBalance))}
                  disabled={isBetting || userBalance === 0}
                  className="h-8 text-xs"
                >
                  Máximo
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-right">
                Saldo disponível:{" "}
                <span className="font-medium text-foreground">
                  {userBalance.toLocaleString()} Muli
                </span>
              </p>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas totais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold mb-1">
              <Coins className="h-5 w-5 text-primary" />
              {totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total no pool</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold mb-1">
              <Users className="h-5 w-5 text-primary" />
              {totalBets}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalBets === 1 ? "aposta" : "apostas"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-2xl font-bold mb-1">
              {prediction_options.length}
            </div>
            <p className="text-xs text-muted-foreground">opções</p>
          </CardContent>
        </Card>
      </div>

      {/* Mensagens de estado (quando NÃO pode apostar inline) */}
      {!canBet && status === "OPEN" && userBet && (
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

      {!canBet && status === "OPEN" && isCreator && (
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
  );
}
