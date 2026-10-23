"use server";

import { redirect } from "next/navigation";
import { isDemoAccessEnabled } from "@/lib/demo-access";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
};

export async function signIn(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return { error: "Informe seu e-mail e sua senha." };
  }

  if (isDemoAccessEnabled()) {
    redirect("/catalogo");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    if (error.status === 400) {
      return { error: "E-mail ou senha inválidos." };
    }
    return { error: "Não foi possível autenticar agora. Tente novamente." };
  }

  redirect("/catalogo");
}
