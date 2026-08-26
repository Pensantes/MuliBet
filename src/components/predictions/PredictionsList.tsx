/** @format */

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Target,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpDown,
  Coins,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PredictionCard } from "./PredictionCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

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

interface UserBet {
  prediction_id: string;
  option_id: string;
  amount: number;
}

interface PredictionsListProps {
  predictions: Prediction[];
  userBets: UserBet[];
  currentUserId: string | null;
  userBalance: number;
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
  prediction_winning_options: { option_id: string }[]; // <-- ADICIONADO AQUI
  bets: Bet[];
}

type FilterStatus = "ALL" | "OPEN" | "CLOSED" | "RESOLVED";
type SortOption = "newest" | "closing_soon" | "most_muli" | "most_bets";

export function PredictionsList({
  predictions,
  userBets,
  currentUserId,
  userBalance,
}: PredictionsListProps) {
  const [filter, setFilter] = useState<FilterStatus>("OPEN");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const sortLabels: Record<SortOption, string> = {
    newest: "Mais recentes",
    closing_soon: "Encerrando em breve",
    most_muli: "Mais Muli acumulados",
    most_bets: "Mais apostadores",
  };

  // 1. Filtra por status
  const filteredPredictions = predictions.filter((p) => {
    if (filter === "ALL") return true;
    return p.status === filter;
  });

  // 2. Ordena o array filtrado
  const sortedPredictions = [...filteredPredictions].sort((a, b) => {
    const totalMuliA = a.bets.reduce((sum, bet) => sum + bet.amount, 0);
    const totalMuliB = b.bets.reduce((sum, bet) => sum + bet.amount, 0);
    const betsCountA = a.bets.length;
    const betsCountB = b.bets.length;

    switch (sortBy) {
      case "newest":
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "closing_soon":
        return (
          new Date(a.closes_at).getTime() - new Date(b.closes_at).getTime()
        );
      case "most_muli":
        return totalMuliB - totalMuliA;
      case "most_bets":
        return betsCountB - betsCountA;
      default:
        return 0;
    }
  });

  const counts = {
    ALL: predictions.length,
    OPEN: predictions.filter((p) => p.status === "OPEN").length,
    CLOSED: predictions.filter((p) => p.status === "CLOSED").length,
    RESOLVED: predictions.filter((p) => p.status === "RESOLVED").length,
  };

  const tabs: { value: FilterStatus; label: string; icon: typeof Target }[] = [
    { value: "OPEN", label: "Abertas", icon: Clock },
    { value: "CLOSED", label: "Encerradas", icon: XCircle },
    { value: "RESOLVED", label: "Resolvidas", icon: CheckCircle2 },
    { value: "ALL", label: "Todas", icon: Target },
  ];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Previsões</h1>
          <p className="mt-1 text-muted-foreground">
            Explore as previsões da comunidade ou crie a sua própria.
          </p>
        </div>
        {currentUserId && (
          <Link href="/predictions/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar previsão
            </Button>
          </Link>
        )}
      </div>

      {/* Controles: Tabs + Ordenação */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = filter === tab.value;
            return (
              <Button
                key={tab.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(tab.value)}
                className="gap-2 whitespace-nowrap"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className="ml-1 h-5 min-w-5 px-1.5"
                >
                  {counts[tab.value]}
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Dropdown de Ordenação */}
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as SortOption)}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{sortLabels[sortBy]}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Mais recentes</span>
              </div>
            </SelectItem>
            <SelectItem value="closing_soon">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>Encerrando em breve</span>
              </div>
            </SelectItem>
            <SelectItem value="most_muli">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                <span>Mais Muli acumulados</span>
              </div>
            </SelectItem>
            <SelectItem value="most_bets">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Mais apostadores</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {sortedPredictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Target className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Nenhuma previsão encontrada</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === "OPEN"
              ? "Não há previsões abertas no momento."
              : filter === "ALL"
                ? "Ainda não há previsões. Seja o primeiro a criar!"
                : `Não há previsões ${filter === "CLOSED" ? "encerradas" : "resolvidas"}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPredictions.map((prediction) => (
            <PredictionCard
              key={prediction.id}
              prediction={prediction}
              userBet={userBets.find((b) => b.prediction_id === prediction.id)}
              currentUserId={currentUserId}
              userBalance={userBalance}
            />
          ))}
        </div>
      )}
    </div>
  );
}
