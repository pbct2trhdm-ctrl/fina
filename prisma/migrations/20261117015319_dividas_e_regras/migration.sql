-- CreateTable
CREATE TABLE "RegraCategoria" (
    "chave" TEXT NOT NULL PRIMARY KEY,
    "categoria" TEXT NOT NULL,
    "atualizadoEm" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CompraParcelada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL DEFAULT 'COMPRA',
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
INSERT INTO "new_CompraParcelada" ("cartaoId", "categoria", "criadoEm", "descricao", "diaCobranca", "escopo", "id", "inicio", "parcelas", "valorParcela") SELECT "cartaoId", "categoria", "criadoEm", "descricao", "diaCobranca", "escopo", "id", "inicio", "parcelas", "valorParcela" FROM "CompraParcelada";
DROP TABLE "CompraParcelada";
ALTER TABLE "new_CompraParcelada" RENAME TO "CompraParcelada";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
