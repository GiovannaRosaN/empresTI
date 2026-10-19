import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-bg lg:grid-cols-[560px_1fr]">
      <section className="flex min-h-[420px] flex-col justify-between bg-[linear-gradient(160deg,#001449_0%,#00102f_60%,#080c1a_100%)] p-8 sm:p-14">
        <Link className="flex items-center gap-3 text-copy" href="/catalogo">
          <span className="grid size-9 place-items-center rounded-lg bg-[#001449] text-action-light shadow-[0_0_0_1px_#25408f]">
            <i className="ph ph-package text-lg" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-[0.02em]">EmpresTI</span>
        </Link>
        <div className="flex max-w-lg flex-col gap-5 py-12 lg:py-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8aa6ee]">Operações · v1</p>
          <h1 className="max-w-[20ch] text-[34px] leading-[1.15] font-semibold tracking-[-0.01em] text-copy">
            Equipamentos disponíveis. Empréstimos sob controle.
          </h1>
          <p className="max-w-[38ch] text-sm leading-6 text-[#93a0c6]">
            Consulte o catálogo interno e acompanhe os itens em uso pela equipe.
          </p>
          <div className="h-px w-full bg-[linear-gradient(to_right,#3c5dbe,transparent)]" />
          <div className="flex gap-10">
            <div className="flex flex-col gap-1"><strong className="text-2xl font-semibold">3</strong><span className="text-xs text-[#93a0c6]">itens por pessoa</span></div>
            <div className="flex flex-col gap-1"><strong className="text-2xl font-semibold">14</strong><span className="text-xs text-[#93a0c6]">dias de prazo</span></div>
          </div>
        </div>
        <span className="text-[11px] text-[#5e6884]">Acesso interno</span>
      </section>
      <section className="grid place-items-center px-6 py-14">
        <form className="flex w-full max-w-[372px] flex-col gap-5" action="#">
          <div className="flex flex-col gap-2">
            <h2 className="text-[22px] font-semibold text-copy">Entrar</h2>
            <p className="text-[13px] text-muted">Acesse com sua conta corporativa.</p>
          </div>
          <label className="flex flex-col gap-2 text-xs text-loaned" htmlFor="email">
            E-mail
            <input className="h-[42px] rounded-lg border border-edge-strong bg-sunken px-3 text-sm text-copy placeholder:text-faint" id="email" name="email" type="email" autoComplete="username" placeholder="nome@empresa.com" required />
          </label>
          <label className="flex flex-col gap-2 text-xs text-loaned" htmlFor="password">
            Senha
            <input className="h-[42px] rounded-lg border border-edge-strong bg-sunken px-3 text-sm text-copy placeholder:text-faint" id="password" name="password" type="password" autoComplete="current-password" placeholder="Sua senha" required />
          </label>
          <button className="flex h-11 items-center justify-center gap-2 rounded-lg border border-action bg-transparent px-5 font-semibold text-action-text opacity-50" type="button" disabled title="A autenticação será conectada após configurar o Supabase.">
            Entrar <i className="ph ph-arrow-right" aria-hidden="true" />
          </button>
          <div className="h-px bg-[linear-gradient(to_right,transparent,#222c4a_48px,#222c4a_calc(100%-48px),transparent)]" />
          <p className="text-center text-xs leading-5 text-faint">Prévia visual. Autenticação Supabase ainda não conectada.</p>
        </form>
      </section>
    </main>
  );
}