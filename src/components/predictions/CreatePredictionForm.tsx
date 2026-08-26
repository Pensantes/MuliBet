/** @format */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Target,
  CalendarClock,
  ListOrdered,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_OPTION_LENGTH = 100;

function formatError(code: string): string {
  switch (code) {
    case "not_authenticated":
      return "Você precisa estar logado para criar uma previsão.";
    case "title_required":
      return "O título é obrigatório.";
    case "title_too_long":
      return `O título pode ter no máximo ${MAX_TITLE_LENGTH} caracteres.`;
    case "description_too_long":
      return `A descrição pode ter no máximo ${MAX_DESCRIPTION_LENGTH} caracteres.`;
    case "closes_at_invalid":
      return "A data limite precisa ser no futuro.";
    case "min_options":
      return `Crie pelo menos ${MIN_OPTIONS} opções.`;
    case "max_options":
      return `Você pode criar no máximo ${MAX_OPTIONS} opções.`;
    case "empty_option":
      return "As opções não podem estar vazias.";
    case "option_too_long":
      return `Cada opção pode ter no máximo ${MAX_OPTION_LENGTH} caracteres.`;
    case "duplicate_option":
      return "As opções precisam ser diferentes entre si.";
    default:
      return "Não foi possível criar a previsão. Tente novamente.";
  }
}

export function CreatePredictionForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateOption(index: number, value: string) {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function addOption() {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): string | null {
    if (!title.trim()) return "title_required";
    if (title.trim().length > MAX_TITLE_LENGTH) return "title_too_long";
    if (description.length > MAX_DESCRIPTION_LENGTH)
      return "description_too_long";

    if (!closesAt) return "closes_at_invalid";
    const closesDate = new Date(closesAt);
    if (closesDate.getTime() <= Date.now() + 60_000) return "closes_at_invalid";

    if (options.length < MIN_OPTIONS) return "min_options";
    if (options.length > MAX_OPTIONS) return "max_options";

    const seen = new Set<string>();
    for (const opt of options) {
      const trimmed = opt.trim();
      if (!trimmed) return "empty_option";
      if (trimmed.length > MAX_OPTION_LENGTH) return "option_too_long";

      const key = trimmed.toLowerCase();
      if (seen.has(key)) return "duplicate_option";
      seen.add(key);
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(formatError(validationError));
      return;
    }

    setLoading(true);

    const closesAtDate = new Date(closesAt);
    // console.log("Enviando:", {
    //   closesAt_input: closesAt,
    //   closesAt_date: closesAtDate,
    //   closesAt_iso: closesAtDate.toISOString(),
    //   agora_local: new Date().toString(),
    //   agora_iso: new Date().toISOString(),
    // });

    const supabase = createClient();

    const { data, error } = await supabase.rpc("create_prediction", {
      p_title: title.trim(),
      p_description: description.trim() || null,
      p_closes_at: closesAtDate.toISOString(),
      p_options: options.map((o) => o.trim()),
    });

    setLoading(false);

    if (error) {
      console.error("Erro da RPC:", error);
      setError(formatError(error.message));
      return;
    }

    router.push(`/predictions/${data}`);
    router.refresh();
  }

  // data mínima = agora + 1 minuto, no formato que datetime-local aceita (hora local)
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/predictions"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para previsões
        </Link>

        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Criar previsão
            </h1>
            <p className="mt-1 text-muted-foreground">
              Defina a pergunta, as opções e até quando a comunidade pode
              apostar.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Detalhes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalhes</CardTitle>
            <CardDescription>
              Sobre o que as pessoas vão apostar?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Quem vai ganhar o campeonato?"
                required
                maxLength={MAX_TITLE_LENGTH}
              />
              <p className="text-xs text-muted-foreground text-right">
                {title.length}/{MAX_TITLE_LENGTH}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contexto, regras, como o vencedor será definido..."
                rows={4}
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closesAt" className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Data limite para apostas
              </Label>
              <Input
                id="closesAt"
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                min={minDateTime}
                required
              />
              <p className="text-xs text-muted-foreground">
                Depois dessa data, ninguém pode mais apostar.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Opções */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListOrdered className="h-5 w-5" />
              Opções de resposta
            </CardTitle>
            <CardDescription>
              Adicione pelo menos {MIN_OPTIONS} opções. A ordem importa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-start gap-2">
                <Badge
                  variant="secondary"
                  className="mt-2 h-8 shrink-0 px-2.5 font-mono"
                >
                  {String.fromCharCode(65 + index)}
                </Badge>
                <div className="flex-1">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Opção ${String.fromCharCode(65 + index)}`}
                    maxLength={MAX_OPTION_LENGTH}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeOption(index)}
                  disabled={options.length <= MIN_OPTIONS}
                  aria-label="Remover opção"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              disabled={options.length >= MAX_OPTIONS}
              className="mt-2"
            >
              <Plus className="mr-1 h-4 w-4" />
              Adicionar opção
            </Button>

            <p className="text-xs text-muted-foreground">
              {options.length}/{MAX_OPTIONS} opções
            </p>
          </CardContent>
        </Card>

        {/* Preview rápido */}
        {(title.trim() || options.some((o) => o.trim())) && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Prévia</CardTitle>
              <CardDescription>
                É assim que sua previsão vai aparecer no feed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <h3 className="font-semibold">
                {title.trim() || "Título da previsão"}
              </h3>
              {description.trim() && (
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {description.trim()}
                </p>
              )}
              <div className="space-y-2 pt-2">
                {options.map(
                  (opt, i) =>
                    opt.trim() && (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                      >
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px]"
                        >
                          {String.fromCharCode(65 + i)}
                        </Badge>
                        <span>{opt.trim()}</span>
                      </div>
                    ),
                )}
              </div>
              {closesAt && (
                <p className="text-xs text-muted-foreground pt-2">
                  Encerra em {new Date(closesAt).toLocaleString("pt-BR")}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/predictions">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Criando..." : "Criar previsão"}
          </Button>
        </div>
      </form>
    </div>
  );
}
