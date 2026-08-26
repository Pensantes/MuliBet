/** @format */

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Target,
  Trophy,
  Gift,
  Calendar,
  Filter,
  X,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  SelectValue,
} from "@/components/ui/select";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  prediction_id: string | null;
  prediction_title: string | null;
  related_user_id: string | null;
  related_username: string | null;
  related_display_name: string | null;
  related_avatar_url: string | null;
  created_at: string;
}

interface Filters {
  from: string;
  to: string;
  type: string;
}

interface StatementClientProps {
  transactions: Transaction[];
  balance: number;
  filters: Filters;
}

const TRANSACTION_TYPES = [
  { value: "INITIAL_BALANCE", label: "Saldo inicial" },
  { value: "BET", label: "Apostas" },
  { value: "BET_WIN", label: "Ganhos em apostas" },
  { value: "TRANSFER_IN", label: "Transferências recebidas" },
  { value: "TRANSFER_OUT", label: "Transferências enviadas" },
];

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
    case "TRANSFER_IN":
      return {
        icon: ArrowDownLeft,
        label: "Transferência recebida",
        color: "text-green-600",
        bgColor: "bg-green-500/10",
      };
    case "TRANSFER_OUT":
      return {
        icon: ArrowUpRight,
        label: "Transferência enviada",
        color: "text-destructive",
        bgColor: "bg-destructive/10",
      };
    default:
      return {
        icon: FileText,
        label: "Transação",
        color: "text-muted-foreground",
        bgColor: "bg-muted",
      };
  }
}

function formatDateGroup(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) return "Hoje";
  if (isSameDay(date, yesterday)) return "Ontem";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StatementClient({
  transactions,
  balance,
  filters,
}: StatementClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Calcula totais do período
  const totalIn = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalOut = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const hasFilters = filters.from || filters.to || filters.type;

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/statement?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/statement");
  }

  function setQuickRange(range: "7d" | "30d" | "90d") {
    const now = new Date();
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);

    const from = new Date(now);
    from.setDate(
      from.getDate() - (range === "7d" ? 7 : range === "30d" ? 30 : 90),
    );
    from.setHours(0, 0, 0, 0);

    const params = new URLSearchParams(searchParams.toString());
    params.set("from", from.toISOString().slice(0, 16));
    params.set("to", to.toISOString().slice(0, 16));
    router.push(`/statement?${params.toString()}`);
  }

  // Agrupa transações por data
  const groupedTransactions = transactions.reduce<
    Record<string, Transaction[]>
  >((acc, t) => {
    const key = new Date(t.created_at).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Extrato</h1>
            <p className="mt-1 text-muted-foreground">
              Histórico completo de todas as suas movimentações.
            </p>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Saldo atual</p>
              <Coins className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold">
              {balance.toLocaleString()} Muli
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Entradas</p>
              <ArrowDownLeft className="h-4 w-4 text-green-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-green-600">
              +{totalIn.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Saídas</p>
              <ArrowUpRight className="h-4 w-4 text-destructive" />
            </div>
            <div className="mt-2 text-2xl font-bold text-destructive">
              -{totalOut.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Filtros</CardTitle>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>
          <CardDescription>
            Filtre por data ou tipo de transação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Atalhos rápidos */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange("7d")}
            >
              Últimos 7 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange("30d")}
            >
              Últimos 30 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange("90d")}
            >
              Últimos 3 meses
            </Button>
          </div>

          {/* Filtros manuais */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                De
              </Label>
              <Input
                type="datetime-local"
                value={filters.from}
                onChange={(e) => updateFilter("from", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                Até
              </Label>
              <Input
                type="datetime-local"
                value={filters.to}
                onChange={(e) => updateFilter("to", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Tipo</Label>
              <Select
                value={filters.type || "all"}
                onValueChange={(v: string | null) =>
                  updateFilter("type", v === "all" ? "" : v ? v : "")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {TRANSACTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de transações */}
      {transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">
              {hasFilters
                ? "Nenhuma transação encontrada"
                : "Sem movimentações ainda"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasFilters
                ? "Tente ajustar os filtros para ver outras transações."
                : "Suas transações aparecerão aqui assim que você começar a usar o MuliBet."}
            </p>
            {hasFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([dateKey, txs]) => (
            <div key={dateKey}>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground capitalize">
                {formatDateGroup(txs[0].created_at)}
              </h3>
              <Card>
                <CardContent className="divide-y p-0">
                  {txs.map((tx) => {
                    const info = getTransactionInfo(tx.type);
                    const Icon = info.icon;
                    const isPositive = tx.amount > 0;

                    // Contexto da transação
                    let context: React.ReactNode = null;
                    if (tx.prediction_title) {
                      context = (
                        <Link
                          href={`/predictions/${tx.prediction_id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          {tx.prediction_title}
                        </Link>
                      );
                    } else if (tx.related_username) {
                      const isOut = tx.type === "TRANSFER_OUT";
                      context = (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-4 w-4">
                            <AvatarImage
                              src={tx.related_avatar_url || undefined}
                              alt={tx.related_username}
                            />
                            <AvatarFallback className="text-[8px]">
                              {tx.related_username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {isOut ? "para" : "de"}{" "}
                            <span className="font-medium text-foreground">
                              {tx.related_display_name || tx.related_username}
                            </span>
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
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
                            {formatTime(tx.created_at)}
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
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
