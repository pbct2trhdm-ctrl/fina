import { ImportarExtrato } from "@/components/importar-extrato";
import { listarCartoes } from "@/lib/financas";
import { classeTituloPagina } from "@/lib/estilos";

export default async function ImportarPage() {
  const cartoes = await listarCartoes();
  return (
    <div className="max-w-5xl">
      <h1 className={`${classeTituloPagina} mb-2`}>Importar extrato</h1>
      <p className="mb-6 text-sm text-texto-secundario">
        Traga os gastos da fatura do cartão ou do extrato da conta, em PDF, CSV ou OFX. A categoria é sugerida pela descrição e o que
        já foi lançado vem desmarcado. Para trazer o dinheiro que entrou (salário, PIX recebido), escolha “Entradas de dinheiro”.
      </p>
      <ImportarExtrato cartoes={cartoes.map(({ id, nome, escopo }) => ({ id, nome, escopo }))} />
    </div>
  );
}
