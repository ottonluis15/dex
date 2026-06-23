# Dex Advocacia

Sistema para gestão de escritório de advocacia. O projeto hoje combina uma interface HTML/CSS/JS funcional usando `localStorage` com uma base de backend em Next.js, Prisma e NextAuth ainda em processo de integracao.

## Como rodar

```powershell
npm.cmd install
npm.cmd run dev
```

Para usar o prototipo estatico diretamente:

- `site/index.html`: landing page
- `app/register.html`: cadastro local de escritorio
- `app/login.html`: acesso ao painel

## Variaveis de ambiente

Copie `.env.example` para `.env` e ajuste os valores antes de usar Prisma, NextAuth ou envio de e-mail.

## Scripts uteis

```powershell
npm.cmd run build
npm.cmd run db:generate
npm.cmd run db:push
npm.cmd run db:studio
```

## Observacoes

- A interface atual salva dados no navegador via `localStorage`; isso serve para demo, mas não para produção.
- O schema Prisma em `prisma/schema.prisma` ja modela escritorios, usuarios, clientes, processos, financeiro, documentos e notificacoes.
- O proximo passo natural e conectar as telas a rotas/API com Prisma e substituir senhas em texto puro por autenticacao via NextAuth.
