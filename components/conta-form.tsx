import type { ContaFixa } from "@/app/generated/prisma/client";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";
import { BotaoEnvio } from "@/components/botao-envio";
import { CampoCartao, CampoCategoria, CampoEscopo } from "@/components/campos";

/** `inicioPadrao` (AAAA-MM) só é usado ao criar: a conta passa a valer a partir desse mês. */
export function ContaForm({
  conta,
  inicioPadrao,
  cartoes,
  cartaoPadrao,
  action,
}: {
  conta?: ContaFixa;
  inicioPadrao?: string;
  cartoes: { id: string; nome: string }[];
  /** Cartão já escolhido ao criar (vindo da tela do cartão). */
  cartaoPadrao?: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className={classeLabel} htmlFor="descricao">
          Descrição
        </label>
        <input id="descricao" name="descricao" required maxLength={60} defaultValue={conta?.descricao ?? ""} placeholder="Ex.: Plano de saúde" className={classeInput} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="valor">
            Valor mensal (R$)
          </label>
          <input id="valor" name="valor" type="number" step="0.01" min={0.01} required defaultValue={conta?.valor ?? ""} className={classeInput} />
        </div>
        <div>
          <label className={classeLabel} htmlFor="diaVencimento">
            Dia do vencimento
          </label>
          <input id="diaVencimento" name="diaVencimento" type="number" step={1} min={1} max={31} required defaultValue={conta?.diaVencimento ?? 10} className={classeInput} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CampoEscopo padrao={conta?.escopo ?? "CASA"} />
        <CampoCategoria padrao={conta?.categoria ?? "MORADIA"} />
      </div>

      {cartoes.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white/50 p-3">
          <CampoCartao cartoes={cartoes} padrao={conta?.cartaoId ?? cartaoPadrao} />
          <p className="mt-1 text-xs text-texto-secundario">
            Para assinaturas, academia e outras cobranças mensais no cartão: a conta aparece sozinha em cada fatura e não precisa ser marcada
            como paga.
          </p>
        </div>
      )}

      {!conta && (
        <div className="max-w-[calc(50%-0.5rem)]">
          <label className={classeLabel} htmlFor="inicio">
            Vale a partir de
          </label>
          <input id="inicio" name="inicio" type="month" required defaultValue={inicioPadrao} className={classeInput} />
        </div>
      )}

      {conta && (
        <p className="text-sm text-texto-secundario">
          Mudar o valor só afeta os meses ainda não pagos; o que já foi pago fica com o valor da época.
        </p>
      )}

      <BotaoEnvio textoAguardando="Salvando…" className={classeBotaoPrimario}>
        Salvar
      </BotaoEnvio>
    </form>
  );
}
