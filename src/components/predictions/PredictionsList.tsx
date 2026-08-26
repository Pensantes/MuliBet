/** @format */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Target, CheckCircle2, Clock, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PredictionCard } from "./PredictionCard";

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

export interface Prediction {
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

interface PredictionsListProps {
  predictions: Prediction[];
  userBets: UserBet[];
  currentUserId: string | null;
}

type FilterStatus = "ALL" | "OPEN" | "CLOSED" | "RESOLVED";

export function PredictionsList({
  predictions,
  userBets,
  currentUserId,
}: PredictionsListProps) {
  const [filter, setFilter] = useState<FilterStatus>("OPEN");

  const filteredPredictions = predictions.filter((p) => {
    if (filter === "ALL") return true;
    return p.status === filter;
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

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = filter === tab.value;
          return (
            <Button
              key={tab.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(tab.value)}
              className="gap-2"
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

      {/* Lista */}
      {filteredPredictions.length === 0 ? (
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
          {currentUserId && filter === "ALL" && (
            <Link href="/predictions/new" className="mt-4">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira previsão
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4 gap-4 flex flex-col">
          {filteredPredictions.map((prediction) => (
            <PredictionCard
              key={prediction.id}
              prediction={prediction}
              userBet={userBets.find((b) => b.prediction_id === prediction.id)}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
