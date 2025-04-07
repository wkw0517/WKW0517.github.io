document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const equation1Input = document.getElementById('equation1');
    const equation2Input = document.getElementById('equation2');
    const solveBtn = document.getElementById('solve-btn');
    const randomBtn = document.getElementById('random-btn');
    const stepContainer = document.getElementById('step-container');
    const equationBlocks = document.querySelector('.equation-blocks');
    const solutionResult = document.getElementById('solution-result');
    
    // 状态变量
    let currentStep = 0;
    let steps = [];
    let equations = [];
    let selectedElement = null;
    let dragStartPosition = { x: 0, y: 0 };
    let dropTarget = null;
    
    // 触摸事件变量
    let touchDragging = false;
    let touchElement = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoveX = 0;
    let touchMoveY = 0;
    
    // 分数缓存系统
    const fractionCache = {
        cache: {},
        set: function(decimal, fractionHtml) {
            this.cache[decimal] = fractionHtml;
        },
        get: function(decimal) {
            return this.cache[decimal];
        },
        has: function(decimal) {
            return decimal in this.cache;
        },
        clear: function() {
            this.cache = {};
        }
    };
    
    // 解析方程字符串为结构化对象
    function parseEquation(equationStr) {
        // 简单解析方程，将其分为左右两部分
        const sides = equationStr.split('=');
        if (sides.length !== 2) {
            throw new Error('无效的方程格式，必须包含一个等号');
        }
        
        const leftSide = sides[0].trim();
        const rightSide = sides[1].trim();
        
        // 解析左侧
        const leftTerms = parseTerms(leftSide);
        
        // 解析右侧
        const rightTerms = parseTerms(rightSide);
        
        return {
            leftSide: leftTerms,
            rightSide: rightTerms
        };
    }
    
    // 将项解析为系数和变量
    function parseTerms(expression) {
        // 替换减号为加上负数，便于分割
        expression = expression.replace(/\s*-\s*/g, ' + -');
        const termsStr = expression.split('+');
        
        const terms = [];
        
        for (let term of termsStr) {
            term = term.trim();
            if (!term) continue;
            
            let coefficient = 1;
            let variable = '';
            
            if (term.includes('x')) {
                const parts = term.split('x');
                if (parts[0] === '-') {
                    coefficient = -1;
                } else if (parts[0] === '') {
                    coefficient = 1;
                } else {
                    coefficient = parseFloat(parts[0]);
                }
                variable = 'x';
            } else if (term.includes('y')) {
                const parts = term.split('y');
                if (parts[0] === '-') {
                    coefficient = -1;
                } else if (parts[0] === '') {
                    coefficient = 1;
                } else {
                    coefficient = parseFloat(parts[0]);
                }
                variable = 'y';
            } else {
                // 常数项
                coefficient = parseFloat(term);
                variable = '';
            }
            
            terms.push({
                coefficient,
                variable,
                termType: variable ? (variable === 'x' ? 'x-term' : 'y-term') : 'constant'
            });
        }
        
        return terms;
    }
    
    // 将小数转换为分数字符串表示 - 优化版
    function decimalToFraction(decimal) {
        // 特殊值处理
        if (decimal === 0) return "0";
        if (Number.isInteger(decimal)) return decimal.toString();
        
        // 检查缓存
        if (fractionCache.has(decimal)) {
            return fractionCache.get(decimal);
        }
        
        // 安全检查：如果数值太大或太小，返回固定表示
        if (Math.abs(decimal) > 1000 || Math.abs(decimal) < 0.001) {
            const result = decimal.toFixed(2);
            fractionCache.set(decimal, result);
            return result;
        }
        
        // 处理负数
        const sign = decimal < 0 ? -1 : 1;
        decimal = Math.abs(decimal);
        
        // 对于接近整数的值，使用整数表示
        if (Math.abs(decimal - Math.round(decimal)) < 0.0001) {
            const result = (Math.round(decimal) * sign).toString();
            fractionCache.set(decimal, result);
            return result;
        }
        
        // 简单分数近似 - 使用有限步骤，避免无限循环
        let bestNumerator = 1;
        let bestDenominator = 1;
        let bestError = Math.abs(decimal - 1);
        
        // 尝试用小分母(<100)进行逼近
        for (let denominator = 1; denominator <= 40; denominator++) {
            const numerator = Math.round(decimal * denominator);
            const error = Math.abs(decimal - numerator / denominator);
            
            if (error < bestError) {
                bestNumerator = numerator;
                bestDenominator = denominator;
                bestError = error;
                
                // 如果误差足够小，提前退出
                if (error < 0.0001) break;
            }
        }
        
        // 简化分数
        const gcd = findGCD(bestNumerator, bestDenominator);
        bestNumerator = bestNumerator / gcd;
        bestDenominator = bestDenominator / gcd;
        
        // 构建分数HTML
        let result;
        if (bestDenominator === 1) {
            result = (bestNumerator * sign).toString();
        } else {
            result = `<div class="fraction">
                        <div class="numerator">${bestNumerator * sign}</div>
                        <div class="denominator">${bestDenominator}</div>
                    </div>`;
        }
        
        // 保存到缓存
        fractionCache.set(decimal, result);
        return result;
    }
    
    // 计算最大公约数，用于简化分数
    function findGCD(a, b) {
        a = Math.abs(a);
        b = Math.abs(b);
        if (b > a) {
            let temp = a;
            a = b;
            b = temp;
        }
        while (true) {
            if (b === 0) return a;
            a %= b;
            if (a === 0) return b;
            b %= a;
        }
    }
    
    // 创建方程可视化元素
    function createEquationVisualization(equation, containerId) {
        const container = document.getElementById(containerId) || stepContainer;
        
        const equationDiv = document.createElement('div');
        equationDiv.className = 'equation-visualization';
        
        // 添加方程标签（如果需要）
        if (containerId && containerId.includes('eq-vis-')) {
            const eqIndex = containerId.split('-').pop();
            const eqLabel = document.createElement('div');
            eqLabel.className = 'equation-label';
            eqLabel.textContent = `方程 ${parseInt(eqIndex) + 1}`;
            equationDiv.appendChild(eqLabel);
        }
        
        // 创建左侧行
        const leftRow = document.createElement('div');
        leftRow.className = 'equation-row';
        
        // 创建左侧
        const leftSideContainer = document.createElement('div');
        leftSideContainer.className = 'equation-side left-side';
        
        equation.leftSide.forEach((term, index) => {
            const termElement = createTermElement(term);
            
            // 添加符号
            if (index > 0 || term.coefficient < 0) {
                const operator = document.createElement('span');
                operator.className = term.coefficient < 0 ? 'operator minus-sign' : 'operator';
                
                if (term.coefficient < 0) {
                    // 使用span包装减号内容，以便CSS可以隐藏它
                    const minusContent = document.createElement('span');
                    minusContent.textContent = '-';
                    operator.appendChild(minusContent);
                } else {
                    operator.textContent = '+';
                }
                
                // 设置文本颜色与后一项背景色匹配
                let textColor;
                if (term.termType === 'x-term') {
                    textColor = 'var(--x-term-color)';
                } else if (term.termType === 'y-term') {
                    textColor = 'var(--y-term-color)';
                } else {
                    // 常数项
                    textColor = 'var(--constant-color)';
                }
                operator.style.color = textColor;
                
                leftSideContainer.appendChild(operator);
            }
            
            leftSideContainer.appendChild(termElement);
        });
        
        if (equation.leftSide.length === 0) {
            // 如果左侧为空，添加0
            const zeroElement = document.createElement('div');
            zeroElement.className = 'equation-element constant';
            zeroElement.textContent = '0';
            leftSideContainer.appendChild(zeroElement);
        }
        
        leftRow.appendChild(leftSideContainer);
        
        // 添加等号
        const equalSign = document.createElement('span');
        equalSign.className = 'equal-sign';
        equalSign.textContent = '=';
        leftRow.appendChild(equalSign);
        
        // 创建右侧
        const rightSideContainer = document.createElement('div');
        rightSideContainer.className = 'equation-side right-side';
        
        equation.rightSide.forEach((term, index) => {
            const termElement = createTermElement(term);
            
            // 添加符号
            if (index > 0 || term.coefficient < 0) {
                const operator = document.createElement('span');
                operator.className = term.coefficient < 0 ? 'operator minus-sign' : 'operator';
                
                if (term.coefficient < 0) {
                    // 使用span包装减号内容，以便CSS可以隐藏它
                    const minusContent = document.createElement('span');
                    minusContent.textContent = '-';
                    operator.appendChild(minusContent);
                } else {
                    operator.textContent = '+';
                }
                
                // 设置文本颜色与后一项背景色匹配
                let textColor;
                if (term.termType === 'x-term') {
                    textColor = 'var(--x-term-color)';
                } else if (term.termType === 'y-term') {
                    textColor = 'var(--y-term-color)';
                } else {
                    // 常数项
                    textColor = 'var(--constant-color)';
                }
                operator.style.color = textColor;
                
                rightSideContainer.appendChild(operator);
            }
            
            rightSideContainer.appendChild(termElement);
        });
        
        if (equation.rightSide.length === 0) {
            // 如果右侧为空，添加0
            const zeroElement = document.createElement('div');
            zeroElement.className = 'equation-element constant';
            zeroElement.textContent = '0';
            rightSideContainer.appendChild(zeroElement);
        }
        
        leftRow.appendChild(rightSideContainer);
        equationDiv.appendChild(leftRow);
        
        // 如果有第二个方程（二元方程组），添加水平分隔线
        if (containerId && containerId.includes('eq-vis-') && parseInt(containerId.split('-').pop()) === 0 && equations.length > 1) {
            const divider = document.createElement('div');
            divider.className = 'equation-divider';
            equationDiv.appendChild(divider);
        }
        
        container.appendChild(equationDiv);
        return equationDiv;
    }
    
    // 创建方程项元素 - 增强版，支持代入替换的可视化
    function createTermElement(term) {
        // 处理被替换的项 - 使用专门的函数创建
        if (term.isSubstituted) {
            return createSubstitutedTermElement(term);
        }
        
        // 处理操作符
        if (term.isOperator) {
            const element = document.createElement('div');
            element.className = 'operator';
            element.textContent = term.value;
            element.style.height = '40px'; // 确保高度一致
            return element;
        }
        
        // 正常的项处理
        const element = document.createElement('div');
        element.className = `equation-element ${term.termType}`;
        element.dataset.variable = term.variable;
        element.dataset.coefficient = term.coefficient;
        element.style.height = '40px'; // 确保高度一致
        
        // 处理系数显示
        let displayCoefficient = Math.abs(term.coefficient);
        let displayHtml = '';
        
        // 系数为1且有变量时，不显示系数
        if (displayCoefficient === 1 && term.variable) {
            // 系数为1时，只显示变量
            displayHtml = '';
        } else {
            // 其他情况，使用分数表示系数
            displayHtml = decimalToFraction(displayCoefficient);
        }
        
        // 设置显示内容
        if (term.coefficient < 0) {
            // 负系数处理
            const operator = document.createElement('span');
            operator.className = 'operator minus-sign';
            
            // 使用span包装减号内容，以便CSS可以隐藏它
            const minusContent = document.createElement('span');
            minusContent.textContent = '-';
            operator.appendChild(minusContent);
            
            // 设置文本颜色与项背景色匹配
            let textColor;
            if (term.termType === 'x-term') {
                textColor = 'var(--x-term-color)';
            } else if (term.termType === 'y-term') {
                textColor = 'var(--y-term-color)';
            } else {
                // 常数项
                textColor = 'var(--constant-color)';
            }
            operator.style.color = textColor;
            
            operator.style.height = '40px'; // 确保高度一致
            element.parentNode?.insertBefore(operator, element);
        }
        
        element.innerHTML = `${displayHtml}${term.variable}`;
        
        // 添加拖拽功能
        element.draggable = true;
        element.addEventListener('dragstart', handleDragStart);
        element.addEventListener('dragend', handleDragEnd);
        
        // 添加触摸事件处理
        element.addEventListener('touchstart', handleTouchStart, { passive: false });
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        return element;
    }
    
    // 触摸事件处理函数
    function handleTouchStart(e) {
        e.preventDefault(); // 阻止默认行为
        touchDragging = true;
        touchElement = e.target;
        
        // 记录起始触摸位置
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        
        // 添加视觉反馈
        touchElement.classList.add('dragging');
        touchElement.style.opacity = '0.7';
        touchElement.style.boxShadow = '0 0 10px rgba(52, 152, 219, 0.7)';
        
        // 创建一个悬浮克隆元素跟随手指移动
        const clone = touchElement.cloneNode(true);
        clone.id = 'touch-clone';
        clone.style.position = 'fixed';
        clone.style.left = touchStartX + 'px';
        clone.style.top = touchStartY + 'px';
        clone.style.zIndex = '1000';
        clone.style.pointerEvents = 'none';
        clone.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(clone);
    }
    
    function handleTouchMove(e) {
        if (!touchDragging) return;
        e.preventDefault(); // 阻止页面滚动
        
        // 更新克隆元素位置
        const touch = e.touches[0];
        touchMoveX = touch.clientX;
        touchMoveY = touch.clientY;
        
        const clone = document.getElementById('touch-clone');
        if (clone) {
            clone.style.left = touchMoveX + 'px';
            clone.style.top = touchMoveY + 'px';
        }
        
        // 获取当前触摸点下的元素
        const elementUnderTouch = document.elementFromPoint(touchMoveX, touchMoveY);
        
        // 清除所有悬停效果
        document.querySelectorAll('.drag-hover-substitute, .drag-hover-move, .drag-hover-combine').forEach(el => {
            el.classList.remove('drag-hover-substitute', 'drag-hover-move', 'drag-hover-combine');
        });
        
        if (!elementUnderTouch) return;
        
        // 获取基本信息
        const equationElement = touchElement.closest('.interactive-equation');
        const equationIndex = parseInt(equationElement.dataset.equationIndex);
        const sourceSide = touchElement.dataset.side;
        const sourceVariable = touchElement.dataset.variable;
        
        // 获取目标信息
        const targetElement = elementUnderTouch;
        const isTargetTermElement = targetElement && targetElement.classList.contains('equation-element');
        
        // 获取目标方程元素
        const targetEquationElement = targetElement && targetElement.closest('.interactive-equation');
        const isDifferentEquation = targetEquationElement && 
                                targetEquationElement !== equationElement;
        
        // 获取目标侧信息
        let targetSide = null;
        if (targetElement && targetElement.dataset && targetElement.dataset.side) {
            targetSide = targetElement.dataset.side;
        } else if (targetElement) {
            // 尝试从父元素获取侧信息
            const sideElement = targetElement.closest('.left-side, .right-side');
            if (sideElement) {
                targetSide = sideElement.classList.contains('left-side') ? 'left' : 'right';
            }
        }
        
        const isDifferentSide = sourceSide !== targetSide;
        
        // 检查是否拖到了相同变量的项上
        const targetVariable = targetElement && targetElement.dataset && targetElement.dataset.variable;
        const isSameVariable = sourceVariable === targetVariable;
        
        // 应用视觉悬停效果
        if (isDifferentEquation && targetElement && (sourceVariable === 'x' || sourceVariable === 'y')) {
            // 代入操作悬停效果
            const highlightTarget = targetElement.closest('.equation-row') || targetElement;
            highlightTarget.classList.add('drag-hover-substitute');
        } else if (!isDifferentEquation && isDifferentSide && targetElement) {
            // 移项操作悬停效果
            const targetSideElement = targetElement.closest('.left-side, .right-side');
            if (targetSideElement) {
                targetSideElement.classList.add('drag-hover-move');
            }
        } else if (!isDifferentEquation && !isDifferentSide && isSameVariable && isTargetTermElement) {
            // 合并同类项悬停效果
            targetElement.classList.add('drag-hover-combine');
        }
    }
    
    function handleTouchEnd(e) {
        if (!touchDragging) return;
        e.preventDefault();
        
        // 移除克隆元素
        const clone = document.getElementById('touch-clone');
        if (clone) {
            document.body.removeChild(clone);
        }
        
        // 清除视觉样式
        touchElement.classList.remove('dragging');
        touchElement.style.opacity = '';
        touchElement.style.boxShadow = '';
        
        // 清除所有拖拽悬停效果
        document.querySelectorAll('.drag-hover-substitute, .drag-hover-move, .drag-hover-combine').forEach(el => {
            el.classList.remove('drag-hover-substitute', 'drag-hover-move', 'drag-hover-combine');
        });
        
        // 获取方程索引
        const equationElement = touchElement.closest('.interactive-equation');
        const equationIndex = parseInt(equationElement.dataset.equationIndex);
        
        // 获取最终触摸位置下的元素
        const targetElement = document.elementFromPoint(touchMoveX, touchMoveY);
        
        // 如果没有目标元素，结束操作
        if (!targetElement) {
            touchDragging = false;
            touchElement = null;
            return;
        }
        
        // 获取拖拽项和目标项的基本信息
        const sourceSide = touchElement.dataset.side; // 'left' 或 'right'
        const sourceVariable = touchElement.dataset.variable;
        
        // 检查目标是否是方程元素
        const isTargetTermElement = targetElement && targetElement.classList.contains('equation-element');
        
        // 获取目标方程元素
        const targetEquationElement = targetElement && targetElement.closest('.interactive-equation');
        
        // 检查是否是不同方程
        const isDifferentEquation = targetEquationElement && 
                                  targetEquationElement !== equationElement;
                                  
        // 检查是否拖到了同一方程内但不同的一侧
        let targetSide = null;
        if (targetElement && targetElement.dataset && targetElement.dataset.side) {
            targetSide = targetElement.dataset.side;
        } else if (targetElement) {
            // 尝试从父元素获取侧信息
            const sideElement = targetElement.closest('.left-side, .right-side');
            if (sideElement) {
                targetSide = sideElement.classList.contains('left-side') ? 'left' : 'right';
            }
        }
        
        const isDifferentSide = sourceSide !== targetSide;
        
        // 检查是否拖到了相同变量的项上
        const targetVariable = targetElement && targetElement.dataset && targetElement.dataset.variable;
        const isSameVariable = sourceVariable === targetVariable;
        
        // 处理不同的操作类型
        if (isDifferentEquation && targetEquationElement) {
            // 代入操作
            if (sourceVariable === 'x' || sourceVariable === 'y') {
                const targetEquationIndex = parseInt(targetEquationElement.dataset.equationIndex);
                performSubstituteOperation(touchElement, targetElement, equationIndex, targetEquationIndex);
            }
        } else if (!isDifferentEquation && isDifferentSide && targetElement) {
            // 移项操作
            moveTermToOtherSide(touchElement, equations[equationIndex]);
        } else if (!isDifferentEquation && !isDifferentSide && isSameVariable && isTargetTermElement) {
            // 合并同类项
            performCombineOperation(equationIndex, targetElement);
        }
        
        // 重置触摸状态
        touchDragging = false;
        touchElement = null;
    }
    
    // 拖拽事件处理
    function handleDragStart(e) {
        selectedElement = e.target;
        e.dataTransfer.setData('text/plain', '');
        e.target.classList.add('dragging');
        
        // 记录起始位置
        dragStartPosition.x = e.clientX;
        dragStartPosition.y = e.clientY;
        
        // 添加视觉反馈
        e.target.style.opacity = '0.7';
        e.target.style.boxShadow = '0 0 10px rgba(52, 152, 219, 0.7)';
    }
    
    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        e.target.style.opacity = '';
        e.target.style.boxShadow = '';
        
        // 清除所有拖拽悬停效果
        document.querySelectorAll('.drag-hover-substitute, .drag-hover-move, .drag-hover-combine').forEach(el => {
            el.classList.remove('drag-hover-substitute', 'drag-hover-move', 'drag-hover-combine');
        });
    }
    
    // 处理放置区域的拖拽交互
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (!selectedElement) return;
        
        // 记录当前悬停的目标
        dropTarget = e.target;
        
        // 清除所有悬停效果
        document.querySelectorAll('.drag-hover-substitute, .drag-hover-move, .drag-hover-combine').forEach(el => {
            el.classList.remove('drag-hover-substitute', 'drag-hover-move', 'drag-hover-combine');
        });
        
        // 获取基本信息
        const equationElement = selectedElement.closest('.interactive-equation');
        const equationIndex = parseInt(equationElement.dataset.equationIndex);
        const sourceSide = selectedElement.dataset.side;
        const sourceVariable = selectedElement.dataset.variable;
        
        // 获取目标信息
        const targetElement = document.elementFromPoint(e.clientX, e.clientY);
        const isTargetTermElement = targetElement && targetElement.classList.contains('equation-element');
        
        // 获取目标方程元素
        const targetEquationElement = targetElement && targetElement.closest('.interactive-equation');
        const isDifferentEquation = targetEquationElement && 
                                 targetEquationElement !== equationElement;
        
        // 获取目标侧信息
        let targetSide = null;
        if (targetElement && targetElement.dataset && targetElement.dataset.side) {
            targetSide = targetElement.dataset.side;
        } else if (targetElement) {
            // 尝试从父元素获取侧信息
            const sideElement = targetElement.closest('.left-side, .right-side');
            if (sideElement) {
                targetSide = sideElement.classList.contains('left-side') ? 'left' : 'right';
            }
        }
        
        const isDifferentSide = sourceSide !== targetSide;
        
        // 检查是否拖到了相同变量的项上
        const targetVariable = targetElement && targetElement.dataset && targetElement.dataset.variable;
        const isSameVariable = sourceVariable === targetVariable;
        
        // 应用视觉悬停效果
        if (isDifferentEquation && targetElement && (sourceVariable === 'x' || sourceVariable === 'y')) {
            // 代入操作悬停效果
            const highlightTarget = targetElement.closest('.equation-row') || targetElement;
            highlightTarget.classList.add('drag-hover-substitute');
        } else if (!isDifferentEquation && isDifferentSide && targetElement) {
            // 移项操作悬停效果
            const targetSideElement = targetElement.closest('.left-side, .right-side');
            if (targetSideElement) {
                targetSideElement.classList.add('drag-hover-move');
            }
        } else if (!isDifferentEquation && !isDifferentSide && isSameVariable && isTargetTermElement) {
            // 合并同类项悬停效果
            targetElement.classList.add('drag-hover-combine');
        }
    }
    
    function handleDrop(e) {
        e.preventDefault();
        
        // 移除所有高亮效果和拖拽悬停效果
        document.querySelectorAll('.equation-row').forEach(row => {
            row.style.backgroundColor = '';
        });
        
        document.querySelectorAll('.drag-hover-substitute, .drag-hover-move, .drag-hover-combine').forEach(el => {
            el.classList.remove('drag-hover-substitute', 'drag-hover-move', 'drag-hover-combine');
        });
        
        if (!selectedElement) return;
        
        // 获取方程索引
        const equationElement = selectedElement.closest('.interactive-equation');
        const equationIndex = parseInt(equationElement.dataset.equationIndex);
        
        // 获取目标元素 - 扩大检测范围，不仅检查鼠标下的元素，还检查附近元素
        let targetElement = document.elementFromPoint(e.clientX, e.clientY);
        
        // 如果目标元素不是方程元素，尝试查找附近的方程元素
        if(!targetElement || !targetElement.classList.contains('equation-element')) {
            // 获取所有方程元素
            const termElements = document.querySelectorAll('.equation-element');
            let closestElement = null;
            let minDistance = 50; // 设置一个最大检测距离
            
            // 遍历所有方程元素，找到最近的一个
            termElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const elCenterX = rect.left + rect.width / 2;
                const elCenterY = rect.top + rect.height / 2;
                const distance = Math.sqrt(
                    Math.pow(e.clientX - elCenterX, 2) + 
                    Math.pow(e.clientY - elCenterY, 2)
                );
                
                // 如果距离小于当前最小距离且不是拖动的元素本身
                if(distance < minDistance && el !== selectedElement) {
                    minDistance = distance;
                    closestElement = el;
                }
            });
            
            // 使用找到的最近元素作为目标
            if(closestElement) {
                targetElement = closestElement;
            }
        }
        
        // 获取拖拽项和目标项的基本信息
        const sourceSide = selectedElement.dataset.side; // 'left' 或 'right'
        const sourceVariable = selectedElement.dataset.variable;
        
        // 检查目标是否是方程元素
        const isTargetTermElement = targetElement && targetElement.classList.contains('equation-element');
        
        // 获取目标方程元素
        const targetEquationElement = targetElement && targetElement.closest('.interactive-equation');
        
        // 检查是否是不同方程
        const isDifferentEquation = targetEquationElement && 
                                  targetEquationElement !== equationElement;
                                  
        // 检查是否拖到了同一方程内但不同的一侧
        let targetSide = null;
        if (targetElement && targetElement.dataset && targetElement.dataset.side) {
            targetSide = targetElement.dataset.side;
        } else if (targetElement) {
            // 尝试从父元素获取侧信息
            const sideElement = targetElement.closest('.left-side, .right-side');
            if (sideElement) {
                targetSide = sideElement.classList.contains('left-side') ? 'left' : 'right';
            }
        }
        
        const isDifferentSide = sourceSide !== targetSide;
        
        // 检查是否拖到了相同变量的项上
        const targetVariable = targetElement && targetElement.dataset && targetElement.dataset.variable;
        const isSameVariable = sourceVariable === targetVariable;
        
        // 日志信息，帮助调试
        console.log('拖拽操作信息:', {
            sourceEquation: equationIndex,
            sourceSide,
            sourceVariable,
            targetEquation: targetEquationElement ? parseInt(targetEquationElement.dataset.equationIndex) : null,
            targetSide,
            targetVariable,
            isDifferentEquation,
            isDifferentSide,
            isSameVariable
        });
        
        // 判断操作类型:
        
        // 1. 拖拽到另一个方程 => 代入操作
        if (isDifferentEquation && targetEquationElement) {
            // 简单检查是否是变量项，只有变量项能被代入
            if (sourceVariable === 'x' || sourceVariable === 'y') {
                // 添加视觉反馈
                targetElement.classList.add('highlight-substitute');
                setTimeout(() => {
                    targetElement.classList.remove('highlight-substitute');
                }, 800);
                
                performSubstituteOperation(
                    selectedElement,
                    targetElement,
                    equationIndex,
                    parseInt(targetEquationElement.dataset.equationIndex)
                );
            }
        } 
        // 2. 拖拽到同一方程的对侧 => 移项操作
        else if (!isDifferentEquation && isDifferentSide) {
            // 添加视觉反馈
            const targetSideElement = targetElement.closest('.left-side, .right-side');
            if (targetSideElement) {
                targetSideElement.classList.add('highlight-move');
                setTimeout(() => {
                    targetSideElement.classList.remove('highlight-move');
                }, 800);
            }
            
            performMoveOperation(equationIndex);
        } 
        // 3. 拖拽到同一方程的同侧，相同字母的项上 => 合并同类项
        else if (!isDifferentEquation && !isDifferentSide && isSameVariable && isTargetTermElement) {
            // 添加视觉反馈
            targetElement.classList.add('highlight-combine');
            setTimeout(() => {
                targetElement.classList.remove('highlight-combine');
            }, 800);
            
            performCombineOperation(equationIndex, targetElement);
        }
        // 4. 其他情况，默认为移项
        else {
            performMoveOperation(equationIndex);
        }
        
        selectedElement = null;
    }
    
    // 检查变量是否已隔离（在等式一边单独存在，系数为1或-1）
    function checkIfVariableIsIsolated(variable, equationIndex, side) {
        if (!variable || !equations[equationIndex]) return false;
        
        const eq = equations[equationIndex];
        const sideToCheck = side === 'left' ? 'leftSide' : 'rightSide';
        const otherSide = side === 'left' ? 'rightSide' : 'leftSide';
        
        // 检查该变量是否在这一边单独存在
        if (eq[sideToCheck].length === 1 && 
            eq[sideToCheck][0].variable === variable) {
            
            // 检查系数是否为1或-1
            const coefficient = eq[sideToCheck][0].coefficient;
            const isCoeffOne = Math.abs(coefficient) === 1;
            
            // 还需检查另一边是否没有该变量
            const hasVariableOnOtherSide = eq[otherSide].some(term => term.variable === variable);
            
            return isCoeffOne && !hasVariableOnOtherSide;
        }
        
        return false;
    }
    
    // 移项操作
    function moveTermToOtherSide(termElement, equation) {
        const term = {
            coefficient: parseFloat(termElement.dataset.coefficient),
            variable: termElement.dataset.variable,
            termType: termElement.className.split(' ')[1]
        };
        
        // 找出该项在哪一侧
        let isOnLeftSide = false;
        let termIndex = -1;
        
        for (let i = 0; i < equation.leftSide.length; i++) {
            if (equation.leftSide[i].variable === term.variable &&
                Math.abs(equation.leftSide[i].coefficient - term.coefficient) < 0.001) {
                isOnLeftSide = true;
                termIndex = i;
                break;
            }
        }
        
        if (termIndex === -1 && !isOnLeftSide) {
            for (let i = 0; i < equation.rightSide.length; i++) {
                if (equation.rightSide[i].variable === term.variable &&
                    Math.abs(equation.rightSide[i].coefficient - term.coefficient) < 0.001) {
                    termIndex = i;
                    break;
                }
            }
        }
        
        if (termIndex === -1) return equation; // 项未找到
        
        // 创建一个新的项，系数取反
        const newTerm = {
            coefficient: -term.coefficient,
            variable: term.variable,
            termType: term.termType
        };
        
        // 从原来的一侧移除，添加到另一侧
        if (isOnLeftSide) {
            equation.leftSide.splice(termIndex, 1);
            equation.rightSide.push(newTerm);
        } else {
            equation.rightSide.splice(termIndex, 1);
            equation.leftSide.push(newTerm);
        }
        
        return equation;
    }
    
    // 合并同类项
    function combineTerms(equation) {
        // 检查是否含有被代入的项
        const hasSubstitutedTerms = checkHasSubstitutedTerms(equation);
        
        // 复制方程以防止直接修改原始方程
        const newEquation = {
            leftSide: [],
            rightSide: []
        };
        
        // 处理被代入项并展开计算
        ['leftSide', 'rightSide'].forEach(side => {
            equation[side].forEach(term => {
                if (term.isSubstituted) {
                    // 展开代入项计算
                    term.expressionTerms.forEach(exprTerm => {
                        const newCoeff = term.originalCoeff * exprTerm.coefficient;
                        newEquation[side].push({
                            coefficient: newCoeff,
                            variable: exprTerm.variable,
                            termType: exprTerm.variable ? 
                                (exprTerm.variable === 'x' ? 'x-term' : 'y-term') : 
                                'constant'
                        });
                    });
                } else {
                    // 原始项直接保留
                    newEquation[side].push({...term});
                }
            });
        });
        
        // 合并左侧同类项
        const leftCombined = {};
        
        for (const term of newEquation.leftSide) {
            const key = term.variable || 'constant';
            if (!leftCombined[key]) {
                leftCombined[key] = {
                    coefficient: 0,
                    variable: term.variable,
                    termType: term.termType
                };
            }
            leftCombined[key].coefficient += term.coefficient;
        }
        
        // 合并右侧同类项
        const rightCombined = {};
        
        for (const term of newEquation.rightSide) {
            const key = term.variable || 'constant';
            if (!rightCombined[key]) {
                rightCombined[key] = {
                    coefficient: 0,
                    variable: term.variable,
                    termType: term.termType
                };
            }
            rightCombined[key].coefficient += term.coefficient;
        }
        
        // 重建方程
        newEquation.leftSide = Object.values(leftCombined).filter(term => Math.abs(term.coefficient) > 0.0001);
        newEquation.rightSide = Object.values(rightCombined).filter(term => Math.abs(term.coefficient) > 0.0001);
        
        return newEquation;
    }
    
    // 检查方程中是否有被代入的项
    function checkHasSubstitutedTerms(equation) {
        for (const side of ['leftSide', 'rightSide']) {
            for (const term of equation[side]) {
                if (term.isSubstituted) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // 解方程
    function solveEquation(equations) {
        // 这里只实现简单的二元一次方程组解法
        if (equations.length !== 2) {
            throw new Error('目前只支持二元一次方程组');
        }
        
        // 找出x和y的系数以及常数项
        const eq1 = getCoefficients(equations[0]);
        const eq2 = getCoefficients(equations[1]);
        
        // 消元法解方程组
        const steps = [];
        
        // 记录初始步骤
        steps.push({
            description: '初始方程组',
            equations: JSON.parse(JSON.stringify(equations))
        });
        
        // 确保第一个方程中x的系数不为0
        if (eq1.x === 0) {
            // 交换两个方程
            [equations[0], equations[1]] = [equations[1], equations[0]];
            [eq1, eq2] = [eq2, eq1];
            
            steps.push({
                description: '交换两个方程，确保第一个方程中x的系数不为0',
                equations: JSON.parse(JSON.stringify(equations))
            });
        }
        
        // 消元过程
        if (eq1.x !== 0 && eq2.x !== 0) {
            // 消除x
            const ratio = eq2.x / eq1.x;
            
            const newEq2 = {
                leftSide: [],
                rightSide: []
            };
            
            // 记录第一个方程乘以系数的步骤
            const scaledEq1 = scaleEquation(equations[0], ratio);
            steps.push({
                description: `将第一个方程乘以${ratio.toFixed(2)}`,
                equations: [
                    equations[0],
                    scaledEq1
                ]
            });
            
            // 方程相减
            newEq2.leftSide = [
                { coefficient: 0, variable: 'x', termType: 'x-term' },
                { coefficient: eq2.y - ratio * eq1.y, variable: 'y', termType: 'y-term' }
            ].filter(term => term.coefficient !== 0);
            
            newEq2.rightSide = [
                { coefficient: eq2.constant - ratio * eq1.constant, variable: '', termType: 'constant' }
            ];
            
            equations[1] = newEq2;
            
            steps.push({
                description: '从第二个方程中减去缩放后的第一个方程，消除x项',
                equations: [equations[0], newEq2]
            });
            
            // 计算y的值
            const y = newEq2.rightSide[0].coefficient / newEq2.leftSide[0].coefficient;
            
            // 将y值代入第一个方程求解x
            const x = (eq1.constant - eq1.y * y) / eq1.x;
            
            steps.push({
                description: `求解: y = ${y.toFixed(2)}`,
                solution: { y }
            });
            
            steps.push({
                description: `将y值代入第一个方程: ${eq1.x.toFixed(2)}x + ${eq1.y.toFixed(2)} × ${y.toFixed(2)} = ${eq1.constant.toFixed(2)}`,
                solution: { x, y }
            });
            
            steps.push({
                description: `求解: x = ${x.toFixed(2)}`,
                solution: { x, y }
            });
            
            return {
                steps,
                solution: { x, y }
            };
        }
        
        throw new Error('无法解决该方程组，请检查方程是否有效');
    }
    
    // 从方程对象中提取系数
    function getCoefficients(equation) {
        let xCoeff = 0;
        let yCoeff = 0;
        let constant = 0;
        
        // 处理左边
        for (const term of equation.leftSide) {
            if (term.variable === 'x') {
                xCoeff += term.coefficient;
            } else if (term.variable === 'y') {
                yCoeff += term.coefficient;
            } else {
                constant -= term.coefficient; // 移到右侧为正
            }
        }
        
        // 处理右边
        for (const term of equation.rightSide) {
            if (term.variable === 'x') {
                xCoeff -= term.coefficient; // 移到左侧为正
            } else if (term.variable === 'y') {
                yCoeff -= term.coefficient; // 移到左侧为正
            } else {
                constant += term.coefficient;
            }
        }
        
        return { x: xCoeff, y: yCoeff, constant };
    }
    
    // 缩放方程
    function scaleEquation(equation, factor) {
        const scaledEquation = {
            leftSide: equation.leftSide.map(term => ({
                coefficient: term.coefficient * factor,
                variable: term.variable,
                termType: term.termType
            })),
            rightSide: equation.rightSide.map(term => ({
                coefficient: term.coefficient * factor,
                variable: term.variable,
                termType: term.termType
            }))
        };
        
        return scaledEquation;
    }
    
    // 显示解题步骤
    function displaySolutionSteps(solutionData) {
        steps = solutionData.steps;
        currentStep = 0;
        
        displayStep(currentStep);
        
        // 显示最终结果
        const { x, y } = solutionData.solution;
        solutionResult.innerHTML = `<p>x = ${x.toFixed(2)}</p><p>y = ${y.toFixed(2)}</p>`;
    }
    
    // 添加代入操作的视觉标记
    function markSubstitutionInEquation(equation, substitutedVariable) {
        const containerDiv = document.createElement('div');
        containerDiv.className = 'substitution-mark';
        
        const arrowIcon = document.createElement('div');
        arrowIcon.className = 'substitution-arrow';
        arrowIcon.innerHTML = '&#8680;'; // 右箭头
        
        const textDiv = document.createElement('div');
        textDiv.className = 'substitution-text';
        textDiv.textContent = `代入${substitutedVariable}`;
        
        containerDiv.appendChild(arrowIcon);
        containerDiv.appendChild(textDiv);
        
        return containerDiv;
    }
    
    // 显示当前步骤
    function displayStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= steps.length) return;
        
        const step = steps[stepIndex];
        
        stepContainer.innerHTML = '';
        
        const descriptionEl = document.createElement('div');
        descriptionEl.className = 'step-description';
        descriptionEl.textContent = step.description;
        stepContainer.appendChild(descriptionEl);
        
        // 显示代入表达式（如果有）
        if (step.substitution) {
            const substitutionEl = document.createElement('div');
            substitutionEl.className = 'substitution-expression';
            
            // 使用定义好的CSS类来优化显示
            substitutionEl.innerHTML = `
                <span class="expr-title">代入表达式:</span> 
                <span class="expr-value">${step.substitution.variable} = ${step.substitution.expression}</span>
                <span class="expr-info">
                    (从方程 ${step.substitution.fromEquation + 1} 到方程 ${step.substitution.toEquation + 1})
                </span>
            `;
            
            // 添加可视化图标
            const visualIndicator = document.createElement('div');
            visualIndicator.className = 'visual-substitution';
            visualIndicator.innerHTML = `
                <div class="substitution-process">
                    <div class="substitution-step">
                        <div class="step-label">原方程:</div>
                        <div class="equation-number">方程 ${step.substitution.fromEquation + 1}</div>
                    </div>
                    <div class="substitution-arrow">→</div>
                    <div class="substitution-step">
                        <div class="step-label">代入后:</div>
                        <div class="equation-number">方程 ${step.substitution.toEquation + 1}</div>
                    </div>
                </div>
                <div class="icon-container">
                    <span class="variable-icon ${step.substitution.variable}-term">${step.substitution.variable}</span>
                    <span class="arrow-icon">⟹</span>
                    <span class="expression-icon">(${step.substitution.expression})</span>
                </div>
            `;
            
            substitutionEl.appendChild(visualIndicator);
            stepContainer.appendChild(substitutionEl);
        }
        
        if (step.equations) {
            // 创建方程组容器
            const equationsContainer = document.createElement('div');
            equationsContainer.className = 'equations-container';
            equationsContainer.style.width = '100%';
            equationsContainer.style.marginTop = '15px';
            
            // 显示方程
            step.equations.forEach((eq, i) => {
                const eqNum = document.createElement('div');
                eqNum.className = 'equation-number';
                eqNum.textContent = `方程 ${i + 1}:`;
                equationsContainer.appendChild(eqNum);
                
                // 创建一个容器包含每个方程的可视化
                const eqVisContainer = document.createElement('div');
                eqVisContainer.id = `eq-vis-${i}`;
                eqVisContainer.style.marginBottom = '20px';
                equationsContainer.appendChild(eqVisContainer);
                
                createEquationVisualization(eq, `eq-vis-${i}`);
            });
            
            stepContainer.appendChild(equationsContainer);
        }
        
        if (step.solution) {
            const solutionEl = document.createElement('div');
            solutionEl.className = 'step-solution';
            
            for (const [variable, value] of Object.entries(step.solution)) {
                const varEl = document.createElement('span');
                varEl.className = `solution-var ${variable}-term`;
                varEl.textContent = `${variable} = ${value.toFixed(2)}`;
                solutionEl.appendChild(varEl);
            }
            
            stepContainer.appendChild(solutionEl);
        }
    }
    
    // 初始化交互区域的方程块
    function initializeEquationBlocks(equations) {
        // 清除之前的内容和事件监听器
        const equationBlocks = document.querySelector('.equation-blocks');
        if (!equationBlocks) return;
        
        equationBlocks.innerHTML = '';
        
        equations.forEach((equation, eqIndex) => {
            const eqContainer = document.createElement('div');
            eqContainer.className = 'interactive-equation';
            eqContainer.dataset.equationIndex = eqIndex;
            
            // 创建方程与控制器的容器
            const eqWithControls = document.createElement('div');
            eqWithControls.className = 'equation-with-controls';
            
            // 添加方程标签
            const eqLabel = document.createElement('div');
            eqLabel.className = 'equation-label';
            eqLabel.textContent = `方程 ${eqIndex + 1}`;
            eqWithControls.appendChild(eqLabel);
            
            // 创建行容器（将包含方程和系数调整器）
            const rowContainer = document.createElement('div');
            rowContainer.className = 'equation-row-wrapper';
            
            // 方程区域
            const equationRow = document.createElement('div');
            equationRow.className = 'equation-row';
            
            // 左侧容器
            const leftSideContainer = document.createElement('div');
            leftSideContainer.className = 'equation-side left-side';
            
            // 左侧项
            equation.leftSide.forEach((term, index) => {
                const termEl = createTermElement(term);
                termEl.dataset.side = 'left';
                
                // 添加符号
                if (index > 0 || term.coefficient < 0) {
                    const operator = document.createElement('span');
                    operator.className = term.coefficient < 0 ? 'operator minus-sign' : 'operator';
                    
                    if (term.coefficient < 0) {
                        // 使用span包装减号内容，以便CSS可以隐藏它
                        const minusContent = document.createElement('span');
                        minusContent.textContent = '-';
                        operator.appendChild(minusContent);
                    } else {
                        operator.textContent = '+';
                    }
                    
                    // 设置文本颜色与后一项背景色匹配
                    let textColor;
                    if (term.termType === 'x-term') {
                        textColor = 'var(--x-term-color)';
                    } else if (term.termType === 'y-term') {
                        textColor = 'var(--y-term-color)';
                    } else {
                        // 常数项
                        textColor = 'var(--constant-color)';
                    }
                    operator.style.color = textColor;
                    
                    leftSideContainer.appendChild(operator);
                }
                
                leftSideContainer.appendChild(termEl);
            });
            
            if (equation.leftSide.length === 0) {
                // 如果左侧为空，添加0
                const zeroElement = document.createElement('div');
                zeroElement.className = 'equation-element constant';
                zeroElement.textContent = '0';
                zeroElement.dataset.side = 'left';
                leftSideContainer.appendChild(zeroElement);
            }
            
            equationRow.appendChild(leftSideContainer);
            
            // 等号
            const equalSign = document.createElement('span');
            equalSign.className = 'equal-sign';
            equalSign.textContent = '=';
            equationRow.appendChild(equalSign);
            
            // 右侧容器
            const rightSideContainer = document.createElement('div');
            rightSideContainer.className = 'equation-side right-side';
            
            // 右侧项
            equation.rightSide.forEach((term, index) => {
                const termEl = createTermElement(term);
                termEl.dataset.side = 'right';
                
                // 添加符号
                if (index > 0 || term.coefficient < 0) {
                    const operator = document.createElement('span');
                    operator.className = term.coefficient < 0 ? 'operator minus-sign' : 'operator';
                    
                    if (term.coefficient < 0) {
                        // 使用span包装减号内容，以便CSS可以隐藏它
                        const minusContent = document.createElement('span');
                        minusContent.textContent = '-';
                        operator.appendChild(minusContent);
                    } else {
                        operator.textContent = '+';
                    }
                    
                    // 设置文本颜色与后一项背景色匹配
                    let textColor;
                    if (term.termType === 'x-term') {
                        textColor = 'var(--x-term-color)';
                    } else if (term.termType === 'y-term') {
                        textColor = 'var(--y-term-color)';
                    } else {
                        // 常数项
                        textColor = 'var(--constant-color)';
                    }
                    operator.style.color = textColor;
                    
                    rightSideContainer.appendChild(operator);
                }
                
                rightSideContainer.appendChild(termEl);
            });
            
            if (equation.rightSide.length === 0) {
                // 如果右侧为空，添加0
                const zeroElement = document.createElement('div');
                zeroElement.className = 'equation-element constant';
                zeroElement.textContent = '0';
                zeroElement.dataset.side = 'right';
                rightSideContainer.appendChild(zeroElement);
            }
            
            equationRow.appendChild(rightSideContainer);
            rowContainer.appendChild(equationRow);
            
            // 创建新的系数调整区域
            const scaleControlsArea = createScaleControls(eqIndex);
            rowContainer.appendChild(scaleControlsArea);
            eqWithControls.appendChild(rowContainer);
            eqContainer.appendChild(eqWithControls);
            equationBlocks.appendChild(eqContainer);
        });
        
        // 只绑定一次事件监听器
        if (!equationBlocks.hasListeners) {
            equationBlocks.addEventListener('dragover', handleDragOver);
            equationBlocks.addEventListener('drop', handleDrop);
            equationBlocks.hasListeners = true;
        }
        
        // 如果有两个及以上方程，添加方程加减法操作区域
        if (equations.length >= 2) {
            const equationOpArea = document.createElement('div');
            equationOpArea.className = 'equation-operation-area';
            equationOpArea.style.marginTop = '20px';
            equationOpArea.style.padding = '15px';
            equationOpArea.style.borderRadius = 'var(--border-radius)';
            equationOpArea.style.backgroundColor = '#f0f8ff';
            equationOpArea.style.boxShadow = 'var(--shadow-sm)';
            equationOpArea.style.display = 'flex';
            equationOpArea.style.flexDirection = 'column';
            equationOpArea.style.gap = '15px';
            
            // 添加标题
            const title = document.createElement('h3');
            title.textContent = '加减消元法';
            title.style.margin = '0';
            title.style.color = 'var(--primary-color)';
            equationOpArea.appendChild(title);
            
            // 删除操作说明
            
            // 运算按钮区域
            const buttonArea = document.createElement('div');
            buttonArea.style.display = 'flex';
            buttonArea.style.gap = '10px';
            buttonArea.style.justifyContent = 'center';
            
            // 方程相加按钮
            const addButton = document.createElement('button');
            addButton.textContent = '方程1 + 方程2';
            addButton.addEventListener('click', () => performEquationOperation('add'));
            buttonArea.appendChild(addButton);
            
            // 方程1-方程2按钮
            const subtractButton1 = document.createElement('button');
            subtractButton1.textContent = '方程1 - 方程2';
            subtractButton1.addEventListener('click', () => performEquationOperation('subtract-1-2'));
            buttonArea.appendChild(subtractButton1);
            
            // 方程2-方程1按钮
            const subtractButton2 = document.createElement('button');
            subtractButton2.textContent = '方程2 - 方程1';
            subtractButton2.addEventListener('click', () => performEquationOperation('subtract-2-1'));
            buttonArea.appendChild(subtractButton2);
            
            equationOpArea.appendChild(buttonArea);
            equationBlocks.appendChild(equationOpArea);
        }
    }
    
    // 执行方程加减运算
    function performEquationOperation(operation) {
        if (equations.length < 2) return;
        
        // 创建新方程
        let newEquation = {
            leftSide: [],
            rightSide: []
        };
        
        // 根据操作类型执行不同运算
        switch (operation) {
            case 'add':
                // 方程相加：左边相加，右边相加
                newEquation = addEquations(equations[0], equations[1]);
                break;
                
            case 'subtract-1-2':
                // 方程1减方程2：用方程1减去方程2
                newEquation = subtractEquations(equations[0], equations[1]);
                break;
                
            case 'subtract-2-1':
                // 方程2减方程1：用方程2减去方程1
                newEquation = subtractEquations(equations[1], equations[0]);
                break;
        }
        
        // 如果已经有第三个方程，替换它；否则添加新方程
        if (equations.length > 2) {
            equations[2] = newEquation;
        } else {
            equations.push(newEquation);
        }
        
        // 更新UI显示
        initializeEquationBlocks(equations);
    }
    
    // 方程相加
    function addEquations(eq1, eq2) {
        // 创建新方程
        const newEquation = {
            leftSide: JSON.parse(JSON.stringify(eq1.leftSide)),
            rightSide: JSON.parse(JSON.stringify(eq1.rightSide))
        };
        
        // 添加方程2的左边项到新方程左边
        eq2.leftSide.forEach(term => {
            newEquation.leftSide.push(JSON.parse(JSON.stringify(term)));
        });
        
        // 添加方程2的右边项到新方程右边
        eq2.rightSide.forEach(term => {
            newEquation.rightSide.push(JSON.parse(JSON.stringify(term)));
        });
        
        // 移除合并同类项操作
        // combineLikeTerms(newEquation.leftSide);
        // combineLikeTerms(newEquation.rightSide);
        
        return newEquation;
    }
    
    // 方程相减
    function subtractEquations(eq1, eq2) {
        // 创建新方程
        const newEquation = {
            leftSide: JSON.parse(JSON.stringify(eq1.leftSide)),
            rightSide: JSON.parse(JSON.stringify(eq1.rightSide))
        };
        
        // 添加方程2的左边项（系数取反）到新方程左边
        eq2.leftSide.forEach(term => {
            const newTerm = JSON.parse(JSON.stringify(term));
            newTerm.coefficient = -newTerm.coefficient;
            newEquation.leftSide.push(newTerm);
        });
        
        // 添加方程2的右边项（系数取反）到新方程右边
        eq2.rightSide.forEach(term => {
            const newTerm = JSON.parse(JSON.stringify(term));
            newTerm.coefficient = -newTerm.coefficient;
            newEquation.rightSide.push(newTerm);
        });
        
        // 移除合并同类项操作
        // combineLikeTerms(newEquation.leftSide);
        // combineLikeTerms(newEquation.rightSide);
        
        return newEquation;
    }
    
    // 合并同类项辅助函数
    function combineLikeTerms(terms) {
        // 创建分组对象
        const groupedTerms = {};
        
        // 对每项分组
        terms.forEach(term => {
            const key = term.variable || 'constant'; // 无变量的为常数项
            if (!groupedTerms[key]) {
                groupedTerms[key] = {
                    coefficient: 0,
                    variable: term.variable,
                    termType: term.termType
                };
            }
            groupedTerms[key].coefficient += term.coefficient;
        });
        
        // 清空原数组
        terms.length = 0;
        
        // 添加合并后的项，过滤掉系数为0的项
        for (const key in groupedTerms) {
            if (Math.abs(groupedTerms[key].coefficient) > 0.0001) {
                terms.push(groupedTerms[key]);
            }
        }
    }
    
    // 创建新的系数控制区域
    function createScaleControls(eqIndex) {
        // 创建新的系数调整区域
        const scaleControlsArea = document.createElement('div');
        scaleControlsArea.className = 'scale-control-area';
        
        // 创建系数选择器
        const scaleValueSelector = document.createElement('div');
        scaleValueSelector.className = 'scale-value-selector';
        
        // 当前选中的系数显示 - 支持点击和输入
        const currentScaleValue = document.createElement('input');
        currentScaleValue.type = 'text';
        currentScaleValue.className = 'current-scale-value';
        currentScaleValue.style.width = '80px'; // 设置固定宽度为80px
        currentScaleValue.value = '1';
        currentScaleValue.dataset.value = '1';
        
        // 支持键盘输入
        currentScaleValue.addEventListener('change', function() {
            let newValue = currentScaleValue.value.trim();
            // 尝试将用户输入解析为数字
            if (newValue.match(/^-?\d+$/)) {
                // 整数输入
                let numValue = parseInt(newValue);
                if (numValue === 0) numValue = 1; // 避免0值
                currentScaleValue.value = numValue;
                currentScaleValue.dataset.value = numValue;
            } else if (newValue.match(/^-?\d+\/\d+$/)) {
                // 分数输入 (如 "1/2")
                const parts = newValue.split('/');
                const numerator = parseInt(parts[0]);
                const denominator = parseInt(parts[1]);
                if (denominator !== 0) {
                    currentScaleValue.value = newValue;
                    currentScaleValue.dataset.value = numerator / denominator;
                } else {
                    // 分母为0的情况
                    currentScaleValue.value = '1';
                    currentScaleValue.dataset.value = '1';
                    alert('分母不能为0');
                }
            } else {
                // 非法输入，恢复默认值
                currentScaleValue.value = '1';
                currentScaleValue.dataset.value = '1';
            }
        });
        
        // 防止拖拽时触发输入框
        currentScaleValue.addEventListener('mousedown', function(e) {
            e.stopPropagation();
        });
        
        // 上箭头 - 增加系数
        const upArrow = document.createElement('div');
        upArrow.className = 'scale-arrow up-arrow';
        upArrow.innerHTML = '&#9650;'; // 上三角形
        
        // 长按支持 - 添加加速功能
        let upInterval;
        let upCount = 0; // 计数器，用于加速
        const startUpIncrement = function() {
            upCount = 0; // 重置计数器
            upInterval = setInterval(function() {
                upCount++;
                let currentValue = parseInt(currentScaleValue.value);
                
                // 根据长按时间调整增加的量 - 加速逻辑
                let increment = 1;
                if (upCount > 6) increment = 2;    // 更快达到加速阶段
                if (upCount > 12) increment = 5;   // 更快达到加速阶段
                if (upCount > 18) increment = 10;  // 更快达到加速阶段
                if (upCount > 24) increment = 20;  // 添加新的加速阶段
                
                currentValue += increment;
                if (currentValue === 0) currentValue = 1; // 跳过0
                currentScaleValue.value = currentValue;
                currentScaleValue.dataset.value = currentValue;
            }, 100); // 从150ms减少到100ms，提高50%速度
        };
        
        upArrow.addEventListener('mousedown', function(e) {
            e.preventDefault(); // 防止文本选择
            // 立即执行一次
            let currentValue = parseInt(currentScaleValue.value);
            currentValue++;
            if (currentValue === 0) currentValue = 1; // 跳过0
            currentScaleValue.value = currentValue;
            currentScaleValue.dataset.value = currentValue;
            
            // 启动长按
            startUpIncrement();
        });
        
        upArrow.addEventListener('touchstart', function(e) {
            e.preventDefault();
            // 立即执行一次
            let currentValue = parseInt(currentScaleValue.value);
            currentValue++;
            if (currentValue === 0) currentValue = 1; // 跳过0
            currentScaleValue.value = currentValue;
            currentScaleValue.dataset.value = currentValue;
            
            // 启动长按
            startUpIncrement();
        });
        
        // 取消长按
        const stopIncrement = function() {
            if (upInterval) {
                clearInterval(upInterval);
                upInterval = null;
                upCount = 0; // 重置计数器
            }
            if (downInterval) {
                clearInterval(downInterval);
                downInterval = null;
                downCount = 0; // 重置计数器
            }
        };
        
        document.addEventListener('mouseup', stopIncrement);
        document.addEventListener('touchend', stopIncrement);
        document.addEventListener('touchcancel', stopIncrement);
        
        // 下箭头 - 减少系数
        const downArrow = document.createElement('div');
        downArrow.className = 'scale-arrow down-arrow';
        downArrow.innerHTML = '&#9660;'; // 下三角形
        
        // 长按支持 - 添加加速功能
        let downInterval;
        let downCount = 0; // 计数器，用于加速
        const startDownDecrement = function() {
            downCount = 0; // 重置计数器
            downInterval = setInterval(function() {
                downCount++;
                let currentValue = parseInt(currentScaleValue.value);
                
                // 根据长按时间调整减少的量 - 加速逻辑
                let decrement = 1;
                if (downCount > 6) decrement = 2;    // 更快达到加速阶段
                if (downCount > 12) decrement = 5;   // 更快达到加速阶段
                if (downCount > 18) decrement = 10;  // 更快达到加速阶段
                if (downCount > 24) decrement = 20;  // 添加新的加速阶段
                
                currentValue -= decrement;
                if (currentValue === 0) currentValue = -1; // 跳过0
                currentScaleValue.value = currentValue;
                currentScaleValue.dataset.value = currentValue;
            }, 100); // 从150ms减少到100ms，提高50%速度
        };
        
        downArrow.addEventListener('mousedown', function(e) {
            e.preventDefault(); // 防止文本选择
            // 立即执行一次
            let currentValue = parseInt(currentScaleValue.value);
            currentValue--;
            if (currentValue === 0) currentValue = -1; // 跳过0
            currentScaleValue.value = currentValue;
            currentScaleValue.dataset.value = currentValue;
            
            // 启动长按
            startDownDecrement();
        });
        
        downArrow.addEventListener('touchstart', function(e) {
            e.preventDefault();
            // 立即执行一次
            let currentValue = parseInt(currentScaleValue.value);
            currentValue--;
            if (currentValue === 0) currentValue = -1; // 跳过0
            currentScaleValue.value = currentValue;
            currentScaleValue.dataset.value = currentValue;
            
            // 启动长按
            startDownDecrement();
        });
        
        // 组装系数选择器
        scaleValueSelector.appendChild(upArrow);
        scaleValueSelector.appendChild(currentScaleValue);
        scaleValueSelector.appendChild(downArrow);
        scaleControlsArea.appendChild(scaleValueSelector);
        
        // 操作按钮区
        const operationButtons = document.createElement('div');
        operationButtons.className = 'operation-buttons';
        
        // 乘法按钮
        const multiplyButton = document.createElement('button');
        multiplyButton.className = 'operation-button multiply-button';
        multiplyButton.textContent = '×';
        multiplyButton.title = '乘以系数';
        multiplyButton.addEventListener('click', function() {
            // 获取输入值，支持分数
            let value;
            const inputVal = currentScaleValue.value;
            if (inputVal.includes('/')) {
                const parts = inputVal.split('/');
                value = parseInt(parts[0]) / parseInt(parts[1]);
            } else {
                value = parseInt(inputVal);
            }
            
            if (isNaN(value) || value === 0) {
                alert('请输入有效的系数值');
                return;
            }
            
            performScaleOperation(eqIndex, value);
        });
        
        // 除法按钮
        const divideButton = document.createElement('button');
        divideButton.className = 'operation-button divide-button';
        divideButton.textContent = '÷';
        divideButton.title = '除以系数';
        divideButton.addEventListener('click', function() {
            // 获取输入值，支持分数
            let value;
            const inputVal = currentScaleValue.value;
            if (inputVal.includes('/')) {
                const parts = inputVal.split('/');
                value = parseInt(parts[0]) / parseInt(parts[1]);
            } else {
                value = parseInt(inputVal);
            }
            
            if (isNaN(value) || value === 0) {
                alert('请输入有效的系数值');
                return;
            }
            
            performScaleOperation(eqIndex, 1 / value);
        });
        
        operationButtons.appendChild(multiplyButton);
        operationButtons.appendChild(divideButton);
        scaleControlsArea.appendChild(operationButtons);
        
        return scaleControlsArea;
    }
    
    // 执行移项操作
    function performMoveOperation(equationIndex) {
        if (!selectedElement) return;
        
        const term = {
            coefficient: parseFloat(selectedElement.dataset.coefficient),
            variable: selectedElement.dataset.variable,
            termType: selectedElement.className.split(' ')[1]
        };
        
        const side = selectedElement.dataset.side;
        const eq = JSON.parse(JSON.stringify(equations[equationIndex]));
        
        // 移除原项
        if (side === 'left') {
            eq.leftSide = eq.leftSide.filter(t => 
                !(t.variable === term.variable && Math.abs(t.coefficient - term.coefficient) < 0.001)
            );
            // 添加到右侧，系数取反
            eq.rightSide.push({
                coefficient: -term.coefficient,
                variable: term.variable,
                termType: term.termType
            });
        } else {
            eq.rightSide = eq.rightSide.filter(t => 
                !(t.variable === term.variable && Math.abs(t.coefficient - term.coefficient) < 0.001)
            );
            // 添加到左侧，系数取反
            eq.leftSide.push({
                coefficient: -term.coefficient,
                variable: term.variable,
                termType: term.termType
            });
        }
        
        // 更新方程
        equations[equationIndex] = eq;
        
        // 更新显示
        initializeEquationBlocks(equations);
        
        // 添加到步骤
        steps.push({
            description: `移项: 将${term.coefficient}${term.variable}从${side === 'left' ? '左' : '右'}侧移到${side === 'left' ? '右' : '左'}侧`,
            equations: JSON.parse(JSON.stringify(equations))
        });
        
        // 展示最新步骤
        currentStep = steps.length - 1;
        displayStep(currentStep);
    }
    
    // 执行合并同类项操作
    function performCombineOperation(equationIndex, targetElement) {
        // 如果没有选中元素，无法确定要合并哪一侧
        if (!selectedElement) {
            alert('请选择要合并的项');
            return;
        }
        
        // 获取被选中元素所在的一侧
        const side = selectedElement.dataset.side === 'left' ? 'leftSide' : 'rightSide';
        
        // 检查方程中是否有替换但未合并的项
        const hasReplacedTerms = checkForReplacedTerms(equations[equationIndex]);
        
        // 浅拷贝方程
        const eq = {
            leftSide: [...equations[equationIndex].leftSide],
            rightSide: [...equations[equationIndex].rightSide]
        };
        
        // 创建新方程对象
        const newEquation = {
            leftSide: [...eq.leftSide],
            rightSide: [...eq.rightSide]
        };

        // 获取源项和目标项的索引
        const sourceIndex = getTermIndex(selectedElement, eq[side]);
        const targetIndex = getTermIndex(targetElement, eq[side]);
        
        // 如果找到了有效的索引
        if (sourceIndex !== -1 && targetIndex !== -1) {
            // 获取要合并的两项
            const sourceTerm = eq[side][sourceIndex];
            const targetTerm = eq[side][targetIndex];
            
            // 合并这两项
            if (sourceTerm.isSubstituted || targetTerm.isSubstituted) {
                // 如果有代入项，展开并处理
                const combinedTerms = [];
                
                // 处理源项
                if (sourceTerm.isSubstituted) {
                    sourceTerm.expressionTerms.forEach(exprTerm => {
                        combinedTerms.push({
                            coefficient: sourceTerm.originalCoeff * exprTerm.coefficient,
                            variable: exprTerm.variable,
                            termType: exprTerm.variable ? 
                                (exprTerm.variable === 'x' ? 'x-term' : 'y-term') : 
                                'constant'
                        });
                    });
                } else {
                    combinedTerms.push({...sourceTerm});
                }
                
                // 处理目标项
                if (targetTerm.isSubstituted) {
                    targetTerm.expressionTerms.forEach(exprTerm => {
                        combinedTerms.push({
                            coefficient: targetTerm.originalCoeff * exprTerm.coefficient,
                            variable: exprTerm.variable,
                            termType: exprTerm.variable ? 
                                (exprTerm.variable === 'x' ? 'x-term' : 'y-term') : 
                                'constant'
                        });
                    });
                } else {
                    combinedTerms.push({...targetTerm});
                }
                
                // 合并同变量的项
                const combinedResult = {};
                for (const term of combinedTerms) {
                    const key = term.variable || 'constant';
                    if (!combinedResult[key]) {
                        combinedResult[key] = {
                            coefficient: 0,
                            variable: term.variable,
                            termType: term.termType
                        };
                    }
                    combinedResult[key].coefficient += term.coefficient;
                }
                
                // 创建合并后的项数组，移除系数为0的项
                const mergedTerms = Object.values(combinedResult)
                    .filter(term => Math.abs(term.coefficient) > 0.0001);
                
                // 从方程中移除源项和目标项
                const newSideTerms = [...eq[side]];
                // 需要考虑索引的变化：如果sourceIndex > targetIndex，移除后索引会改变
                if (sourceIndex > targetIndex) {
                    newSideTerms.splice(sourceIndex, 1);
                    newSideTerms.splice(targetIndex, 1);
                } else {
                    newSideTerms.splice(targetIndex, 1);
                    newSideTerms.splice(sourceIndex, 1);
                }
                
                // 将合并后的项添加到方程中
                newEquation[side] = [...newSideTerms, ...mergedTerms];
            } else {
                // 简单合并两个常规项
                let mergedCoefficient = sourceTerm.coefficient + targetTerm.coefficient;
                
                // 从方程中移除源项和目标项
                const newSideTerms = [...eq[side]];
                if (sourceIndex > targetIndex) {
                    newSideTerms.splice(sourceIndex, 1);
                    newSideTerms.splice(targetIndex, 1);
                } else {
                    newSideTerms.splice(targetIndex, 1);
                    newSideTerms.splice(sourceIndex, 1);
                }
                
                // 如果合并后的系数不为0，则添加合并后的项
                if (Math.abs(mergedCoefficient) > 0.0001) {
                    const mergedTerm = {
                        coefficient: mergedCoefficient,
                        variable: sourceTerm.variable,
                        termType: sourceTerm.termType
                    };
                    newEquation[side] = [...newSideTerms, mergedTerm];
                } else {
                    newEquation[side] = newSideTerms;
                }
            }
        }
        
        // 更新方程
        equations[equationIndex] = newEquation;
        
        // 更新显示
        initializeEquationBlocks(equations);
        
        // 添加到步骤
        let description = `合并方程 ${equationIndex + 1} ${side === 'leftSide' ? '左侧' : '右侧'} 的同类项`;
        if (hasReplacedTerms) {
            description = `合并方程 ${equationIndex + 1} ${side === 'leftSide' ? '左侧' : '右侧'} 代入后的同类项`;
        }
        
        steps.push({
            description: description,
            equations: JSON.parse(JSON.stringify(equations))
        });
        
        // 展示最新步骤
        currentStep = steps.length - 1;
        displayStep(currentStep);
    }
    
    // 辅助函数：根据DOM元素获取对应的方程项索引
    function getTermIndex(element, termArray) {
        if (!element || !element.dataset) return -1;
        
        const variable = element.dataset.variable;
        const coefficient = parseFloat(element.dataset.coefficient);
        
        // 查找匹配的项
        for (let i = 0; i < termArray.length; i++) {
            const term = termArray[i];
            if (term.variable === variable && Math.abs(term.coefficient - coefficient) < 0.0001) {
                return i;
            }
        }
        
        return -1;
    }
    
    // 检查方程中是否有替换但未合并的项
    function checkForReplacedTerms(equation) {
        for (const side of ['leftSide', 'rightSide']) {
            for (const term of equation[side]) {
                if (term.isReplacedTerm || term.isReplacedGroupStart || term.isReplacedGroupEnd) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // 执行代入操作
    function performSubstituteOperation(sourceElement, targetElement, sourceEquationIndex, targetEquationIndex) {
        if (!sourceElement) {
            alert('请先选择一个要代入的项');
            return;
        }
        
        // 获取被选中项的信息
        const term = {
            coefficient: parseFloat(sourceElement.dataset.coefficient),
            variable: sourceElement.dataset.variable,
            termType: sourceElement.className.split(' ')[1],
            side: sourceElement.dataset.side
        };
        
        // 需要确保选中的是变量项（x或y）
        if (!term.variable || (term.variable !== 'x' && term.variable !== 'y')) {
            alert('只能代入变量项（x或y）');
            return;
        }
        
        // 根据被选中的项和其所在方程计算代入表达式
        // 对于项 ax 或 ay，需要从原方程中计算出x或y的表达式
        const eq = getCoefficients(equations[sourceEquationIndex]);
        
        // 构建表达式
        let expressionTerms = [];
        let expressionHTML = '';
        
        if (term.variable === 'x') {
            // 从方程中解出x：ax + by = c => x = (c - by)/a
            if (eq.x === 0) {
                alert('该方程中x的系数为0，无法求解x的表达式');
                return;
            }
            
            // 创建表示代入表达式的对象
            expressionTerms = [
                {
                    coefficient: eq.constant / eq.x,
                    variable: '',
                    termType: 'constant'
                }
            ];
            
            if (eq.y !== 0) {
                expressionTerms.push({
                    coefficient: -eq.y / eq.x,
                    variable: 'y',
                    termType: 'y-term'
                });
            }
            
            // 构建HTML表示
            expressionHTML = createSubstitutionHTML(expressionTerms, 'x');
        } else if (term.variable === 'y') {
            // 从方程中解出y：ax + by = c => y = (c - ax)/b
            if (eq.y === 0) {
                alert('该方程中y的系数为0，无法求解y的表达式');
                return;
            }
            
            // 创建表示代入表达式的对象
            expressionTerms = [
                {
                    coefficient: eq.constant / eq.y,
                    variable: '',
                    termType: 'constant'
                }
            ];
            
            if (eq.x !== 0) {
                expressionTerms.push({
                    coefficient: -eq.x / eq.y,
                    variable: 'x',
                    termType: 'x-term'
                });
            }
            
            // 构建HTML表示
            expressionHTML = createSubstitutionHTML(expressionTerms, 'y');
        }
        
        // 创建代入后但未合并同类项的方程
        const intermediateEquation = createSubstitutedIntermediateEquation(
            equations[targetEquationIndex], 
            term.variable, 
            expressionTerms
        );
        
        // 添加到步骤 - 显示原始表达式和代入信息
        steps.push({
            description: `代入: 将 ${term.variable} = ${expressionHTML} 代入方程 ${targetEquationIndex + 1}`,
            equations: JSON.parse(JSON.stringify(equations)),
            substitution: {
                variable: term.variable,
                expression: expressionHTML,
                fromEquation: sourceEquationIndex,
                toEquation: targetEquationIndex,
                substitutedTerms: expressionTerms
            }
        });
        
        // 更新方程为中间形式（替换但未合并）
        equations[targetEquationIndex] = intermediateEquation;
        
        // 更新显示 - 显示替换后但未合并的形式
        initializeEquationBlocks(equations);
        
        // 展示最新步骤
        currentStep = steps.length - 1;
        displayStep(currentStep);
    }
    
    // 创建代入后但未合并同类项的方程
    function createSubstitutedIntermediateEquation(equation, variable, expressionTerms) {
        // 深拷贝方程
        const intermediateEquation = {
            leftSide: [],
            rightSide: []
        };
        
        // 左右两侧都需要检查和替换
        ['leftSide', 'rightSide'].forEach(side => {
            // 遍历原方程的每个项
            equation[side].forEach(term => {
                if (term.variable === variable) {
                    // 找到需要替换的变量项
                    const substitutedTerm = {
                        isSubstituted: true,
                        originalCoeff: term.coefficient,
                        originalVariable: variable,
                        expressionTerms: JSON.parse(JSON.stringify(expressionTerms))
                    };
                    
                    // 将替换后的项添加到新方程
                    intermediateEquation[side].push(substitutedTerm);
                } else {
                    // 其他项直接复制
                    intermediateEquation[side].push({...term});
                }
            });
        });
        
        return intermediateEquation;
    }
    
    // 创建代入后的新方程 - 显示最终合并结果
    function createSubstitutedEquation(equation, variable, expressionTerms) {
        // 使用中间方程
        const intermediateEquation = createSubstitutedIntermediateEquation(equation, variable, expressionTerms);
        
        // 合并同类项得到最终结果
        return combineTerms(intermediateEquation);
    }
    
    // 创建代入表达式的HTML表示
    function createSubstitutionHTML(terms, variable) {
        let html = '';
        
        terms.forEach((term, index) => {
            if (index > 0) {
                html += term.coefficient < 0 ? ' - ' : ' + ';
            } else if (term.coefficient < 0) {
                html += '-';
            }
            
            let coeff = Math.abs(term.coefficient);
            // 使用拆分的HTML格式来显示系数，便于应用样式
            if (coeff !== 1 || !term.variable) {
                // 对于常数项或系数不为1的项
                let coeffStr = decimalToFraction(coeff);
                html += coeffStr;
            }
            
            if (term.variable) {
                html += `<span class="variable ${term.variable}-color">${term.variable}</span>`;
            }
        });
        
        return html;
    }
    
    // 执行系数调整操作 - 确保乘以-1能正确执行
    function performScaleOperation(equationIndex, factor) {
        if (!equations[equationIndex]) return;
        
        try {
            // 输出调试信息
            console.log(`执行缩放操作：方程${equationIndex + 1} 系数 ${factor}`);
            
            // 安全检查：如果系数太大或太小，拒绝操作
            const safetyCheck = canSafelyScale(equations[equationIndex], factor);
            if (!safetyCheck.safe) {
                alert(safetyCheck.message);
                return;
            }
            
            // 浅拷贝方程对象，避免过度的深拷贝开销
            const eq = {
                leftSide: [...equations[equationIndex].leftSide],
                rightSide: [...equations[equationIndex].rightSide]
            };
            
            // 缩放整个方程
            const scaledEq = {
                leftSide: eq.leftSide.map(term => ({
                    coefficient: Number((term.coefficient * factor).toFixed(8)), // 限制小数位数，避免精度问题
                    variable: term.variable,
                    termType: term.termType,
                    style: { height: '40px' } // 设置统一高度
                })),
                rightSide: eq.rightSide.map(term => ({
                    coefficient: Number((term.coefficient * factor).toFixed(8)), // 限制小数位数，避免精度问题
                    variable: term.variable,
                    termType: term.termType,
                    style: { height: '40px' } // 设置统一高度
                }))
            };
            
            // 更新方程数组
            equations[equationIndex] = scaledEq;
            
            // 更新显示
            initializeEquationBlocks(equations);
            
            // 添加操作描述文本
            let operationText;
            if (factor === -1) {
                operationText = "变号";
            } else if (factor > 0) {
                if (Number.isInteger(factor)) {
                    operationText = `乘以 ${factor}`;
                } else {
                    const denominator = Math.round(1 / factor);
                    operationText = `除以 ${denominator}`;
                }
            } else {
                if (Number.isInteger(factor)) {
                    operationText = `乘以 ${factor}（变号并乘以 ${Math.abs(factor)}）`;
                } else {
                    const denominator = Math.round(1 / Math.abs(factor));
                    operationText = `除以 ${denominator} 并变号`;
                }
            }
            
            // 添加到步骤
            steps.push({
                description: `调整系数: 将方程 ${equationIndex + 1} 两边 ${operationText}`,
                equations: JSON.parse(JSON.stringify(equations))
            });
            
            // 展示最新步骤
            currentStep = steps.length - 1;
            displayStep(currentStep);
        } catch (error) {
            console.error('系数调整出错:', error);
            alert('系数调整出错，请重试');
        }
    }
    
    // 安全检查：确保可以安全地执行系数缩放
    function canSafelyScale(equation, factor) {
        // 取消系数上下限限制，允许任意系数
        return { safe: true };
    }
    
    // 事件监听
    solveBtn.addEventListener('click', function() {
        try {
            const eq1 = parseEquation(equation1Input.value);
            const eq2 = parseEquation(equation2Input.value);
            
            equations = [eq1, eq2];
            
            // 初始化交互区域
            initializeEquationBlocks(equations);
            
            // 解方程并显示步骤
            const solution = solveEquation(JSON.parse(JSON.stringify(equations)));
            
            // 仅显示解
            const { x, y } = solution.solution;
            solutionResult.innerHTML = `<p>x = ${x.toFixed(2)}</p><p>y = ${y.toFixed(2)}</p>`;
            
            // 清空步骤容器，移除动画控制功能
            stepContainer.innerHTML = '';
        } catch (error) {
            alert('解析方程时出错: ' + error.message);
        }
    });
    
    // 随机方程按钮点击事件
    randomBtn.addEventListener('click', function() {
        const randomEqs = generateRandomEquation();
        equation1Input.value = randomEqs.eq1;
        equation2Input.value = randomEqs.eq2;
        
        // 清空方程区域，重置方程
        equationBlocks.innerHTML = '';
        equations = [];
        solutionResult.innerHTML = '';
    });
    
    // 生成随机方程
    function generateRandomEquation() {
        // 生成-10到10之间的随机整数系数，避免0
        function randomCoeff() {
            let value = Math.floor(Math.random() * 10) + 1; // 1到10
            return Math.random() < 0.5 ? -value : value; // 50%概率为负数
        }
        
        // 生成x的系数（非0）
        const xCoeff1 = randomCoeff();
        const xCoeff2 = randomCoeff();
        
        // 生成y的系数（非0）
        const yCoeff1 = randomCoeff();
        const yCoeff2 = randomCoeff();
        
        // 生成常数项
        const constant1 = Math.floor(Math.random() * 20) - 10; // -10到10
        const constant2 = Math.floor(Math.random() * 20) - 10; // -10到10
        
        // 构建方程字符串
        let eq1 = `${xCoeff1}x + ${yCoeff1}y = ${constant1}`;
        let eq2 = `${xCoeff2}x + ${yCoeff2}y = ${constant2}`;
        
        // 替换 "+ -" 为 "-"
        eq1 = eq1.replace('+ -', '- ');
        eq2 = eq2.replace('+ -', '- ');
        
        return { eq1, eq2 };
    }
    
    // 初始化示例 - 使用随机方程
    const randomEqs = generateRandomEquation();
    equation1Input.value = randomEqs.eq1;
    equation2Input.value = randomEqs.eq2;
    
    // 处理被替换的项 - 显示为"系数(表达式)"的形式，并支持点击展开
    function createSubstitutedTermElement(term) {
        const element = document.createElement('div');
        element.className = 'substituted-term';
        element.style.height = '40px';
        element.style.display = 'inline-flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        
        // 设置数据属性，与正常项保持一致，确保拖拽功能正常工作
        element.dataset.variable = term.originalVariable;
        element.dataset.coefficient = term.originalCoeff;
        
        // 创建系数和括号结构
        const coeffPart = document.createElement('span');
        coeffPart.className = 'original-coefficient';
        coeffPart.style.display = 'inline-flex';
        coeffPart.style.alignItems = 'center';
        coeffPart.style.height = '100%';
        
        const absCoeff = Math.abs(term.originalCoeff);
        if (absCoeff === 1) {
            // 系数为1或-1时的处理
            coeffPart.textContent = term.originalCoeff < 0 ? '-' : '';
        } else {
            // 其他系数
            coeffPart.innerHTML = term.originalCoeff < 0 ? '-' + decimalToFraction(absCoeff) : decimalToFraction(absCoeff);
        }
        
        // 创建左括号
        const leftBracket = document.createElement('span');
        leftBracket.className = 'bracket';
        leftBracket.textContent = '(';
        leftBracket.style.display = 'inline-flex';
        leftBracket.style.alignItems = 'center';
        leftBracket.style.height = '100%';
        
        // 创建表达式部分
        const exprPart = document.createElement('span');
        exprPart.className = 'substitution-expr';
        exprPart.style.display = 'inline-flex';
        exprPart.style.alignItems = 'center';
        exprPart.style.height = '100%';
        
        // 构建表达式HTML - 保留原始符号
        let expressionHtml = '';
        
        term.expressionTerms.forEach((exprTerm, index) => {
            // 处理第一项的符号
            if (index === 0) {
                if (exprTerm.coefficient < 0) {
                    expressionHtml += '-';
                }
            } else {
                // 处理后续项的符号
                expressionHtml += exprTerm.coefficient < 0 ? ' - ' : ' + ';
            }
            
            // 显示系数（绝对值）
            let coeff = Math.abs(exprTerm.coefficient);
            
            // 系数为1且有变量时，不显示系数
            if (coeff !== 1 || !exprTerm.variable) {
                // 使用分数表示系数
                let coeffStr = decimalToFraction(coeff);
                expressionHtml += coeffStr;
            }
            
            // 添加变量
            if (exprTerm.variable) {
                expressionHtml += exprTerm.variable;
            }
        });
        
        exprPart.innerHTML = expressionHtml;
        
        // 创建右括号
        const rightBracket = document.createElement('span');
        rightBracket.className = 'bracket';
        rightBracket.textContent = ')';
        rightBracket.style.display = 'inline-flex';
        rightBracket.style.alignItems = 'center';
        rightBracket.style.height = '100%';
        
        // 组装完整的替换表达式
        element.appendChild(coeffPart);
        element.appendChild(leftBracket);
        element.appendChild(exprPart);
        element.appendChild(rightBracket);
        
        // 存储原始数据，用于展开计算
        element.dataset.originalCoeff = term.originalCoeff;
        element.dataset.expressionTerms = JSON.stringify(term.expressionTerms);
        element.dataset.clickState = "0"; // 0 = 初始状态, 1 = 展开系数, 2 = 去括号
        
        // 添加点击事件 - 通过点击循环不同状态
        element.addEventListener('click', function() {
            const clickState = parseInt(element.dataset.clickState);
            
            switch(clickState) {
                case 0: // 初始状态 -> 展开系数但保留括号
                    expandCoefficient(element);
                    break;
                    
                case 1: // 展开系数 -> 去括号
                    removeParentheses(element);
                    break;
            }
        });
        
        // 添加拖拽功能
        element.draggable = true;
        element.addEventListener('dragstart', handleDragStart);
        element.addEventListener('dragend', handleDragEnd);
        
        // 添加触摸事件处理
        element.addEventListener('touchstart', handleTouchStart, { passive: false });
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        return element;
    }
    
    // 展开系数但保留括号的函数
    function expandCoefficient(element) {
        // 更新点击状态
        element.dataset.clickState = "1";
        
        // 获取原始系数和表达式项
        const originalCoeff = parseFloat(element.dataset.originalCoeff);
        const expressionTerms = JSON.parse(element.dataset.expressionTerms);
        
        // 清空当前内容
        element.innerHTML = '';
        
        // 创建新的展开后但保留括号的表达式
        const expandedLeftBracket = document.createElement('span');
        expandedLeftBracket.className = 'bracket';
        expandedLeftBracket.textContent = '(';
        expandedLeftBracket.style.display = 'inline-flex';
        expandedLeftBracket.style.alignItems = 'center';
        expandedLeftBracket.style.height = '100%';
        
        const expandedExprPart = document.createElement('span');
        expandedExprPart.className = 'substitution-expr expanded-expr';
        expandedExprPart.style.display = 'inline-flex';
        expandedExprPart.style.alignItems = 'center';
        expandedExprPart.style.height = '100%';
        
        // 构建展开后的表达式HTML
        let expandedHtml = '';
        
        expressionTerms.forEach((exprTerm, index) => {
            // 计算新系数
            const newCoeff = originalCoeff * exprTerm.coefficient;
            
            // 处理符号
            if (index === 0) {
                if (newCoeff < 0) {
                    expandedHtml += '-';
                }
            } else {
                expandedHtml += newCoeff < 0 ? ' - ' : ' + ';
            }
            
            // 显示系数（绝对值）
            let coeff = Math.abs(newCoeff);
            
            // 系数为1且有变量时，不显示系数
            if (coeff !== 1 || !exprTerm.variable) {
                // 使用分数表示系数
                let coeffStr = decimalToFraction(coeff);
                expandedHtml += coeffStr;
            }
            
            // 添加变量
            if (exprTerm.variable) {
                expandedHtml += exprTerm.variable;
            }
        });
        
        expandedExprPart.innerHTML = expandedHtml;
        
        const expandedRightBracket = document.createElement('span');
        expandedRightBracket.className = 'bracket';
        expandedRightBracket.textContent = ')';
        expandedRightBracket.style.display = 'inline-flex';
        expandedRightBracket.style.alignItems = 'center';
        expandedRightBracket.style.height = '100%';
        
        // 组装展开后的表达式
        element.appendChild(expandedLeftBracket);
        element.appendChild(expandedExprPart);
        element.appendChild(expandedRightBracket);
    }
    
    // 去括号并应用变号规则的函数
    function removeParentheses(element) {
        // 更新元素样式和点击状态
        element.classList.remove('substituted-term');
        element.classList.add('unbracket-container');
        element.dataset.clickState = "2";
        
        // 移除点击事件
        const oldElement = element.cloneNode(true);
        element.parentNode.replaceChild(oldElement, element);
        element = oldElement;
        
        // 获取原始系数和表达式项
        const originalCoeff = parseFloat(element.dataset.originalCoeff);
        const expressionTerms = JSON.parse(element.dataset.expressionTerms);
        
        // 获取父元素，用于添加多个项
        const parentElement = element.parentNode;
        const isLeft = element.closest('.left-side') ? true : false;
        const equationElement = element.closest('.interactive-equation');
        const equationIndex = parseInt(equationElement.dataset.equationIndex);
        
        // 从父元素中移除原始元素
        parentElement.removeChild(element);
        
        // 计算每一项并创建新的项元素
        const newTerms = [];
        expressionTerms.forEach(exprTerm => {
            // 计算新系数，应用括号外系数
            const newCoeff = originalCoeff * exprTerm.coefficient;
            
            // 创建新项
            const newTerm = {
                coefficient: newCoeff,
                variable: exprTerm.variable,
                termType: exprTerm.variable ? 
                    (exprTerm.variable === 'x' ? 'x-term' : 'y-term') : 
                    'constant',
                height: '40px' // 确保高度一致
            };
            
            newTerms.push(newTerm);
        });
        
        // 更新方程对象以反映更改
        const side = isLeft ? 'leftSide' : 'rightSide';
        
        // 找到被替换项的索引位置
        let substitutedIndex = -1;
        for(let i = 0; i < equations[equationIndex][side].length; i++) {
            if(equations[equationIndex][side][i].isSubstituted && 
               equations[equationIndex][side][i].originalCoeff === originalCoeff) {
                substitutedIndex = i;
                break;
            }
        }
        
        if(substitutedIndex !== -1) {
            // 移除原替换项
            equations[equationIndex][side].splice(substitutedIndex, 1);
            
            // 插入新的展开项 - 在原位置插入而不是添加到末尾
            for(let i = 0; i < newTerms.length; i++) {
                equations[equationIndex][side].splice(substitutedIndex + i, 0, newTerms[i]);
            }
            
            // 重新渲染方程
            initializeEquationBlocks(equations);
            
            // 添加到步骤
            steps.push({
                description: '去括号：将括号展开并应用变号规则',
                equations: JSON.parse(JSON.stringify(equations))
            });
            
            // 展示最新步骤
            currentStep = steps.length - 1;
            displayStep(currentStep);
        }
    }
}); 