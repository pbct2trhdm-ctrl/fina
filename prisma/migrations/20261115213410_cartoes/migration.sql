-- CreateTable
CREATE TABLE "Cartao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "diaFechamento" INTEGER,
    "diaVencimento" INTEGER,
    "escopo" TEXT NOT NULL DEFAULT 'EU',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CompraParcelada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "escopo" TEXT NOT NULL,
    "valorParcela" REAL NOT NULL,
    "parcelas" INTEGER NOT NULL,
    "inicio" TEXT NOT NULL,
    "diaCobranca" INTEGER NOT NULL,
    "cartaoId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompraParcelada_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "Cartao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CompraParcelada" ("categoria", "criadoEm", "descricao", "diaCobranca", "escopo", "id", "inicio", "parcelas", "valorParcela") SELECT "categoria", "criadoEm", "descricao", "diaCobranca", "escopo", "id", "inicio", "parcelas", "valorParcela" FROM "CompraParcelada";
DROP TABLE "CompraParcelada";
ALTER TABLE "new_CompraParcelada" RENAME TO "CompraParcelada";
CREATE TABLE "new_Gasto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "data" DATETIME NOT NULL,
    "escopo" TEXT NOT NULL,
    "cartaoId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Gasto_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "Cartao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Gasto" ("categoria", "criadoEm", "data", "descricao", "escopo", "id", "valor") SELECT "categoria", "criadoEm", "data", "descricao", "escopo", "id", "valor" FROM "Gasto";
DROP TABLE "Gasto";
ALTER TABLE "new_Gasto" RENAME TO "Gasto";
CREATE INDEX "Gasto_data_idx" ON "Gasto"("data");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
