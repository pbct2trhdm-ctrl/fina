-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "data" DATETIME NOT NULL,
    "escopo" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ContaFixa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "escopo" TEXT NOT NULL,
    "inicio" TEXT NOT NULL,
    "fim" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PagamentoConta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contaId" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "pagoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PagamentoConta_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "ContaFixa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompraParcelada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "escopo" TEXT NOT NULL,
    "valorParcela" REAL NOT NULL,
    "parcelas" INTEGER NOT NULL,
    "inicio" TEXT NOT NULL,
    "diaCobranca" INTEGER NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Orcamento" (
    "escopo" TEXT NOT NULL PRIMARY KEY,
    "valor" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "LimiteCategoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "valorGuardado" REAL NOT NULL,
    "mesesMeta" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Meta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "valorAlvo" REAL NOT NULL,
    "valorGuardado" REAL NOT NULL,
    "prazo" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Gasto_data_idx" ON "Gasto"("data");

-- CreateIndex
CREATE INDEX "PagamentoConta_mes_idx" ON "PagamentoConta"("mes");

-- CreateIndex
CREATE UNIQUE INDEX "PagamentoConta_contaId_mes_key" ON "PagamentoConta"("contaId", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "LimiteCategoria_visao_categoria_key" ON "LimiteCategoria"("visao", "categoria");
