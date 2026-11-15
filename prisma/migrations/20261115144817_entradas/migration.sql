-- CreateTable
CREATE TABLE "Entrada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "data" DATETIME NOT NULL,
    "escopo" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EntradaFixa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "diaRecebimento" INTEGER NOT NULL,
    "escopo" TEXT NOT NULL,
    "inicio" TEXT NOT NULL,
    "fim" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RecebimentoEntrada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entradaId" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "recebidoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecebimentoEntrada_entradaId_fkey" FOREIGN KEY ("entradaId") REFERENCES "EntradaFixa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Entrada_data_idx" ON "Entrada"("data");

-- CreateIndex
CREATE INDEX "RecebimentoEntrada_mes_idx" ON "RecebimentoEntrada"("mes");

-- CreateIndex
CREATE UNIQUE INDEX "RecebimentoEntrada_entradaId_mes_key" ON "RecebimentoEntrada"("entradaId", "mes");
