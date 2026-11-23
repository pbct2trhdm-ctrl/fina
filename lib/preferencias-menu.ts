/**
 * Preferências de aparência do menu, guardadas neste navegador. O script do
 * <head> (app/layout.tsx) aplica as mesmas chaves antes da primeira pintura.
 */
export function aplicarTemaMenu(tema: string) {
  document.documentElement.dataset.menuTema = tema;
  try {
    localStorage.setItem("menu-tema", tema);
  } catch {}
}

export function aplicarMenuRecolhido(recolhido: boolean) {
  if (recolhido) document.documentElement.dataset.menuRecolhido = "1";
  else delete document.documentElement.dataset.menuRecolhido;
  try {
    localStorage.setItem("menu-recolhido", recolhido ? "1" : "0");
  } catch {}
  // O menu mede de novo a posição do destaque da tela atual.
  window.dispatchEvent(new Event("resize"));
}
