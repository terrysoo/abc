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
        
        // 调试信息 - 显示谜题质量分析
        if (console && console.log) {
            const quality = this.analyzePuzzleQuality();
            console.log('数独谜题质量分析:', {
                hasImmediateSolution: quality.hasImmediateSolution,
                balancedDistribution: quality.balancedDistribution,
                reasonableDifficulty: quality.reasonableDifficulty,
                emptyCells: this.countEmptyCells()
            });
            
            // 显示每行、每列、每个3x3方格的填充情况
            this.logDistributionAnalysis();
        }
    }

    logDistributionAnalysis() {
        console.log('=== 数独分布分析 ===');
        
        // 分析行
        console.log('行分布:');
        for (let row = 0; row < 9; row++) {
            const filled = this.grid[row].filter(cell => cell !== 0).length;
            console.log(`第${row + 1}行: ${filled}个数字, ${9 - filled}个空格`);
        }
        
        // 分析列
        console.log('列分布:');
        for (let col = 0; col < 9; col++) {
            const filled = this.grid.map(row => row[col]).filter(cell => cell !== 0).length;
            console.log(`第${col + 1}列: ${filled}个数字, ${9 - filled}个空格`);
        }
        
        // 分析3x3方格
        console.log('3x3方格分布:');
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                let filled = 0;
                for (let r = boxRow * 3; r < (boxRow + 1) * 3; r++) {
                    for (let c = boxCol * 3; c < (boxCol + 1) * 3; c++) {
                        if (this.grid[r][c] !== 0) filled++;
                    }
                }
                console.log(`方格(${boxRow + 1},${boxCol + 1}): ${filled}个数字, ${9 - filled}个空格`);
            }
        }
        
        // 找出可以立即确定的空格
        console.log('可立即确定的空格:');
        let immediateCount = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] === 0) {
                    const candidates = this.getCandidates(this.grid, row, col);
                    if (candidates.length === 1) {
                        console.log(`位置(${row + 1},${col + 1})只能填入: ${candidates[0]}`);
                        immediateCount++;
                    }
                }
            }
        }
        console.log(`总共有${immediateCount}个空格可以立即确定答案`);
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
        // 使用更智能的方法创建谜题
        this.createBalancedPuzzle();
    }

    createBalancedPuzzle() {
        // 确保每行、每列、每个3x3方格都有合理的数字分布
        const targetEmptyCells = 45; // 目标空格数量
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            // 重新生成完整数独
            this.generateCompleteSudoku();
            this.solution = this.grid.map(row => [...row]);
            
            // 使用分层移除策略
            if (this.removeNumbersStrategically(targetEmptyCells)) {
                // 验证谜题质量
                if (this.validatePuzzleQuality()) {
                    return;
                }
            }
            attempts++;
        }
        
        // 如果无法生成理想谜题，使用备用方案
        this.createFallbackPuzzle();
    }

    removeNumbersStrategically(targetEmpty) {
        const workingGrid = this.grid.map(row => [...row]);
        const removedCells = [];
        
        // 分阶段移除数字
        const phases = [
            { priority: 'corners', count: 8 },      // 先移除角落
            { priority: 'edges', count: 12 },       // 然后边缘
            { priority: 'random', count: targetEmpty - 20 } // 最后随机
        ];
        
        for (let phase of phases) {
            const candidates = this.getCandidatesForPhase(phase.priority, removedCells);
            this.shuffleArray(candidates);
            
            let removed = 0;
            for (let [row, col] of candidates) {
                if (removed >= phase.count) break;
                
                // 暂时移除这个数字
                const originalValue = this.grid[row][col];
                this.grid[row][col] = 0;
                
                // 检查是否仍然有唯一解
                if (this.hasUniqueSolution()) {
                    removedCells.push([row, col]);
                    removed++;
                } else {
                    // 恢复数字
                    this.grid[row][col] = originalValue;
                }
            }
        }
        
        return removedCells.length >= 35; // 至少移除35个数字
    }

    getCandidatesForPhase(priority, alreadyRemoved) {
        const candidates = [];
        const removedSet = new Set(alreadyRemoved.map(([r, c]) => `${r},${c}`));
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (removedSet.has(`${row},${col}`)) continue;
                
                let include = false;
                switch (priority) {
                    case 'corners':
                        include = this.isCornerOrNearCorner(row, col);
                        break;
                    case 'edges':
                        include = this.isEdgeCell(row, col);
                        break;
                    case 'random':
                        include = true;
                        break;
                }
                
                if (include) {
                    candidates.push([row, col]);
                }
            }
        }
        
        return candidates;
    }

    isCornerOrNearCorner(row, col) {
        // 角落和靠近角落的位置
        const corners = [
            [0, 0], [0, 1], [1, 0], [1, 1],
            [0, 8], [0, 7], [1, 8], [1, 7],
            [8, 0], [8, 1], [7, 0], [7, 1],
            [8, 8], [8, 7], [7, 8], [7, 7]
        ];
        return corners.some(([r, c]) => r === row && c === col);
    }

    isEdgeCell(row, col) {
        return row === 0 || row === 8 || col === 0 || col === 8;
    }

    hasUniqueSolution() {
        // 简化的唯一解检查 - 尝试用逻辑推理解决
        const testGrid = this.grid.map(row => [...row]);
        return this.canSolveLogically(testGrid);
    }

    canSolveLogically(grid) {
        let changed = true;
        let iterations = 0;
        const maxIterations = 20;
        
        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;
            
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (grid[row][col] === 0) {
                        const candidates = this.getCandidates(grid, row, col);
                        
                        if (candidates.length === 1) {
                            grid[row][col] = candidates[0];
                            changed = true;
                        }
                    }
                }
            }
        }
        
        // 检查是否解决了大部分空格
        let emptyCells = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) emptyCells++;
            }
        }
        
        return emptyCells < 20; // 如果剩余空格少于20个，认为可以逻辑推理
    }

    getCandidates(grid, row, col) {
        const candidates = [];
        
        for (let num = 1; num <= 9; num++) {
            if (this.isValidMoveInGrid(grid, row, col, num)) {
                candidates.push(num);
            }
        }
        
        return candidates;
    }

    isValidMoveInGrid(grid, row, col, num) {
        // 检查行
        for (let c = 0; c < 9; c++) {
            if (grid[row][c] === num) return false;
        }
        
        // 检查列
        for (let r = 0; r < 9; r++) {
            if (grid[r][col] === num) return false;
        }
        
        // 检查3x3方格
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (grid[r][c] === num) return false;
            }
        }
        
        return true;
    }

    validatePuzzleQuality() {
        // 验证谜题质量
        const quality = this.analyzePuzzleQuality();
        return quality.hasImmediateSolution && 
               quality.balancedDistribution && 
               quality.reasonableDifficulty;
    }

    analyzePuzzleQuality() {
        const analysis = {
            hasImmediateSolution: false,
            balancedDistribution: false,
            reasonableDifficulty: false
        };
        
        // 检查是否至少有一个空格可以立即确定答案
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] === 0) {
                    const candidates = this.getCandidates(this.grid, row, col);
                    if (candidates.length === 1) {
                        analysis.hasImmediateSolution = true;
                        break;
                    }
                }
            }
            if (analysis.hasImmediateSolution) break;
        }
        
        // 检查分布是否均衡
        analysis.balancedDistribution = this.checkBalancedDistribution();
        
        // 检查难度是否合理
        const emptyCells = this.countEmptyCells();
        analysis.reasonableDifficulty = emptyCells >= 35 && emptyCells <= 55;
        
        return analysis;
    }

    checkBalancedDistribution() {
        // 检查每行、每列、每个3x3方格的数字分布
        const minFilled = 3; // 每行/列/方格至少3个数字
        const maxFilled = 7; // 每行/列/方格最多7个数字
        
        // 检查行
        for (let row = 0; row < 9; row++) {
            const filled = this.grid[row].filter(cell => cell !== 0).length;
            if (filled < minFilled || filled > maxFilled) return false;
        }
        
        // 检查列
        for (let col = 0; col < 9; col++) {
            const filled = this.grid.map(row => row[col]).filter(cell => cell !== 0).length;
            if (filled < minFilled || filled > maxFilled) return false;
        }
        
        // 检查3x3方格
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                let filled = 0;
                for (let r = boxRow * 3; r < (boxRow + 1) * 3; r++) {
                    for (let c = boxCol * 3; c < (boxCol + 1) * 3; c++) {
                        if (this.grid[r][c] !== 0) filled++;
                    }
                }
                if (filled < minFilled || filled > maxFilled) return false;
            }
        }
        
        return true;
    }

    countEmptyCells() {
        let count = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] === 0) count++;
            }
        }
        return count;
    }

    createFallbackPuzzle() {
        // 备用方案：创建一个简单但合理的谜题
        this.generateCompleteSudoku();
        this.solution = this.grid.map(row => [...row]);
        
        // 使用预定义的移除模式
        const removePattern = [
            [0,1], [0,3], [0,5], [0,7],
            [1,0], [1,2], [1,6], [1,8],
            [2,1], [2,4], [2,7],
            [3,2], [3,5], [3,8],
            [4,0], [4,3], [4,6],
            [5,1], [5,4], [5,7],
            [6,0], [6,3], [6,6],
            [7,2], [7,5], [7,8],
            [8,1], [8,4], [8,7],
            // 添加更多移除位置确保每个区域都有空格
            [0,8], [1,4], [2,0], [3,6], [4,2], [5,8], [6,4], [7,0], [8,6],
            [2,2], [2,6], [3,0], [3,4], [4,8], [5,2], [6,8], [7,4], [8,0],
            [0,2], [1,7], [2,3], [3,1], [4,5], [5,0], [6,2], [7,6], [8,3]
        ];
        
        // 移除指定位置的数字
        removePattern.forEach(([row, col]) => {
            if (row < 9 && col < 9) {
                this.grid[row][col] = 0;
            }
        });
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