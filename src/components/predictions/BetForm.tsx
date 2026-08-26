/** @format */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Coins, Loader2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface Option {
  id: string;
  label: string;
}

interface BetFormProps {
  predictionId: string;
  options: Option[];
  userBalance: number;
}

function formatError(code: string): string {
  switch (code) {
    case "not_authenticated":
      return "Você precisa estar logado para apostar.";
    case "prediction_not_found":
      return "Esta previsão não existe mais.";
    case "prediction_not_open":
      return "Esta previsão não está mais aberta para apostas.";
    case "invalid_option":
      return "Opção inválida.";
    case "already_bet":
      return "Você já apostou nesta previsão.";
    case "insufficient_balance":
      return "Saldo insuficiente de Muli.";
    case "invalid_amount":
      return "Valor de aposta inválido.";
    default:
      return "Não foi possível realizar a aposta. Tente novamente.";
  }
}

const MIN_BET = 1;

export function BetForm({ predictionId, options, userBalance }: BetFormProps) {
  const router = useRouter();

  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const numericAmount = parseInt(amount, 10);
  const isValidAmount = !isNaN(numericAmount) && numericAmount >= MIN_BET;
  const exceedsBalance = isValidAmount && numericAmount > userBalance;

  const quickAmounts = [10, 50, 100, 500];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedOptionId) {
      setError("Selecione uma opção.");
      return;
    }

    if (!isValidAmount) {
      setError(`O valor mínimo é ${MIN_BET} Muli.`);
      return;
    }

    if (exceedsBalance) {
      setError("Saldo insuficiente.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.rpc("place_bet", {
      p_prediction_id: predictionId,
      p_option_id: selectedOptionId,
      p_amount: numericAmount,
    });

    setLoading(false);

    if (error) {
      setError(formatError(error.message));
      return;
    }

    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coins className="h-5 w-5 text-primary" />
          Fazer aposta
        </CardTitle>
        <CardDescription>
          Escolha uma opção e quanto quer apostar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Seleção de opção */}
          <div className="space-y-2">
            <Label>Escolha uma opção</Label>
            <div className="space-y-2">
              {options.map((opt, index) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOptionId(opt.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    selectedOptionId === opt.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selectedOptionId === opt.id
                        ? "border-primary"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {selectedOptionId === opt.id && (
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {String.fromCharCode(65 + index)}
                  </Badge>
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor da aposta</Label>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min={MIN_BET}
                max={userBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="pl-9"
                required
              />
            </div>

            {/* Quick amounts */}
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((qa) => (
                <Button
                  key={qa}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(String(qa))}
                  disabled={qa > userBalance}
                >
                  {qa}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(String(userBalance))}
              >
                Máximo
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Valor mínimo: {MIN_BET} Muli</span>
              <span>
                Seu saldo:{" "}
                <span
                  className={
                    exceedsBalance ? "font-medium text-destructive" : ""
                  }
                >
                  {userBalance.toLocaleString()} Muli
                </span>
              </span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              loading || !selectedOptionId || !isValidAmount || exceedsBalance
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading
              ? "Apostando..."
              : `Apostar ${
                  isValidAmount ? numericAmount.toLocaleString() : "..."
                } Muli`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
