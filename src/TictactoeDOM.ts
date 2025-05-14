import animation from "./animation.ts";

enum Animation {
  SLIDE_OUT = "slideOut",
  SLIDE_IN = "slideIn",
  SLIDE_OUT_FAST = "slideOutFast",
  SLIDE_IN_FAST = "slideInFast",
}

interface VictoryLineCoords {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export default class TictactoeDOM {
  private menuOpen: boolean;
  private SVG_IMGS: {
    [index: string]: { path: string; alt: string };
  };
  public title: HTMLHeadingElement;
  public menu: HTMLElement;
  public game: HTMLElement;
  public symbolButtons: HTMLButtonElement[];
  public turnSymbol: HTMLImageElement;
  public fields: HTMLButtonElement[];
  public reset: HTMLButtonElement;
  public back: HTMLButtonElement;
  public svgLine: SVGSVGElement;

  constructor() {
    // Caminho para SVGs dos símbolos.
    this.SVG_IMGS = {
      x: { path: "./x.svg", alt: "X" },
      circle: { path: "./circle.svg", alt: "Círculo" },
    };

    // Controla se o menu está aberto ou fechado.
    this.menuOpen = true;

    // Elementos do DOM.
    this.title = this.selectElement<HTMLHeadingElement>(".title");
    this.symbolButtons = this.selectElements<HTMLButtonElement>(
      ".symbolSelect button"
    );
    this.menu = this.selectElement<HTMLElement>(".menu");
    this.game = this.selectElement<HTMLElement>(".game");
    this.turnSymbol = this.selectElement<HTMLImageElement>(".nextMove img");
    this.fields = this.selectElements<HTMLButtonElement>(".fields button");
    this.back = this.selectElement<HTMLButtonElement>(".back");
    this.reset = this.selectElement<HTMLButtonElement>(".reset");
    this.svgLine = this.selectElement<SVGSVGElement>(".svgLine");
  }

  /**
   * Retorna um elemento do DOM. Lança erro caso não encontrar.
   * @param selector Seletor do elemento a ser retornado.
   */
  private selectElement<T extends HTMLElement | SVGElement>(
    selector: string
  ): T {
    const element = document.querySelector(selector);
    if (element === null) {
      this.elementError(selector);
    }
    return element as T;
  }

  /**
   * Retorna um Array de elementos do DOM. Lança erro caso não sejam encontrados.
   * @param selector Seletor dos elementos a serem retornados.
   */
  private selectElements<T extends HTMLElement>(selector: string): T[] {
    const element = document.querySelectorAll(selector);
    if (element.length === 0) {
      this.elementError(selector);
    }
    return Array.from(element) as T[];
  }

  /**
   * Abre ou fecha o menu.
   */
  public async toggleMenu(): Promise<void> {
    if (this.menuOpen) {
      await animation(this.menu, Animation.SLIDE_OUT);
      this.menu.classList.remove("js-visible");
      this.game.classList.add("js-visible");
      this.game.scrollIntoView({ behavior: "smooth" });
      await animation(this.game, Animation.SLIDE_IN);
    } else {
      this.title.scrollIntoView({ behavior: "smooth" });
      await animation(this.game, Animation.SLIDE_OUT);
      this.game.classList.remove("js-visible");
      this.menu.classList.add("js-visible");
      await animation(this.menu, Animation.SLIDE_IN);
    }
    this.menuOpen = !this.menuOpen;
  }

  /**
   * Define o símbolo do jogador atual.
   * @param symbol qual símbolo será exibido (1 = X, 2 = O).
   */
  public async setTurnSymbol(symbol: 1 | 2): Promise<void> {
    await animation(this.turnSymbol, Animation.SLIDE_OUT_FAST);
    this.turnSymbol.src =
      symbol === 1 ? this.SVG_IMGS.x.path : this.SVG_IMGS.circle.path;
    await animation(this.turnSymbol, Animation.SLIDE_IN_FAST);
  }

  /**
   * Altera o símbolo de um campo específico.
   * @param index Índice do campo.
   * @param symbol Símbolo a ser exibido. 0 = vazio, 1 = X, 2 = O.
   */
  public setFieldValue(index: number, symbol: 0 | 1 | 2): void {
    const field = this.fields[index];
    if (symbol === 0) {
      field.disabled = false;
      field.innerHTML = "";
      return;
    }
    field.disabled = true;
    const img = document.createElement("img");
    const svg = this.SVG_IMGS[symbol === 1 ? "x" : "circle"];
    img.height = 80;
    img.width = 80;
    img.alt = svg.alt;
    img.src = svg.path;
    field.appendChild(img);
    field.blur();
  }

  /**
   * Retorna as coordenadas para desenhar a linha da vitória entre dois campos.
   * @param from Campo de origem.
   * @param to Campo de destino.
   */
  private getLineCoords(from: number, to: number): VictoryLineCoords {
    const MARGIN = 15;
    const svgRect = this.svgLine.getBoundingClientRect();
    const fromFieldRect = this.fields[from].getBoundingClientRect();
    const toFieldRect = this.fields[to].getBoundingClientRect();
    const offsets = new Map([
      ["08", [MARGIN, MARGIN]],
      ["26", [fromFieldRect.width - MARGIN, MARGIN]],
      ["02", [MARGIN, toFieldRect.height / 2]],
      ["35", [MARGIN, toFieldRect.height / 2]],
      ["68", [MARGIN, toFieldRect.height / 2]],
      ["06", [toFieldRect.width / 2, MARGIN]],
      ["17", [toFieldRect.width / 2, MARGIN]],
      ["28", [toFieldRect.width / 2, MARGIN]],
    ]);
    const coordOffsets = offsets.get(`${from}${to}`) ?? [25, 25];
    const x1 = fromFieldRect.left - svgRect.left + coordOffsets[0];
    const y1 = fromFieldRect.top - svgRect.top + coordOffsets[1];
    const x2 =
      toFieldRect.left - svgRect.left + toFieldRect.width - coordOffsets[0];
    const y2 =
      toFieldRect.top - svgRect.top + toFieldRect.height - coordOffsets[1];
    return { x1, y1, x2, y2 };
  }

  /**
   * Desenha a linha da vitória entre dois campos.
   * @param from Campo de origem.
   * @param to Campo de destino.
   */
  public victoryLine(from: number, to: number): void {
    const { x1, y1, x2, y2 } = this.getLineCoords(from, to);
    this.svgLine.innerHTML = "";
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1.toString());
    line.setAttribute("y1", y1.toString());
    line.setAttribute("x2", x2.toString());
    line.setAttribute("y2", y2.toString());
    line.setAttribute("filter", "url(#shadow)");
    this.svgLine.appendChild(line);
  }

  /**
   * Remove a linha da vitória.
   */
  public resetVictoryLine() {
    this.svgLine.innerHTML = "";
  }

  /**
   * Lança um erro caso um elemento ou conjunto de elementos não esteja presente no DOM.
   * @param elementSelector Seletor do elemento
   */
  private elementError(elementSelector: string): never {
    throw new Error(
      `O elemento ou conjunto de elementos "${elementSelector}" não está presente corretamente no DOM`
    );
  }
}
