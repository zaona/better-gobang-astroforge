// @ts-nocheck
import {
  app,
  device,
  Image,
  Input,
  prompt,
  Stack,
  View,
  useState,
} from "@astralsight/astroforge-core";

export const styles = `
  .page {
    width: 100%;
    height: 100%;
    background-color: #000000;
  }

  .stack {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
  }

  .touch-layer {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
  }

  .exit-btn,
  .putbtn {
    position: absolute;
    left: 50%;
    width: 160px;
    height: 80px;
    background-color: rgba(38, 38, 38, 0.7);
    border: 4px solid rgba(255, 255, 255, 0.06);
    border-radius: 50%;
    color: #ffffff;
    font-size: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .exit-btn {
    top: 30px;
  }

  .putbtn {
    bottom: 30px;
  }

  .board-grid {
    position: absolute;
    border: 1px solid #000000;
  }

  .board-frame {
    position: absolute;
    background-color: #daa06d;
    border-radius: 8px;
    border: 8px solid #a37d54;
  }
`;

export const lifecycle = {
  onInit() {
    this.prepareWinRefs();
    this.resetRuntimeState();
    this.fetchScreenInfo();
  },

  onBackPress() {
    return true;
  },

  onDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = null;
  },
};

export default function IndexPage() {
  const [pieces, setPieces] = useState([]);
  const [screenWidth, setScreenWidth] = useState(600);
  const [screenHeight, setScreenHeight] = useState(480);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [buttonLeft, setButtonLeft] = useState(220);
  const [boardSize, setBoardSize] = useState(600);
  const [frameWidth, setFrameWidth] = useState(20);
  const [btnTxt, setBtnTxt] = useState("开始游戏");
  const [playerCursor, setPlayerCursor] = useState({
    src: "rect57.png",
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    visible: false,
  });
  const [aiCursor, setAiCursor] = useState({
    src: "rect57_red.png",
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    visible: false,
  });
  const [nextPieceId, setNextPieceId] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPointerX, setDragStartPointerX] = useState(0);
  const [dragStartPointerY, setDragStartPointerY] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [ignoreNextClick, setIgnoreNextClick] = useState(false);

  function computeVerticalOffset(height) {
    const defaultHeight = 480;
    const boardPixelSize = 600;
    const validHeight = typeof height === "number" ? height : defaultHeight;
    return (validHeight - boardPixelSize) / 2;
  }

  function computeHorizontalOffset(width) {
    const defaultWidth = 600;
    const boardPixelSize = 600;
    const validWidth = typeof width === "number" && width > 0 ? width : defaultWidth;
    return (validWidth - boardPixelSize) / 2;
  }

  function computeButtonOffset(width) {
    const defaultWidth = 600;
    const buttonWidth = 160;
    const validWidth = typeof width === "number" && width > 0 ? width : defaultWidth;
    const offset = (validWidth - buttonWidth) / 2;
    return offset > 0 ? offset : 0;
  }

  function computeCellSize() {
    const boardPixelSize = 600;
    const boardCount = 15;
    return boardPixelSize / (boardCount - 1);
  }

  function computePieceSize() {
    const pieceScale = 0.8;
    const cellSize = this.computeCellSize();
    return cellSize * pieceScale;
  }

  function computeCursorSize() {
    const cursorScale = 1.2;
    const cellSize = this.computeCellSize();
    return cellSize * cursorScale;
  }

  function computeCenteredOffset(size) {
    return (0 - size) / 2;
  }

  function createCursorState(src) {
    const cursorSize = this.computeCursorSize();
    const cursorOffset = this.computeCenteredOffset(cursorSize);
    return {
      src,
      x: cursorOffset,
      y: cursorOffset,
      w: cursorSize,
      h: cursorSize,
      visible: false,
    };
  }

  function createVector(size, initialValue) {
    return Array(size).fill(initialValue);
  }

  function createMatrix(size, initialValue) {
    return Array.from({ length: size }, function () {
      return Array(size).fill(initialValue);
    });
  }

  function showToast(message, duration) {
    prompt.showToast({
      message,
      duration,
    });
  }

  function getPointerPosition(event) {
    const source = event || {};
    const touch =
      (source.touches && source.touches[0]) ||
      (source.changedTouches && source.changedTouches[0]);
    if (touch) {
      const x =
        typeof touch.screenX === "number"
          ? touch.screenX
          : typeof touch.clientX === "number"
            ? touch.clientX
            : typeof touch.globalX === "number"
              ? touch.globalX
              : 0;
      const y =
        typeof touch.screenY === "number"
          ? touch.screenY
          : typeof touch.clientY === "number"
            ? touch.clientY
            : typeof touch.globalY === "number"
              ? touch.globalY
              : 0;
      return { x, y };
    }
    const x =
      typeof source.offsetX === "number"
        ? source.offsetX
        : typeof source.screenX === "number"
          ? source.screenX
          : typeof source.clientX === "number"
            ? source.clientX
            : 0;
    const y =
      typeof source.offsetY === "number"
        ? source.offsetY
        : typeof source.screenY === "number"
          ? source.screenY
          : typeof source.clientY === "number"
            ? source.clientY
            : 0;
    return { x, y };
  }

  function addWinPattern(stepCol, stepRow, startCol, startRow) {
    const winLength = 5;
    let index = this.totalPatterns;

    for (let offset = 0; offset < winLength; offset++) {
      this.winRefs[startCol + stepCol * offset][startRow + stepRow * offset].push(index);
    }

    this.totalPatterns = index + 1;
  }

  function prepareWinRefs() {
    const boardCount = 15;
    this.winRefs = Array.from({ length: boardCount }, function () {
      return Array.from({ length: boardCount }, function () {
        return [];
      });
    });
    this.totalPatterns = 0;

    for (let col = 0; col < boardCount; col++) {
      for (let row = 0; row <= 10; row++) {
        this.addWinPattern(0, 1, col, row);
      }
    }

    for (let row = 0; row < boardCount; row++) {
      for (let col = 0; col <= 10; col++) {
        this.addWinPattern(1, 0, col, row);
      }
    }

    for (let col = 0; col <= 10; col++) {
      for (let row = 0; row <= 10; row++) {
        this.addWinPattern(1, 1, col, row);
      }
    }

    for (let col = 0; col <= 10; col++) {
      for (let row = boardCount - 1; row >= 4; row--) {
        this.addWinPattern(1, -1, col, row);
      }
    }
  }

  function resetRuntimeState() {
    this.board = this.createMatrix(15, 0);
    this.zone = this.createMatrix(15, 0);
    this.playerWins = this.createVector(this.totalPatterns, 0);
    this.aiWins = this.createVector(this.totalPatterns, 0);
    this.pieces = [];
    this.nextPieceId = 1;
    this.startX = this.computeHorizontalOffset(this.screenWidth);
    this.startY = this.computeVerticalOffset(this.screenHeight);
    this.selectedCol = 0;
    this.selectedRow = 0;
    this.hasSelection = false;
    this.playerCursor = this.createCursorState("rect57.png");
    this.aiCursor = this.createCursorState("rect57_red.png");
    this.isPlayerTurn = true;
    this.gameFinished = true;
    this.btnTxt = "开始游戏";
    this.buttonLeft = this.computeButtonOffset(this.screenWidth);
    this.frameWidth = 20;
    this.isDragging = false;
    this.dragStartX = this.startX;
    this.dragStartY = this.startY;
    this.ignoreNextClick = false;
  }

  function fetchScreenInfo() {
    device.getInfo({
      success: (info = {}) => {
        const currentWidth =
          typeof info.screenWidth === "number" && info.screenWidth > 0
            ? info.screenWidth
            : this.screenWidth;
        const currentHeight =
          typeof info.screenHeight === "number" && info.screenHeight > 0
            ? info.screenHeight
            : this.screenHeight;
        this.screenWidth = currentWidth;
        this.screenHeight = currentHeight;
        this.buttonLeft = this.computeButtonOffset(currentWidth);
        this.startX = this.computeHorizontalOffset(currentWidth);
        this.startY = this.computeVerticalOffset(currentHeight);
        this.dragStartX = this.startX;
        this.dragStartY = this.startY;
      },
    });
  }

  function onBtnClick() {
    if (this.gameFinished) {
      this.startGame();
    } else {
      this.handlePlayerMove();
    }
  }

  function startGame() {
    this.resetRuntimeState();
    this.gameFinished = false;
    this.btnTxt = "落子";

    const playerStarts = Math.round(Math.random()) === 0;
    this.isPlayerTurn = playerStarts;

    if (!playerStarts) {
      this.placeAiMove(8, 8);
    }
  }

  function handlePlayerMove() {
    if (!this.isPlayerTurn) {
      return;
    }

    if (!this.hasSelection || this.board[this.selectedCol][this.selectedRow] !== 0) {
      this.showToast("请先点击棋盘，选择落子位置", 2000);
      return;
    }

    this.dropPiece(this.selectedCol, this.selectedRow, 1);
    this.hasSelection = false;

    if (!this.gameFinished) {
      this.isPlayerTurn = false;
      this.autoAiMove();
    }
  }

  function dropPiece(col, row, owner) {
    const cellSize = this.computeCellSize();
    const pieceSize = this.computePieceSize();
    const pieceOffset = this.computeCenteredOffset(pieceSize);
    const x = col * cellSize + pieceOffset;
    const y = row * cellSize + pieceOffset;
    const src = owner === 1 ? "black.png" : "white.png";
    const piece = {
      id: this.nextPieceId++,
      x,
      y,
      w: pieceSize,
      h: pieceSize,
      src,
    };
    this.pieces = this.pieces.concat([piece]);

    this.board[col][row] = owner;
    this.markZone(col, row);
    const won = this.updateWins(col, row, owner);

    if (won) {
      this.showToast(owner === 1 ? "恭喜获得胜利！" : "AI胜利", owner === 1 ? 4000 : 3000);
      this.finishGame();
    }
  }

  function markZone(col, row) {
    this.zone[col][row] = 1;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const nextX = col + dx;
        const nextY = row + dy;
        if (
          nextX >= 0 &&
          nextX < 15 &&
          nextY >= 0 &&
          nextY < 15 &&
          this.zone[nextX][nextY] === 0
        ) {
          this.zone[nextX][nextY] = 2;
        }
      }
    }
  }

  function updateWins(col, row, owner) {
    let hasWon = false;
    const target = owner === 1 ? this.playerWins : this.aiWins;
    const rival = owner === 1 ? this.aiWins : this.playerWins;

    this.winRefs[col][row].forEach((idx) => {
      target[idx] += 1;
      rival[idx] = 6;
      if (target[idx] === 5) {
        hasWon = true;
      }
    });

    return hasWon;
  }

  function finishGame() {
    this.gameFinished = true;
    this.btnTxt = "开始游戏";
  }

  function autoAiMove() {
    const pick = this.pickBestMove();
    if (!pick) {
      this.showToast("平局，游戏结束", 4000);
      this.finishGame();
      return;
    }
    this.placeAiMove(pick.col, pick.row);
  }

  function placeAiMove(col, row) {
    this.dropPiece(col, row, 2);
    this.updateCursor(col, row, false);
    if (!this.gameFinished) {
      this.isPlayerTurn = true;
    }
  }

  function pickBestMove() {
    let hasCandidate = false;
    let bestScore = 0;
    let bestPlayerScore = 0;
    let bestAiScore = 0;
    let bestCol = 0;
    let bestRow = 0;

    const playerBoard = this.createMatrix(15, 0);
    const aiBoard = this.createMatrix(15, 0);

    for (let col = 0; col < 15; col++) {
      for (let row = 0; row < 15; row++) {
        if (this.zone[col][row] !== 2 || this.board[col][row] !== 0) {
          continue;
        }

        this.winRefs[col][row].forEach((idx) => {
          switch (this.playerWins[idx]) {
            case 1:
              playerBoard[col][row] += 200;
              break;
            case 2:
              playerBoard[col][row] += 400;
              break;
            case 3:
              playerBoard[col][row] += 2000;
              break;
            case 4:
              playerBoard[col][row] += 10000;
              break;
            default:
              break;
          }
          switch (this.aiWins[idx]) {
            case 1:
              aiBoard[col][row] += 220;
              break;
            case 2:
              aiBoard[col][row] += 420;
              break;
            case 3:
              aiBoard[col][row] += 2100;
              break;
            case 4:
              aiBoard[col][row] += 20000;
              break;
            default:
              break;
          }
        });

        const playerScore = playerBoard[col][row];
        const aiScore = aiBoard[col][row];

        if (playerScore > bestScore || (playerScore === bestScore && aiScore > bestAiScore)) {
          bestScore = playerScore;
          bestPlayerScore = playerScore;
          bestAiScore = aiScore;
          bestCol = col;
          bestRow = row;
          hasCandidate = true;
        }

        if (aiScore > bestScore || (aiScore === bestScore && playerScore > bestPlayerScore)) {
          bestScore = aiScore;
          bestPlayerScore = playerScore;
          bestAiScore = aiScore;
          bestCol = col;
          bestRow = row;
          hasCandidate = true;
        }
      }
    }

    if (!hasCandidate) {
      return null;
    }

    return {
      col: bestCol,
      row: bestRow,
    };
  }

  function onBoardClick(event) {
    if (this.ignoreNextClick) {
      this.ignoreNextClick = false;
      return;
    }

    if (this.gameFinished || !this.isPlayerTurn) {
      return;
    }

    const boardX = event.offsetX - this.startX;
    const boardY = event.offsetY - this.startY;
    const cellSize = this.computeCellSize();
    const col = Math.round(boardX / cellSize);
    const row = Math.round(boardY / cellSize);

    if (
      col < 0 ||
      col >= 15 ||
      row < 0 ||
      row >= 15 ||
      this.board[col][row] !== 0
    ) {
      return;
    }

    this.selectedCol = col;
    this.selectedRow = row;
    this.hasSelection = true;
    this.updateCursor(col, row, true);
  }

  function onTouchStart(event) {
    const position = this.getPointerPosition(event);
    this.isDragging = true;
    this.dragStartPointerX = position.x;
    this.dragStartPointerY = position.y;
    this.dragStartX = this.startX;
    this.dragStartY = this.startY;
    this.ignoreNextClick = false;
  }

  function onTouchMove(event) {
    if (!this.isDragging) {
      return;
    }
    const position = this.getPointerPosition(event);
    const deltaX = position.x - this.dragStartPointerX;
    const deltaY = position.y - this.dragStartPointerY;

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      this.ignoreNextClick = true;
    }

    this.startX = this.dragStartX + deltaX;
    this.startY = this.dragStartY + deltaY;
  }

  function onTouchEnd() {
    if (!this.isDragging) {
      return;
    }
    this.isDragging = false;
  }

  function updateCursor(col, row, isPlayer) {
    const cellSize = this.computeCellSize();
    const cursorSize = this.computeCursorSize();
    const cursorOffset = this.computeCenteredOffset(cursorSize);
    const x = col * cellSize + cursorOffset;
    const y = row * cellSize + cursorOffset;
    const cursor = isPlayer ? this.playerCursor : this.aiCursor;
    if (!cursor) {
      return;
    }
    const nextCursor = {
      src: cursor.src,
      x,
      y,
      w: cursor.w,
      h: cursor.h,
      visible: true,
    };
    if (isPlayer) {
      this.playerCursor = nextCursor;
    } else {
      this.aiCursor = nextCursor;
    }
  }

  function exitApp() {
    app.terminate();
  }

  return (
    <View className="page">
      <Stack className="stack">
        <View
          className="board-frame"
          style={{
            left: startX - frameWidth,
            top: startY - frameWidth,
            width: boardSize + frameWidth * 2,
            height: boardSize + frameWidth * 2,
          }}
        />
        <Image
          className="board-grid"
          src="/common/images/bg.png"
          style={{
            left: startX,
            top: startY,
            width: boardSize,
            height: boardSize,
          }}
        />
        {pieces.map((piece) => (
          <Image
            key={piece.id}
            src={"/common/images/" + piece.src}
            style={{
              left: piece.x + startX,
              top: piece.y + startY,
              width: piece.w,
              height: piece.h,
            }}
          />
        ))}
        <Image
          show={playerCursor.visible}
          src={"/common/images/" + playerCursor.src}
          style={{
            left: playerCursor.x + startX,
            top: playerCursor.y + startY,
            width: playerCursor.w,
            height: playerCursor.h,
          }}
        />
        <Image
          show={aiCursor.visible}
          src={"/common/images/" + aiCursor.src}
          style={{
            left: aiCursor.x + startX,
            top: aiCursor.y + startY,
            width: aiCursor.w,
            height: aiCursor.h,
          }}
        />
      </Stack>
      <Stack className="stack">
        <View
          className="touch-layer"
          onClick={onBoardClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
        <Input
          className="exit-btn"
          type="button"
          value="退出"
          style={{ left: buttonLeft }}
          onClick={exitApp}
        />
        <Input
          className="putbtn"
          type="button"
          value={btnTxt}
          style={{ left: buttonLeft }}
          onClick={onBtnClick}
        />
      </Stack>
    </View>
  );
}
