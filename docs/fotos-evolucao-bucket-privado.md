# Fotos de evolução — fechar o bucket `progress-photos`

Status em 2026-07-31: **bucket ainda público**. O código já está pronto para o
bucket privado, mas o fechamento está bloqueado pelo item 1 abaixo.

## Situação

As fotos M0–M6 são de corpo em roupa íntima — dado pessoal sensível (LGPD).
Hoje o bucket `progress-photos` está com `public = true` e tem 99 objetos:
qualquer pessoa com o link abre a foto, sem sessão.

O app não entrega mais esses links. Toda leitura passa por
`GET /api/admin/patients/[id]/progress-photos/image-proxy?photo_id=<uuid>`,
que revalida sessão, papel e vínculo profissional–paciente a cada request e
baixa do storage com a service key (funciona com bucket público ou privado).

Autorização única em `lib/auth/patient-photos.ts`. Montagem da URL em
`lib/photos/proxy-url.ts` — **nunca** use `foto_url` direto em `<img src>`.

## Bloqueio: o bucket tem três donos

`progress-photos` não guarda só foto de evolução:

1. Fotos M0–M6, enviadas pela equipe (`fitness_progress_photos`) — cobertas
   pelo proxy.
2. Fotos avulsas do paciente (`hooks/use-photos.ts`), enviadas direto pelo
   cliente. Desde 2026-08-08 o paciente vê as próprias fotos por
   `GET /api/me/progress-photos/[photoId]` (monte a URL com
   `myProgressPhotoSrc`) — antes a galeria dele só mostrava emoji placeholder.
3. **Foto/PDF do InBody** (`app/api/inbody/analyze/route.ts`), com a URL
   pública gravada em `fitness_body_compositions.foto_url` e renderizada crua
   em `components/admin/patient/bioimpedance-section.tsx` (`<img>` e
   `<iframe>` para PDF).

O item 3 é o bloqueio. Hoje `count(*) where foto_url is not null = 0`, ou seja,
fechar o bucket **não quebra nenhum laudo existente** — mas o próximo upload de
InBody já nasce quebrado, e o proxy não cobre esse caso (ele valida contra
`fitness_progress_photos`, e PDF não passa no allowlist de content-type).

## Para fechar o bucket

1. Resolver o InBody. Preferível: bucket próprio (`inbody-scans`), migrando os
   objetos e as URLs gravadas. Alternativa: rota de leitura própria validando
   contra `fitness_body_compositions`, aceitando `application/pdf`.
2. ~~Decidir o fluxo de foto do paciente~~ — resolvido: o titular já lê as
   próprias fotos pela rota `/api/me/progress-photos/[photoId]`.
3. Só então, com o deploy do código já no ar:
   ```sql
   update storage.buckets set public = false where id = 'progress-photos';
   ```
4. Conferir: abrir a URL pública crua de uma foto em aba anônima deve dar
   400/404; a grade e a comparação devem continuar funcionando.

**Ordem importa.** O código novo precisa estar no ar antes do fechamento. Para
voltar atrás, reabra o bucket **antes** de reverter o deploy — com o bucket
fechado e o código antigo (que lia a URL pública), nenhuma foto carrega.

## Pendências conhecidas

- **Cache já gravado nos aparelhos.** Até este deploy as fotos eram servidas
  cross-origin e o workbox descartava match parcial cross-origin
  (`RegExpRoute.js`), então não entravam no cache do service worker. A URL do
  proxy é same-origin: por isso ela usa `photo_id` (não termina em `.webp`) e
  existe a regra `NetworkOnly` em `next.config.mjs`. Com `skipWaiting: false`,
  o SW novo só assume quando todas as abas fecharem.
- **Sem trilha de acesso.** O proxy é o ponto natural para registrar quem abriu
  a foto de quem. Hoje não registra nada, e com a service key o Supabase vê
  todos os downloads como o mesmo ator.
- **Sem política de retenção.** As fotos ficam para sempre, inclusive de quem
  saiu do programa.
- **Exclusão de conta: falta a etapa da equipe.** A tela não mente mais — em
  2026-08-08 `POST /api/account/delete` passou a registrar a solicitação em
  `fitness_lgpd_requests` (type `deletion`) e cortar o acesso na hora
  (`is_active = false` + ban), como manda a política publicada em
  `/privacidade` ("removidos em até 30 dias, exceto quando a retenção for
  exigida por lei"). Antes disso a tela chamava 10 tabelas das quais 8 não
  existiam, e o `fitness_profiles` não tem policy de DELETE — ou seja, não
  apagava absolutamente nada e ainda assim dizia "conta excluída com sucesso".

  **Falta construir a conclusão do pedido pela equipe**: apagar os objetos do
  storage (`progress-photos/<user_id>/` e a foto de perfil) e as linhas do
  banco. Isso depende de uma decisão que é do Leonardo, não de engenharia:
  apagar o perfil cascateia em 22 tabelas e leva junto prontuário,
  bioimpedância e avaliações — que têm retenção obrigatória (CFM, 20 anos).
  Enquanto essa decisão não existir, o pedido fica `pending` e ninguém
  conclui. Atenção também a `fitness_professional_notes.patient_id`, que é
  `NO ACTION` e bloqueia a exclusão do perfil se houver nota.
- **Miniaturas.** A grade exibe células de 120px carregando o WebP de 1080px
  (~200 KB × 28). Gerar `thumb_url` no upload cortaria ~90% do tráfego.
