import type { PagamentoCartao } from "@/app/generated/prisma/client";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";
import { paraInputDate } from "@/lib/formatacao";
import { hojeIsoLocal } from "@/lib/datas";
import { BotaoEnvio } from "@/components/botao-envio";
import { CampoEscopo } from "@/components/campos";

/** Pagamento (total ou parcial) da fatura de um cartão: é ele que entra nos gastos do mês. */
export function PagamentoForm({
  pagamento,
  escopoPadrao,
  action,
}: {
  pagamento?: PagamentoCartao;
  escopoPadrao: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="valor">
            Valor pago (R$)
          </label>
          <input id="valor" name="valor" type="number" step="0.01" min={0.01} required defaultValue={pagamento?.valor ?? ""} className={classeInput} />
        </div>
        <div>
          <label className={classeLabel} htmlFor="data">
            Data do pagamento
          </label>
          <input id="data" name="data" type="date" required defaultValue={pagamento ? paraInputDate(pagamento.data) : hojeIsoLocal()} className={classeInput} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CampoEscopo padrao={pagamento?.escopo ?? escopoPadrao} />
        <div>
          <label className={classeLabel} htmlFor="descricao">
            Observação (opcional)
          </label>
          <input id="descricao" name="descricao" maxLength={60} defaultValue={pagamento?.descricao ?? ""} placeholder="Ex.: pagamento parcial" className={classeInput} />
        </div>
      </div>

      <p className="text-sm text-texto-secundario">
        O valor entra nos gastos do mês da data do pagamento, na pessoa escolhida em “De quem é”. As compras do cartão não entram nos gastos:
        elas ficam só na tela do cartão.
      </p>

      <BotaoEnvio textoAguardando="Salvando…" className={classeBotaoPrimario}>
        Salvar
      </BotaoEnvio>
    </form>
  );
}
