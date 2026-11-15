# Finanças da Casa

Aplicativo web para controlar as despesas pessoais, da casa e da esposa. Segue a mesma estrutura do sistema de gestão do escritório (Next.js + Prisma/SQLite + Tailwind, uma página por área, formulários com server actions).

## Stack

- Next.js (App Router) + TypeScript
- Prisma ORM + SQLite (driver adapter `@prisma/adapter-better-sqlite3`)
- Tailwind CSS

## Como rodar

```bash
npm install                # também gera o Prisma Client (postinstall)
cp .env.example .env
npx prisma migrate deploy  # cria (ou atualiza) o banco SQLite com o schema
npm run dev
```

Acesse http://localhost:3100 (porta diferente da do sistema do escritório, para os dois rodarem juntos).

Com o banco vazio, **Configurações → Carregar dados de exemplo** preenche seis meses de gastos fictícios.

## Como o gasto do mês é calculado

O gasto de um mês é a soma de: gastos avulsos do mês, contas fixas **pagas** naquele mês e a parcela do mês de cada compra parcelada — ver `lib/financas.ts`. As entradas do mês são as entradas avulsas mais as entradas fixas **confirmadas**; o saldo do mês é entradas menos gastos. Tudo pode ser visto por **visão**: Família (soma), Eu, Esposa ou Casa.

## Modelo de dados

- **Gasto**: descrição, categoria, valor, data e de quem é (Eu, Esposa ou Casa).
- **Entrada**: dinheiro que entrou em uma data (renda extra, reembolso), com tipo e de quem é.
- **EntradaFixa** + **RecebimentoEntrada**: entrada mensal (salário), que só conta no mês depois de confirmada; mesma lógica das contas fixas.
- **ContaFixa** + **PagamentoConta**: conta mensal com dia de vencimento; cada pagamento guarda o valor da época, então mudar o valor da conta não altera meses já pagos. Encerrar uma conta mantém o histórico.
- **CompraParcelada**: valor da parcela, número de parcelas e mês da primeira; cada parcela entra sozinha no mês correspondente.
- **Orcamento**: valor mensal por pessoa (o da família é a soma).
- **LimiteCategoria**: limite mensal por categoria, próprio de cada visão.
- **Reserva** e **Meta**: valores guardados, informados à mão (não são calculados a partir das entradas).

## Telas

- **Resumo** (`/`): gasto do mês contra o orçamento, quanto dá para gastar por dia, balanço do mês (entradas, saídas e saldo), gasto por pessoa, últimos 6 meses, categorias com limites, contas do mês (com botão Pagar), parcelas, reserva e metas.
- **Lançamentos**: tudo o que entrou no mês (gastos, contas pagas e parcelas), com busca e filtro por categoria; cadastro e edição de gastos.
- **Entradas**: entradas fixas do mês (com botão Confirmar), entradas avulsas e saldo do mês.
- **Contas fixas**: situação do mês (paga, vencida, vence hoje, a vencer), cadastro, edição e encerramento.
- **Parcelados**: compras em andamento e quitadas.
- **Orçamento e limites**: orçamento por pessoa e limites por categoria de cada visão.
- **Metas e reserva**: reserva de emergência em meses de gastos e metas com prazo opcional.
- **Importar extrato**: fatura do cartão ou extrato em PDF, CSV ou OFX, com revisão das linhas antes de gravar. O arquivo é lido no navegador. CSV/OFX: `lib/extrato.ts`. PDF: `lib/extrato-pdf.ts` tira o texto do PDF e procura linhas com data, descrição e valor (funciona por padrão de texto, não por banco; PDF digitalizado como imagem não é lido; PDF com senha pede a senha).
- **Configurações**: dados de exemplo, cópia de segurança e apagar tudo.

## Cópia de segurança

`npm run backup` grava uma cópia do `dev.db` em `backups/` e, com `BACKUP_ONEDRIVE_DIR` definido no `.env`, também na pasta do OneDrive. Mantenha a pasta do projeto **fora** do OneDrive: sincronizar o banco em uso e o `node_modules` costuma corromper arquivos.
