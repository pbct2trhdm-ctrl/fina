import { CATEGORIAS, ESCOPOS, LABEL_CATEGORIA, LABEL_ESCOPO } from "@/lib/formatacao";
import { classeInput, classeLabel } from "@/lib/estilos";

export function CampoCategoria({ padrao = "OUTROS" }: { padrao?: string }) {
  return (
    <div>
      <label className={classeLabel} htmlFor="categoria">
        Categoria
      </label>
      <select id="categoria" name="categoria" defaultValue={padrao} className={classeInput}>
        {CATEGORIAS.map((categoria) => (
          <option key={categoria} value={categoria}>
            {LABEL_CATEGORIA[categoria]}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Cartão de crédito em que a compra foi feita (opcional: em branco = débito, Pix ou dinheiro). */
export function CampoCartao({ cartoes, padrao = "" }: { cartoes: { id: string; nome: string }[]; padrao?: string | null }) {
  if (cartoes.length === 0) return null;
  return (
    <div>
      <label className={classeLabel} htmlFor="cartaoId">
        Cartão de crédito
      </label>
      <select id="cartaoId" name="cartaoId" defaultValue={padrao ?? ""} className={classeInput}>
        <option value="">Nenhum (débito, Pix ou dinheiro)</option>
        {cartoes.map((cartao) => (
          <option key={cartao.id} value={cartao.id}>
            {cartao.nome}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CampoEscopo({ padrao = "CASA" }: { padrao?: string }) {
  return (
    <div>
      <label className={classeLabel} htmlFor="escopo">
        De quem é
      </label>
      <select id="escopo" name="escopo" defaultValue={padrao} className={classeInput}>
        {ESCOPOS.map((escopo) => (
          <option key={escopo} value={escopo}>
            {LABEL_ESCOPO[escopo]}
          </option>
        ))}
      </select>
    </div>
  );
}
