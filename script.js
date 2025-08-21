class SudokuGame {
    constructor() {
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.selectedCell = null;
        this.selectedNumber = null;
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // 页面元素
        this.introScreen = document.getElementById('intro-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.sudokuGrid = document.getElementById('sudoku-grid');
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toast-message');
        
        // 按钮元素
        this.startBtn = document.getElementById('start-btn');
        this.backBtn = document.getElementById('back-btn');
        this.submitBtn = document.getElementById('submit-btn');
        this.toastBtn = document.getElementById('toast-btn');
        
        // 数字按钮
        this.numberBtns = document.querySelectorAll('.number-btn');
    }

    bindEvents() {
        // 页面切换事件
        this.startBtn.addEventListener('click', () => this.startGame());
        this.backBtn.addEventListener('click', () => this.backToIntro());
        this.toastBtn.addEventListener('click', () => this.closeToast());
        
        // 游戏控制事件
        this.submitBtn.addEventListener('click', () => this.submitAnswer());
        
        // 数字按钮事件
        this.numberBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const number = parseInt(e.target.dataset.number);
                this.selectNumber(number);
            });
        });
    }

    startGame() {
        this.generateSudoku();
        this.renderGrid();
        this.showGameScreen();
    }

    showGameScreen() {
        this.introScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
    }

    backToIntro() {
        this.gameScreen.classList.remove('active');
        this.introScreen.classList.add('active');
        this.resetGame();
    }

    resetGame() {
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.selectedCell = null;
        this.selectedNumber = null;
        this.clearNumberSelection();
    }

    // 生成数独谜题
    generateSudoku() {
        // 首先生成一个完整的数独解
        this.generateCompleteSudoku();
        
        // 复制解到solution数组
        this.solution = this.grid.map(row => [...row]);
        
        // 随机移除一些数字创建谜题
        this.createPuzzle();
    }

    generateCompleteSudoku() {
        // 重置网格
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        
        // 使用回溯算法生成完整的数独
        this.solveSudoku();
    }

    solveSudoku() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] === 0) {
                    // 随机排列数字1-9
                    const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    
                    for (let num of numbers) {
                        if (this.isValidMove(row, col, num)) {
                            this.grid[row][col] = num;
                            
                            if (this.solveSudoku()) {
                                return true;
                            }
                            
                            this.grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    createPuzzle() {
        // 随机移除40-50个数字
        const cellsToRemove = 45 + Math.floor(Math.random() * 6);
        const positions = [];
        
        // 创建所有位置的数组
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                positions.push([row, col]);
            }
        }
        
        // 随机打乱位置
        this.shuffleArray(positions);
        
        // 移除指定数量的数字
        for (let i = 0; i < cellsToRemove; i++) {
            const [row, col] = positions[i];
            this.grid[row][col] = 0;
        }
    }

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    isValidMove(row, col, num) {
        // 检查行
        for (let c = 0; c < 9; c++) {
            if (this.grid[row][c] === num) return false;
        }
        
        // 检查列
        for (let r = 0; r < 9; r++) {
            if (this.grid[r][col] === num) return false;
        }
        
        // 检查3x3方格
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (this.grid[r][c] === num) return false;
            }
        }
        
        return true;
    }

    renderGrid() {
        this.sudokuGrid.innerHTML = '';
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const value = this.grid[row][col];
                if (value !== 0) {
                    cell.textContent = value;
                    cell.classList.add('filled');
                } else {
                    cell.classList.add('empty');
                    cell.addEventListener('click', (e) => this.selectCell(e.target));
                }
                
                this.sudokuGrid.appendChild(cell);
            }
        }
    }

    selectCell(cell) {
        // 清除之前选中的单元格
        if (this.selectedCell) {
            this.selectedCell.classList.remove('selected');
        }
        
        // 选中新单元格
        this.selectedCell = cell;
        cell.classList.add('selected');
    }

    selectNumber(number) {
        // 清除之前选中的数字按钮
        this.clearNumberSelection();
        
        this.selectedNumber = number;
        
        // 高亮选中的数字按钮
        if (number !== 0) {
            const btn = document.querySelector(`[data-number="${number}"]`);
            if (btn) btn.classList.add('active');
        }
        
        // 如果有选中的单元格，直接填入数字
        if (this.selectedCell && number !== null) {
            this.fillCell(number);
        }
    }

    clearNumberSelection() {
        this.numberBtns.forEach(btn => btn.classList.remove('active'));
    }

    fillCell(number) {
        if (!this.selectedCell) return;
        
        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);
        
        if (number === 0) {
            // 清除单元格
            this.grid[row][col] = 0;
            this.selectedCell.textContent = '';
        } else {
            // 填入数字
            this.grid[row][col] = number;
            this.selectedCell.textContent = number;
        }
        
        // 清除选中状态
        this.selectedCell.classList.remove('selected');
        this.selectedCell = null;
        this.clearNumberSelection();
    }

    submitAnswer() {
        const errors = this.validateGrid();
        
        if (errors.length > 0) {
            // 有错误，显示错误单元格
            this.showErrors(errors);
        } else if (this.isGridComplete()) {
            // 游戏完成
            this.showSuccessToast();
        } else {
            // 还有空格未填
            this.showIncompleteMessage();
        }
    }

    validateGrid() {
        const errors = [];
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = this.grid[row][col];
                if (value !== 0 && value !== this.solution[row][col]) {
                    errors.push({ row, col });
                }
            }
        }
        
        return errors;
    }

    isGridComplete() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    showErrors(errors) {
        errors.forEach(({ row, col }) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('blink');
                setTimeout(() => {
                    cell.classList.remove('blink');
                }, 1500);
            }
        });
    }

    showIncompleteMessage() {
        // 找到空的单元格并让它们闪烁
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] === 0) {
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (cell) {
                        cell.classList.add('blink');
                        setTimeout(() => {
                            cell.classList.remove('blink');
                        }, 1500);
                    }
                }
            }
        }
    }

    showSuccessToast() {
        this.toastMessage.textContent = '恭喜！您成功完成了数独游戏！';
        this.toastMessage.className = 'toast-message success';
        this.toast.classList.add('show');
    }

    closeToast() {
        this.toast.classList.remove('show');
        // 回到介绍页面
        setTimeout(() => {
            this.backToIntro();
        }, 300);
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});