/** @format */

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Coins,
  Search,
  ArrowRight,
  X,
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
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Recipient {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface TransferFormProps {
  currentUserId: string;
  balance: number;
}

function formatError(code: string): string {
  switch (code) {
    case "not_authenticated":
      return "Você precisa estar logado para transferir.";
    case "recipient_required":
      return "Informe o username do destinatário.";
    case "recipient_not_found":
      return "Usuário não encontrado. Verifique o username.";
    case "cannot_transfer_to_self":
      return "Você não pode transferir Muli para si mesmo.";
    case "insufficient_balance":
      return "Saldo insuficiente para esta transferência.";
    case "invalid_amount":
      return "Valor inválido. Deve ser maior que zero.";
    default:
      return "Não foi possível realizar a transferência. Tente novamente.";
  }
}

export function TransferForm({ currentUserId, balance }: TransferFormProps) {
  const router = useRouter();

  const [recipientUsername, setRecipientUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);

  // Novos estados para o autocomplete
  const [suggestions, setSuggestions] = useState<Recipient[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const numericAmount = parseInt(amount, 10);
  const isValidAmount = !isNaN(numericAmount) && numericAmount > 0;
  const exceedsBalance = isValidAmount && numericAmount > balance;

  // Fecha o dropdown se clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleUsernameChange(value: string) {
    setRecipientUsername(value);
    const trimmed = value.trim().toLowerCase();

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!trimmed) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      // Não limpamos o recipient imediatamente para não perder a seleção se o usuário apagar um caractere por engano,
      // mas se limpar tudo, limpamos.
      if (value === "") {
        setRecipient(null);
      }
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      const supabase = createClient();

      //   console.log("🔍 Buscando username parecido com:", trimmed);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .ilike("username", `%${trimmed}%`)
        .neq("id", currentUserId)
        .limit(5);

      //   console.log("✅ Resultado do banco:", { data, error });

      setSearching(false);

      if (!error && data && data.length > 0) {
        setSuggestions(data);
        setIsDropdownOpen(true);
      } else {
        setSuggestions([]);
        setIsDropdownOpen(false);
      }
    }, 400);
  }

  function handleSelectSuggestion(user: Recipient) {
    setRecipient(user);
    setRecipientUsername(user.username); // Preenche o input com o nome exato
    setSuggestions([]);
    setIsDropdownOpen(false);
    setError("");
  }

  function clearSelection() {
    setRecipient(null);
    setRecipientUsername("");
    setSuggestions([]);
    setIsDropdownOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!recipient) {
      setError("Selecione um destinatário válido da lista.");
      return;
    }

    if (!isValidAmount) {
      setError("Informe um valor válido.");
      return;
    }

    if (exceedsBalance) {
      setError("Saldo insuficiente.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.rpc("transfer_muli", {
      p_to_username: recipient.username,
      p_amount: numericAmount,
    });

    setLoading(false);

    if (error) {
      setError(formatError(error.message));
      return;
    }

    setSuccess(true);
    setAmount("");
    clearSelection();
    router.refresh(); // Atualiza o saldo na navbar
  }

  const quickAmounts = [10, 50, 100, 500];

  const [inputPosition, setInputPosition] = useState({
    top: 0,
    left: 0,
    height: 0,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Atualiza a posição do input quando o dropdown abre
  useEffect(() => {
    if (isDropdownOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setInputPosition({
        top: rect.top,
        left: rect.left,
        height: rect.height,
      });
    }
  }, [isDropdownOpen, suggestions]);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Transferir Muli
            </h1>
            <p className="mt-1 text-muted-foreground">
              Envie Muli para outros usuários da comunidade.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Saldo atual */}
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-muted-foreground">Seu saldo atual</p>
              <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                <Coins className="h-5 w-5" />
                {balance.toLocaleString()} Muli
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mensagens */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Transferência realizada com sucesso!
            </AlertDescription>
          </Alert>
        )}

        {/* Destinatário com Autocomplete */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Destinatário</CardTitle>
            <CardDescription>
              Digite o username e selecione o usuário na lista.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Username</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="recipient"
                  ref={inputRef}
                  type="text"
                  value={recipientUsername}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Digite para buscar..."
                  className={`pl-9 pr-10 ${recipient ? "border-green-500 focus-visible:ring-green-500" : ""}`}
                  autoComplete="off"
                />
                {recipient ? (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : searching ? (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : null}
              </div>
            </div>

            {/* Preview do destinatário selecionado */}
            {recipient && (
              <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 p-3 dark:bg-green-950/20">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={recipient.avatar_url || undefined}
                    alt={recipient.username}
                  />
                  <AvatarFallback>
                    {recipient.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {recipient.display_name || recipient.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{recipient.username}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dropdown renderizado fora do Card para evitar problemas de z-index */}
        {isDropdownOpen && suggestions.length > 0 && (
          <div
            className="fixed z-[9999] mt-1 w-[calc(100%-2rem)] max-w-[32rem] rounded-md border bg-popover text-popover-foreground shadow-lg max-h-60 overflow-auto"
            style={{
              top: `${inputPosition.top + inputPosition.height}px`,
              left: `${inputPosition.left}px`,
            }}
          >
            {suggestions.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelectSuggestion(user)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.avatar_url || undefined}
                    alt={user.username}
                  />
                  <AvatarFallback>
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {user.display_name || user.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    @{user.username}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Valor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Valor</CardTitle>
            <CardDescription>Quantos Muli você quer enviar?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Quantidade</Label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  max={balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="pl-9"
                  required
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((qa) => (
                  <Button
                    key={qa}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(qa))}
                    disabled={qa > balance}
                  >
                    {qa}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(String(balance))}
                >
                  Máximo
                </Button>
              </div>

              {exceedsBalance && (
                <p className="text-sm text-destructive">
                  Saldo insuficiente. Você tem {balance.toLocaleString()} Muli.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview da transferência */}
        {recipient && isValidAmount && !exceedsBalance && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Confirmação</CardTitle>
              <CardDescription>
                Revise os dados antes de confirmar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={recipient.avatar_url || undefined}
                      alt={recipient.username}
                    />
                    <AvatarFallback>
                      {recipient.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {recipient.display_name || recipient.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{recipient.username}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-right">
                  <div className="flex items-center gap-1 text-lg font-bold text-primary">
                    <Coins className="h-5 w-5" />
                    {numericAmount.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Muli</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão de enviar */}
        <Button
          type="submit"
          className="w-full"
          disabled={loading || !recipient || !isValidAmount || exceedsBalance}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading
            ? "Enviando..."
            : recipient && isValidAmount && !exceedsBalance
              ? `Enviar ${numericAmount.toLocaleString()} Muli`
              : "Transferir Muli"}
        </Button>
      </form>
    </div>
  );
}
