"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ demoMode }: { demoMode: boolean }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form aria-labelledby="login-title" className="flex w-full max-w-[372px] flex-col gap-[18px]" action={formAction}>
      <div className="flex flex-col gap-2">
        <h2 className="text-[22px] font-semibold text-copy" id="login-title">Entrar</h2>
        <p className="text-[13px] text-muted">
          {demoMode ? "Acesso público temporário. Use qualquer e-mail e senha." : "Acesse com sua conta corporativa."}
        </p>
      </div>
      <label className="flex flex-col gap-2 text-xs text-loaned" htmlFor="email">
        E-mail
        <input
          className="h-[42px] w-full rounded-lg border border-edge-strong bg-sunken px-3 text-sm text-copy placeholder:text-faint"
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="nome@empresa.com"
          required
        />
      </label>
      <label className="flex flex-col gap-2 text-xs text-loaned" htmlFor="password">
        Senha
        <input
          className="h-[42px] w-full rounded-lg border border-edge-strong bg-sunken px-3 text-sm text-copy placeholder:text-faint"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          required
        />
      </label>
      {state.error && (
        <p className="text-[13px] text-[#f0a0a5]" role="alert">
          {state.error}
        </p>
      )}
      <button
        className="flex h-11 items-center justify-center gap-2 rounded-lg border border-action bg-transparent px-5 font-semibold text-action-text transition-colors hover:bg-[rgba(91,127,224,0.12)] hover:text-[#eef2fe] disabled:opacity-[0.45]"
        type="submit"
        disabled={pending}
      >
        {pending ? "Entrando..." : demoMode ? "Entrar na demonstração" : "Entrar"}
        {!pending && <i className="ph ph-arrow-right" aria-hidden="true" />}
      </button>
      <div className="h-px bg-[linear-gradient(to_right,transparent,#222c4a_48px,#222c4a_calc(100%-48px),transparent)]" />
      <p className="text-center text-xs leading-5 text-faint" id="login-support-note">
        {demoMode
          ? "Modo de demonstração: as credenciais não são verificadas."
          : "Acesso restrito a contas cadastradas pela equipe."}
      </p>
    </form>
  );
}
