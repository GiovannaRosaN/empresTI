---
name: imagens-equipamentos
description: Busca, normaliza, revisa e publica imagens ilustrativas do catálogo EmpresTI usando Pixabay e Supabase Storage local.
---

# Imagens de equipamentos

## Antes de executar

1. Leia `docs/specs/imagens-equipamentos.md` e `docs/specs/002-dados-iniciais.md`.
2. Use `equipment.json` como a fonte compartilhada de patrimônios, categorias,
   condições e consultas. Não mantenha uma lista paralela nos scripts.
3. Configure `PIXABAY_API_KEY` em `.env.local` para baixar fotos. Use uma chave
   ativa e nunca a copie para o repositório, logs ou metadados. O arquivo
   `.env.local` é ignorado pelo Git; `.env.example` contém somente o nome da
   variável sem valor.
4. Os scripts de Storage só aceitam endpoints Supabase locais. Não use URL ou
   credencial de projeto remoto.

## Fluxo operacional

1. Baixe uma foto candidata por comando, evitando consultas/downloads em massa
   proibidos pela API Pixabay:

   ```powershell
   node skills\imagens-equipamentos\scripts\download.mjs TI-0001
   ```

   Para escolher uma foto específica retornada pela busca Pixabay, informe seu
   ID, por exemplo `--photo-id=123456`. Um item previamente aprovado não pode
   ser substituído pelo downloader. A busca é armazenada localmente por 24
   horas; respeite os limites e a licença da API.

2. Gere a folha de contato:

   ```powershell
   node skills\imagens-equipamentos\scripts\contact-sheet.mjs
   ```

3. Abra `skills\imagens-equipamentos\generated\contact-sheet.jpg` e revise
   cada item conforme `references\aceite-visual.md`. A inspeção é humana; a
   resposta da API não garante ausência de rostos, logos ou telas ligadas.

4. Registre a decisão de cada imagem:

   ```powershell
   node skills\imagens-equipamentos\scripts\review.mjs TI-0001 approved
   node skills\imagens-equipamentos\scripts\review.mjs TI-0002 rejected
   ```

   Rejeitadas devem ser substituídas e revisadas novamente. A aprovação só
   vale para o `photoId` atualmente registrado no manifesto.

5. Configure `SUPABASE_STORAGE_BUCKET` com o nome de um bucket público já
   criado no Supabase local. Configure `SUPABASE_SERVICE_ROLE_KEY` somente no
   ambiente local e envie imagens após todas as 12 estarem aprovadas:

   ```powershell
   node skills\imagens-equipamentos\scripts\upload.mjs
   ```

6. Confirme as URLs registradas em `generated\manifest.json`. O uploader
   interrompe a execução se qualquer item estiver pendente/rejeitado, se o
   bucket não existir ou não for público, ou se o host Supabase não for local.

## Saída e atribuição

- Fotos: `generated\images\<patrimonio>.jpg`, exatamente 800 × 600 pixels.
- Folha de contato: `generated\contact-sheet.jpg`.
- Manifesto: `generated\manifest.json`, incluindo ID e URL do fotógrafo,
  URL-fonte Pixabay, query, dimensões, estado de revisão e URL pública quando
  publicada.
- As imagens são ilustrativas e não garantem correspondência com modelo físico.
- Exiba a atribuição Pixabay quando apresentar resultados de busca; mantenha
  `user` e `pageURL` disponíveis junto aos metadados da imagem usada.
