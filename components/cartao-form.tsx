import type { Cartao } from "@/app/generated/prisma/client";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";
import { BotaoEnvio } from "@/components/botao-envio";
import { CampoEscopo } from "@/components/campos";

export function CartaoForm({ cartao, action }: { cartao?: Cartao; action: (formData: FormData) => void }) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className={classeLabel} htmlFor="nome">
          Nome do cartão
        </label>
        <input id="nome" name="nome" required maxLength={40} defaultValue={cartao?.nome ?? ""} placeholder="Ex.: Nubank, Itaú Visa" className={classeInput} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CampoEscopo padrao={cartao?.escopo ?? "EU"} />
        <div />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="diaFechamento">
            Dia do fechamento (opcional)
          </label>
          <input id="diaFechamento" name="diaFechamento" type="number" step={1} min={1} max={31} defaultValue={cartao?.diaFechamento ?? ""} className={classeInput} />
        </div>
        <div>
          <label className={classeLabel} htmlFor="diaVencimento">
            Dia do vencimento (opcional)
          </label>
          <input id="diaVencimento" name="diaVencimento" type="number" step={1} min={1} max={31} defaultValue={cartao?.diaVencimento ?? ""} className={classeInput} />
        </div>
      </div>

      <p className="text-sm text-texto-secundario">
        “De quem é” é só a sugestão usada ao importar a fatura; cada compra pode ser de outra pessoa. Os dias de fechamento e vencimento são
        informativos.
      </p>

      <BotaoEnvio textoAguardando="Salvando…" className={classeBotaoPrimario}>
        Salvar
      </BotaoEnvio>
    </form>
  );
}
