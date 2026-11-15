/**
 * O template é recriado a cada troca de tela (diferente do layout, que
 * persiste), então a animação de entrada roda em toda navegação.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animar-pagina">{children}</div>;
}
