-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContaFixa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "escopo" TEXT NOT NULL,
    "inicio" TEXT NOT NULL,
    "fim" TEXT,
    "cartaoId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContaFixa_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "Cartao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ContaFixa" ("categoria", "criadoEm", "descricao", "diaVencimento", "escopo", "fim", "id", "inicio", "valor") SELECT "categoria", "criadoEm", "descricao", "diaVencimento", "escopo", "fim", "id", "inicio", "valor" FROM "ContaFixa";
DROP TABLE "ContaFixa";
ALTER TABLE "new_ContaFixa" RENAME TO "ContaFixa";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
