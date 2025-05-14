import TictactoeDOM from "./TictactoeDOM.js";

/**
 * Símbolos do jogo
 */
enum Symb {
  EMPTY = 0,
  X = 1,
  CIRCLE = 2,
}

/**
 * Posições do jogo
 */
enum Pos {
  TP_LE = 0, // TOP LEFT
  TP_MD = 1, // TOP MID
  TP_RI = 2, // TOP RIGHT
  CT_LE = 3, // CENTER LEFT
  CT_MD = 4, // CENTER MID
  CT_RI = 5, // CENTER RIGHT
  BT_LE = 6, // BOTTOM LEFT
  BT_MD = 7, // BOTTOM MID
  BT_RI = 8, // BOTTOM RIGHT
}

type FieldValue = Symb.X | Symb.CIRCLE | Symb.EMPTY;
type Symbol = Symb.X | Symb.CIRCLE;

interface WinnerFields {
  start: Pos;
  mid: Pos;
  end: Pos;
}

interface AITrapMoves {
  start: Pos;
  line: Pos[];
  column: Pos[];
  inverse: Pos;
}

interface AIConditionalMove {
  all?: Pos | Pos[];
  atLeast?: Pos | Pos[];
  response: Pos | Pos[];
}

export default class Tictactoe {
  /**
   * Instância da classe TictactoeDOM que gerencia o DOM do jogo.
   */
  gameDOM: TictactoeDOM;
  /**
   * Representa os campos do jogo.
   */
  fields: FieldValue[];
  /**
   * Símbolo com o qual o jogador está jogando.
   */
  playerSymbol: Symbol;
  /**
   * Símbolo com o qual a IA está jogando.
   */
  AISymbol: Symbol;
  /**
   * Define se o jogo está bloqueado ou não.
   */
  gameBlock: boolean;
  /**
   * Símbolo da jogada atual.
   */
  turnSymbol: Symbol;
  /**
   * Quantidade de movimentos já efetuados.
   */
  moves: number;
  /**
   * Campos selecionados que a IA utilizará para tentar encurralar o jogador na rodada atual.
   */
  AITrapFieldsSelection: AITrapMoves;
  /**
   * Campos a serem verificados para procurar por um vencedor.
   */
  WIN_PATTERNS: Pos[][];
  /**
   * Conjuntos de campos que a IA utilizará para tentar encurralar o jogador.
   */
  AI_TRAP_FIELDS: AITrapMoves[];
  /**
   * Tempo em milissegundos que a IA irá demorar para jogar.
   */
  AI_DELAY: number;

  constructor() {
    this.gameDOM = new TictactoeDOM();
    this.fields = Array(9).fill(Symb.EMPTY);
    this.playerSymbol = Symb.X;
    this.AISymbol = Symb.CIRCLE;
    this.turnSymbol = Symb.X;
    this.gameBlock = true;
    this.moves = 0;
    this.AI_DELAY = 500;
    this.WIN_PATTERNS = [
      [Pos.TP_LE, Pos.TP_MD, Pos.TP_RI],
      [Pos.CT_LE, Pos.CT_MD, Pos.CT_RI],
      [Pos.BT_LE, Pos.BT_MD, Pos.BT_RI],
      [Pos.TP_LE, Pos.CT_LE, Pos.BT_LE],
      [Pos.TP_MD, Pos.CT_MD, Pos.BT_MD],
      [Pos.TP_RI, Pos.CT_RI, Pos.BT_RI],
      [Pos.TP_LE, Pos.CT_MD, Pos.BT_RI],
      [Pos.TP_RI, Pos.CT_MD, Pos.BT_LE],
    ];
    this.AI_TRAP_FIELDS = [
      {
        start: Pos.TP_LE,
        line: [Pos.TP_MD, Pos.TP_RI],
        column: [Pos.CT_LE, Pos.BT_LE],
        inverse: Pos.BT_RI,
      },
      {
        start: Pos.TP_RI,
        line: [Pos.TP_MD, Pos.TP_LE],
        column: [Pos.CT_RI, Pos.BT_RI],
        inverse: Pos.BT_LE,
      },
      {
        start: Pos.BT_LE,
        line: [Pos.CT_LE, Pos.TP_LE],
        column: [Pos.BT_MD, Pos.BT_RI],
        inverse: Pos.TP_RI,
      },
      {
        start: Pos.BT_RI,
        line: [Pos.BT_MD, Pos.BT_LE],
        column: [Pos.CT_RI, Pos.TP_RI],
        inverse: Pos.TP_LE,
      },
    ];
    this.AITrapFieldsSelection = this.AI_TRAP_FIELDS[0];
    this.setEventListeners();
  }

  /**
   * Retorna um conjunto de jogadas condicionais para a AI jogar para cada rodada.
   */
  private get MOVE_SET(): AIConditionalMove[][] {
    const CARDINALS = [Pos.TP_MD, Pos.CT_LE, Pos.CT_RI, Pos.BT_MD];
    const CORNERS = [Pos.TP_LE, Pos.TP_RI, Pos.BT_LE, Pos.BT_RI];
    const { start, line, column, inverse } = this.AITrapFieldsSelection;
    // prettier-ignore
    return [
      [ // 1º Movimento (IA Começou)
        { response: start }
      ],
      [ // 2º Movimento (Jogador Começou)
        { all: Pos.CT_MD, response: start },
        { response: Pos.CT_MD },
      ],
      [ // 3º Movimento (IA Começou)
        { all: Pos.CT_MD, response: inverse },
        { atLeast: line, response: column[1] },
        { atLeast: column, response: line[1] },
        { response: [column[1], line[1]] },
      ],
      [ // 4º Movimento (Jogador Começou)
        { all: [Pos.TP_LE, Pos.BT_RI], response: CARDINALS },
        { all: [Pos.TP_RI, Pos.BT_LE], response: CARDINALS },
        { all: Pos.CT_MD, atLeast: CORNERS, response: [column[1], line[1]]},
        { all: Pos.TP_MD, atLeast: [Pos.CT_LE, Pos.CT_RI], response: [Pos.TP_LE, Pos.TP_RI] },
        { all: Pos.BT_MD, atLeast: [Pos.CT_LE, Pos.CT_RI], response: [Pos.BT_LE, Pos.BT_RI] },
        { all: Pos.TP_MD, atLeast: [Pos.BT_LE, Pos.BT_RI], response: Pos.TP_LE },
        { all: Pos.BT_MD, atLeast: [Pos.TP_LE, Pos.TP_RI], response: Pos.BT_LE },
        { all: Pos.CT_LE, atLeast: [Pos.TP_RI, Pos.BT_RI], response: Pos.BT_LE },
        { all: Pos.CT_RI, atLeast: [Pos.TP_LE, Pos.BT_LE], response: Pos.BT_RI },
      ],
      [ // 5º Movimento (IA Começou)
        { all: [Pos.TP_MD, Pos.CT_LE], response: Pos.CT_MD },
        { all: [Pos.TP_MD, Pos.CT_RI], response: Pos.CT_MD },
        { all: [Pos.BT_MD, Pos.CT_LE], response: Pos.CT_MD },
        { all: [Pos.BT_MD, Pos.CT_RI], response: Pos.CT_MD },
        { all: [line[0], column[0]], response: inverse },
        { response: [line[1], column[1], inverse] }
      ]
    ];
  }

  /**
   * Seta os eventos de clique nos botões do DOM.
   */
  private setEventListeners(): void {
    this.gameDOM.symbolButtons.forEach((button) => {
      button.addEventListener("click", (e: Event) => {
        if (e.currentTarget instanceof HTMLButtonElement) {
          const playerSymbol = Number(
            e.currentTarget.getAttribute("symbol")
          ) as Symbol;
          this.gameDOM.toggleMenu();
          this.start(playerSymbol);
        }
      });
    });
    this.gameDOM.reset.addEventListener("click", () => {
      this.reset();
      this.start(this.playerSymbol);
    });
    this.gameDOM.back.addEventListener("click", () => {
      this.gameDOM.toggleMenu();
      this.reset();
    });
    this.gameDOM.fields.forEach((button) => {
      button.addEventListener("click", ({ currentTarget }: Event) => {
        if (!(currentTarget instanceof HTMLButtonElement)) return;
        this.handleClick(currentTarget.getAttribute("pos")!);
      });
    });
  }

  /**
   * Callback para o clique no botão do campo, verifica se o movimento
   * é válido e faz a jogada.
   * @param pos Posição do campo clicado.
   */
  private handleClick(pos: string): void {
    const index = Number(pos);
    if (
      this.gameBlock ||
      this.fields[index] !== Symb.EMPTY ||
      this.turnSymbol !== this.playerSymbol
    )
      return;
    this.makeAMove(index);
  }

  /**
   * Inicia o jogo, setando o símbolo do jogador e do computador.
   * @param playerSymbol O símbolo do jogador.
   */
  private start = (playerSymbol: Symbol): void => {
    this.playerSymbol = playerSymbol;
    this.AISymbol = playerSymbol === Symb.X ? Symb.CIRCLE : Symb.X;
    this.AITrapFieldsSelection =
      this.AI_TRAP_FIELDS[Math.floor(Math.random() * 4)];
    this.gameBlock = false;
    if (this.AISymbol === this.turnSymbol) {
      setTimeout(() => {
        this.makeAMove(this.AIMove());
      }, this.AI_DELAY * 2);
    }
  };

  /**
   * Reseta o jogo, limpando os campos e reiniciando o estado do jogo.
   */
  private reset = (): void => {
    this.turnSymbol = Symb.X;
    this.moves = 0;
    for (let i = 0; i < this.fields.length; i++) {
      this.setFieldValue(i, Symb.EMPTY);
    }
    this.gameDOM.setTurnSymbol(this.turnSymbol);
    this.gameDOM.resetVictoryLine();
  };

  /**
   * Efetua um movimento no jogo.
   * @param index O índice do campo onde o movimento será feito.
   */
  private makeAMove = (index: number): void => {
    this.moves++;
    this.setFieldValue(index, this.turnSymbol);
    if (this.verifyIfGameEnds()) return;
    this.turnSymbol = this.turnSymbol === Symb.X ? Symb.CIRCLE : Symb.X;
    this.gameDOM.setTurnSymbol(this.turnSymbol);
    if (this.turnSymbol === this.AISymbol) {
      setTimeout(() => {
        this.makeAMove(this.AIMove());
      }, this.AI_DELAY);
    }
  };

  /**
   * Seta o símbolo de um campo específico no jogo e atualiza o DOM.
   * @param index O índice do campo a ser atualizado.
   * @param symb O símbolo a ser setado no campo.
   */
  private setFieldValue(index: number, symb: FieldValue): void {
    this.fields[index] = symb;
    this.gameDOM.setFieldValue(index, symb);
  }

  /**
   * Retorna se houve um vencedor, caso haja, bloqueia o jogo e comunica
   * ao DOM para traçar a linha.
   */
  private verifyIfGameEnds = (): boolean => {
    const winnerMove = this.checkWinnerPatterns();
    if (winnerMove) {
      this.gameBlock = true;
      this.gameDOM.victoryLine(winnerMove.start, winnerMove.end);
      return true;
    }
    return this.moves === 9;
  };

  /**
   * Retorna os índices dos campos vencedores caso haja um. Retorna null
   * se ninguém vencer.
   */
  private checkWinnerPatterns(): null | WinnerFields {
    const fields = this.fields;
    const actualSymbol = this.turnSymbol;
    for (let [start, mid, end] of this.WIN_PATTERNS) {
      if (
        actualSymbol === fields[start] &&
        actualSymbol === fields[mid] &&
        actualSymbol === fields[end]
      ) {
        return { start, mid, end };
      }
    }
    return null;
  }

  /**
   * Retorna uma ou mais posições para a IA jogar conforme as condições passadas. Retorna null
   * se nenhuma condição for satisfeita.
   * @param aiCondition Objeto com as condições e a jogada.
   */
  private AICheckCondition(aiCondition: AIConditionalMove): Pos | Pos[] | null {
    let allTest = true;
    let atLeastTest = true;
    let { all, atLeast, response } = aiCondition;
    if (all !== undefined) {
      all = Array.isArray(all) ? all : [all];
      for (const pos of all) {
        if (!(this.fields[pos] === this.playerSymbol)) {
          allTest = false;
          break;
        }
      }
    }
    if (atLeast !== undefined) {
      atLeast = Array.isArray(atLeast) ? atLeast : [atLeast];
      atLeastTest = false;
      for (const pos of atLeast) {
        if (this.fields[pos] === this.playerSymbol) {
          atLeastTest = true;
          break;
        }
      }
    }
    return allTest && atLeastTest ? response : null;
  }

  /**
   * Retorna a jogada da IA, verificando primeiro se há uma jogada
   * crítica, depois uma jogada estratégica e, por último, uma jogada aleatória.
   */
  private AIMove(): number {
    const aiCriticalMove = this.AICriticalMove();
    if (aiCriticalMove !== null) return aiCriticalMove;
    if (this.moves < 5) {
      const aiStrategicMove = this.AIStrategicMove();
      if (
        aiStrategicMove !== null &&
        this.fields[aiStrategicMove] === Symb.EMPTY
      )
        return aiStrategicMove;
    }
    return this.AIRandomPossibleMove(null);
  }

  /**
   * Retorna um movimento aleatório para a IA entre os índices
   * recebidos que estejam vazios.
   * @param targets Índices a serem verificados, se null, verifica todos os índices.
   */
  AIRandomPossibleMove(targets: Pos[] | null): Pos {
    const emptyTargets = (targets ?? Array.from(Array(9).keys())).filter(
      (targetIndex) => this.fields[targetIndex] === Symb.EMPTY
    );
    return emptyTargets[Math.floor(Math.random() * emptyTargets.length)];
  }

  /**
   * Retorna uma jogada crítica para a IA se houver (seja para vencer ou
   * bloquear o jogador).
   */
  AICriticalMove() {
    let protectionMove = null;
    let empty: number[] = [];
    let player = [];
    let ai = [];
    for (const winPattern of this.WIN_PATTERNS) {
      empty = [];
      player = [];
      ai = [];
      winPattern.forEach((index) => {
        if (this.fields[index] === this.playerSymbol) player.push(index);
        else if (this.fields[index] === this.AISymbol) ai.push(index);
        else empty.push(index);
      });
      if (ai.length === 2 && empty.length === 1) {
        return empty[0];
      }
      if (player.length === 2 && empty.length === 1) {
        protectionMove = empty[0];
      }
    }
    return protectionMove !== null ? protectionMove : null;
  }

  /**
   * Retorna a jogada mais adequada estrategicamente da IA conforme a rodada.
   */
  AIStrategicMove() {
    let move;
    for (const moveCondition of this.MOVE_SET[this.moves]) {
      move = this.AICheckCondition(moveCondition);
      if (move !== null) {
        return Array.isArray(move) ? this.AIRandomPossibleMove(move) : move;
      }
    }
    return null;
  }
}
