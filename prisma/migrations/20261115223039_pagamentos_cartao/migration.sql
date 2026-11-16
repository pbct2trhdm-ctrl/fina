-- CreateTable
CREATE TABLE "PagamentoCartao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cartaoId" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "valor" REAL NOT NULL,
    "escopo" TEXT NOT NULL,
    "descricao" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PagamentoCartao_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "Cartao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PagamentoCartao_data_idx" ON "PagamentoCartao"("data");
