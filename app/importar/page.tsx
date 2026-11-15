import { ImportarExtrato } from "@/components/importar-extrato";
import { classeTituloPagina } from "@/lib/estilos";

export default function ImportarPage() {
  return (
    <div className="max-w-5xl">
      <h1 className={`${classeTituloPagina} mb-2`}>Importar extrato</h1>
      <p className="mb-6 text-sm text-texto-secundario">
        Traga os gastos do extrato da conta ou da fatura do cartão. Entradas de dinheiro são ignoradas, a categoria é sugerida pela
        descrição e o que já foi lançado vem desmarcado.
      </p>
      <ImportarExtrato />
    </div>
  );
}
