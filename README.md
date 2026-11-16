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

O gasto de um mês é a soma de: gastos avulsos do mês, contas fixas **pagas** naquele mês, a parcela do mês de cada compra parcelada e os **pagamentos de fatura de cartão** feitos no mês — ver `lib/financas.ts`. **Compras no cartão de crédito não entram nos gastos**: ficam só na tela Cartões, e o que entra é o pagamento da fatura (total ou parcial), na data em que foi pago. As entradas do mês são as entradas avulsas mais as entradas fixas **confirmadas**; o saldo do mês é entradas menos gastos. Tudo pode ser visto por **visão**: Família (soma), Eu, Esposa ou Casa.

## Modelo de dados

- **Gasto**: descrição, categoria, valor, data e de quem é (Eu, Esposa ou Casa).
- **Cartao**: cartão de crédito (nome, de quem é e dias de fechamento e vencimento, informativos). Gastos e compras parceladas apontam para o cartão em que foram feitos e, com cartão, deixam de contar nos gastos do mês. Apagar o cartão apaga os pagamentos dele e devolve as compras aos gastos comuns.
- **PagamentoCartao**: pagamento (total ou parcial) de uma fatura, com data, valor e de quem é; é o que entra nos gastos do mês.
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
- **Cartões**: lista dos cartões com as compras e o valor pago da fatura no mês e nos últimos 6 meses; a página de cada cartão mostra as compras do mês e os pagamentos (registrar, editar, excluir). Ao importar uma fatura escolhendo o cartão, as compras vão para o cartão e os pagamentos que aparecem na fatura viram pagamentos da fatura.
- **Entradas**: entradas fixas do mês (com botão Confirmar), entradas avulsas e saldo do mês.
- **Contas fixas**: situação do mês (paga, vencida, vence hoje, a vencer), cadastro, edição e encerramento.
- **Parcelados**: compras em andamento e quitadas.
- **Orçamento e limites**: orçamento por pessoa e limites por categoria de cada visão.
- **Metas e reserva**: reserva de emergência em meses de gastos e metas com prazo opcional.
- **Importar extrato**: fatura do cartão ou extrato em PDF, CSV ou OFX, com revisão das linhas antes de gravar. O arquivo é lido no navegador. CSV/OFX: `lib/extrato.ts`. PDF: `lib/extrato-pdf.ts` tira o texto do PDF e procura linhas com data, descrição e valor (funciona por padrão de texto, não por banco; PDF digitalizado como imagem não é lido; PDF com senha pede a senha).
- **Configurações**: dados de exemplo, cópia de segurança e apagar tudo.

## Ligar sozinho no Mac (atalho)

`npm run servico` compila a versão de produção e instala um serviço do macOS (`com.financas.casa`) que liga o sistema ao entrar no Mac e o religa se ele parar. Ele responde só neste computador, em http://localhost:3100. Depois, no Safari, abra o endereço e use **Arquivo → Adicionar ao Dock** para ter o ícone de aplicativo. Com o serviço instalado, não use mais `npm run dev`. Para aplicar mudanças no código: `npm run atualizar`. Para remover o serviço: `bash scripts/instalar-servico.sh --remover`. Log: `~/Library/Logs/financas-casa.log`.

## Cópia de segurança

`npm run backup` grava uma cópia do `dev.db` em `backups/` e, com `BACKUP_ONEDRIVE_DIR` definido no `.env`, também na pasta do OneDrive. Mantenha a pasta do projeto **fora** do OneDrive: sincronizar o banco em uso e o `node_modules` costuma corromper arquivos.
