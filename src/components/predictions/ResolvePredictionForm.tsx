/** @format */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Coins,
  Users,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

interface Bet {
  id: string;
  user_id: string;
  option_id: string;
  amount: number;
}

interface ResolvePredictionFormProps {
  predictionId: string;
  title: string;
  options: Option[];
  bets: Bet[];
}

function formatError(code: string): string {
  switch (code) {
    case "not_authenticated":
      return "Você precisa estar logado.";
    case "prediction_not_found":
      return "Esta previsão não existe mais.";
    case "not_creator":
      return "Apenas o criador pode resolver esta previsão.";
    case "prediction_not_closed":
      return "A previsão precisa estar encerrada para ser resolvida.";
    case "no_winning_options":
      return "Selecione pelo menos uma opção vencedora.";
    case "invalid_winning_option":
      return "Uma das opções selecionadas é inválida.";
    default:
      return "Não foi possível resolver a previsão. Tente novamente.";
  }
}

export function ResolvePredictionForm({
  predictionId,
  title,
  options,
  bets,
}: ResolvePredictionFormProps) {
  const router = useRouter();

  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const totalPool = bets.reduce((sum, b) => sum + b.amount, 0);

  function toggleOption(optionId: string) {
    setSelectedOptionIds((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId],
    );
  }

  // Calcula estatísticas pra preview
  const optionsStats = options.map((opt) => {
    const optionBets = bets.filter((b) => b.option_id === opt.id);
    const amount = optionBets.reduce((sum, b) => sum + b.amount, 0);
    const isSelected = selectedOptionIds.includes(opt.id);
    return { option: opt, count: optionBets.length, amount, isSelected };
  });

  const winnersPool = optionsStats
    .filter((s) => s.isSelected)
    .reduce((sum, s) => sum + s.amount, 0);
  // const losersPool = totalPool - winnersPool;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (selectedOptionIds.length === 0) {
      setError("Selecione pelo menos uma opção vencedora.");
      return;
    }

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.rpc("resolve_prediction", {
      p_prediction_id: predictionId,
      p_winning_option_ids: selectedOptionIds,
    });

    setLoading(false);

    if (error) {
      setError(formatError(error.message));
      return;
    }

    router.push(`/predictions/${predictionId}`);
    router.refresh();
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/predictions/${predictionId}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a previsão
        </Link>

        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Resolver previsão
            </h1>
            <p className="mt-1 text-muted-foreground">
              Selecione a(s) opção(ões) vencedora(s). Esta ação é irreversível.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Previsão */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>
              {bets.length} {bets.length === 1 ? "aposta" : "apostas"} no total
              de{" "}
              <span className="font-medium text-foreground">
                {totalPool.toLocaleString()} Muli
              </span>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Seleção de vencedoras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5" />
              Opções vencedoras
            </CardTitle>
            <CardDescription>
              Você pode selecionar uma ou mais opções. Todos que apostaram nas
              opções marcadas dividirão o pool dos perdedores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {optionsStats.map(
              ({ option, count, amount, isSelected }, index) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleOption(option.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg border p-4 text-left transition-colors ${
                    isSelected
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                      : "hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                        isSelected
                          ? "border-green-500 bg-green-500"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {String.fromCharCode(65 + index)}
                    </Badge>
                    <span className="font-medium">{option.label}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{count}</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <Coins className="h-4 w-4 text-primary" />
                      <span>{amount.toLocaleString()}</span>
                    </div>
                  </div>
                </button>
              ),
            )}
          </CardContent>
        </Card>

        {/* Preview da distribuição */}
        {selectedOptionIds.length > 0 && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Prévia da distribuição</CardTitle>
              <CardDescription>
                É assim que os Muli serão distribuídos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-lg bg-muted/50 p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xl font-bold">
                    <Coins className="h-4 w-4 text-primary" />
                    {totalPool.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Pool total</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">
                    {Math.floor(totalPool * 0.05).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Você recebe (5%)
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    {Math.floor(totalPool * 0.95).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pool disponível
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">
                    {winnersPool > 0
                      ? winnersPool.toLocaleString()
                      : totalPool.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {winnersPool > 0
                      ? "Pool dos vencedores"
                      : "Pool total (devolução)"}
                  </p>
                </div>
              </div>

              {winnersPool === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma das opções marcadas recebeu apostas. Você receberá{" "}
                  <span className="font-medium text-foreground">
                    {Math.floor(totalPool * 0.05).toLocaleString()} Muli
                  </span>{" "}
                  de taxa, e os outros 95% serão devolvidos proporcionalmente
                  para todos os apostadores.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Você receberá{" "}
                  <span className="font-medium text-foreground">
                    {Math.floor(totalPool * 0.05).toLocaleString()} Muli
                  </span>{" "}
                  de taxa. Os outros{" "}
                  <span className="font-medium text-foreground">
                    {Math.floor(totalPool * 0.95).toLocaleString()} Muli
                  </span>{" "}
                  serão divididos proporcionalmente entre os vencedores.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Confirmação */}
        {showConfirm && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> esta ação é irreversível. Após resolver,
              não será possível alterar as opções vencedoras nem desfazer as
              recompensas.
            </AlertDescription>
          </Alert>
        )}

        {/* Ações */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href={`/predictions/${predictionId}`}>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || selectedOptionIds.length === 0}
            className={
              showConfirm ? "bg-destructive hover:bg-destructive/90" : ""
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading
              ? "Resolvendo..."
              : showConfirm
                ? "Confirmar resolução"
                : "Resolver previsão"}
          </Button>
        </div>
      </form>
    </div>
  );
}
