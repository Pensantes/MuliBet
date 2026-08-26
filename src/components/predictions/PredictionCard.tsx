/** @format */

"use client";

import Link from "next/link";
import {
  Clock,
  Users,
  Coins,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMs < 0) {
    // No passado
    if (Math.abs(diffMins) < 60) return `há ${Math.abs(diffMins)} min`;
    if (Math.abs(diffHours) < 24) return `há ${Math.abs(diffHours)}h`;
    return `há ${Math.abs(diffDays)}d`;
  } else {
    // No futuro
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
}: PredictionCardProps) {
  const {
    id,
    title,
    description,
    status,
    closes_at,
    creator,
    prediction_options,
    bets,
  } = prediction;

  const totalBets = bets.length;
  const totalAmount = bets.reduce((sum, b) => sum + b.amount, 0);

  // Agrupa apostas por opção
  const betsByOption = prediction_options.map((opt) => {
    const optionBets = bets.filter((b) => b.option_id === opt.id);
    return {
      option: opt,
      count: optionBets.length,
      amount: optionBets.reduce((sum, b) => sum + b.amount, 0),
    };
  });

  const isCreator = currentUserId === prediction.creator_id;
  const hasBet = !!userBet;

  return (
    <Link href={`/predictions/${id}`}>
      <div className="group rounded-lg border bg-background p-6 transition-colors hover:border-primary/50 hover:shadow-sm">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              {getStatusBadge(status)}
              {hasBet && (
                <Badge variant="outline" className="gap-1 text-blue-600">
                  <TrendingUp className="h-3 w-3" />
                  Você apostou
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold group-hover:text-primary">
              {title}
            </h3>
          </div>
        </div>

        {/* Descrição */}
        {description && (
          <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        {/* Opções */}
        <div className="mb-4 space-y-2">
          {betsByOption.map(({ option, count, amount }, index) => (
            <div
              key={option.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {String.fromCharCode(65 + index)}
                </Badge>
                <span className="font-medium">{option.label}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {count}
                </span>
                <span className="flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  {amount.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-4">
          {/* Criador */}
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
              <span className="font-medium text-foreground">
                {creator.display_name || creator.username}
              </span>
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {totalBets} {totalBets === 1 ? "aposta" : "apostas"}
            </span>
            <span className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              {totalAmount.toLocaleString()} Muli
            </span>
          </div>
        </div>

        {/* Data limite */}
        {status === "OPEN" && (
          <div className="mt-3 text-center text-xs text-muted-foreground">
            Encerra {formatRelativeTime(closes_at)}
          </div>
        )}
      </div>
    </Link>
  );
}
