/**
 * Executa animações CSS em um elemento.
 * @param element Elemento alvo da animação.
 * @param animName Nome da animação a ser executada.
 */
export default async function animation(
  element: HTMLElement,
  animName: string
): Promise<void> {
  return new Promise<void>((resolve) => {
    if (element.getAttribute("animation") !== "") {
      element.removeEventListener("animationend", callback);
    }
    element.style.pointerEvents = "none";
    element.setAttribute("animation", animName);
    element.addEventListener("animationend", callback);
    function callback() {
      element.removeAttribute("animation");
      element.removeEventListener("animationend", callback);
      element.style.pointerEvents = "auto";
      resolve();
    }
  });
}
