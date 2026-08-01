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
   cliente. A galeria do paciente nunca exibiu a imagem (`photo-card.tsx`
   renderiza emoji placeholder), então o paciente não vê as próprias fotos.
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
2. Decidir o fluxo de foto do paciente (item 2 acima): ou dar a ele um caminho
   de leitura das próprias fotos, ou remover a coleta. Coletar dado sensível
   que o titular não consegue ver é o pior dos dois mundos na LGPD.
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
- **Exclusão de conta não apaga as fotos.** `app/(app)/configuracoes/conta`
  deleta de `progress_photos` — tabela que não existe (o nome correto é
  `fitness_progress_photos`). O supabase-js não lança nesse caso, então a tela
  diz "conta excluída" sem ter apagado nenhuma foto, e o objeto fica órfão no
  storage.
- **Miniaturas.** A grade exibe células de 120px carregando o WebP de 1080px
  (~200 KB × 28). Gerar `thumb_url` no upload cortaria ~90% do tráfego.
