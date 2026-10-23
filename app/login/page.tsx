import { LoginForm } from "./login-form";
import { isDemoAccessEnabled } from "@/lib/demo-access";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const demoMode = isDemoAccessEnabled();

  return (
    <main
      className="grid min-h-screen bg-bg lg:grid-cols-[560px_minmax(0,1fr)]"
      data-screen-label="01 Login"
    >
      <section className="flex min-h-[420px] flex-col justify-between bg-[linear-gradient(160deg,#001449_0%,#00102f_60%,#080c1a_100%)] p-8 sm:p-14 lg:min-h-screen">
        <div className="flex items-center gap-3 text-copy">
          <span className="grid size-[34px] place-items-center rounded-lg bg-[#001449] text-action-light shadow-[0_0_0_1px_#25408f]">
            <i className="ph ph-package text-lg" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-[0.02em]">EmpresTI</span>
        </div>
        <div className="flex max-w-lg flex-col gap-4 py-12 lg:py-0">
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
        <span className="text-[11px] text-[#5e6884]">Operações · v1</span>
      </section>
      <section className="grid place-items-center px-6 py-14 sm:px-10 lg:px-14">
        <LoginForm demoMode={demoMode} />
      </section>
    </main>
  );
}