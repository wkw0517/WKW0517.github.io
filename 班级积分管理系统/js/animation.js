// 动画相关功能

// 显示抽取动画
function showDrawAnimation(items, finalCallback, candidatePool) {
    const container = document.getElementById('drawAnimationContainer');
    const animationItem = document.getElementById('drawAnimationItem');
    const fireworkContainer = document.getElementById('fireworkContainer');
    
    // 清空之前的内容
    animationItem.innerHTML = '';
    fireworkContainer.innerHTML = '';
    
    // 显示动画容器
    container.classList.add('show');
    document.body.style.overflow = 'hidden'; // 防止页面滚动
    
    // 创建一个全局的计时器数组，用于跟踪和清理计时器
    window.drawAnimationTimers = window.drawAnimationTimers || [];
    window.drawAnimationTimers.forEach(timer => clearTimeout(timer));
    window.drawAnimationTimers = [];
    
    // 添加炫酷的背景效果
    addBackgroundEffect(container);
    
    // 如果只有一个结果，直接显示
    if (items.length === 1) {
        singleItemAnimation(items[0], () => {
            // 确保在回调函数执行前，动画容器已被正确隐藏
            setTimeout(() => {
                hideDrawAnimation();
                if (finalCallback) finalCallback();
            }, 100);
        }, candidatePool);
        return;
    }
    
    // 多个结果时，依次显示
    let currentIndex = 0;
    
    function showNext() {
        if (currentIndex < items.length) {
            const isFinal = currentIndex === items.length - 1;
            singleItemAnimation(items[currentIndex], isFinal ? () => {
                setTimeout(() => {
                    hideDrawAnimation();
                    if (finalCallback) finalCallback();
                }, 100);
            } : () => {
                currentIndex++;
                setTimeout(showNext, 500);
            }, candidatePool);
        }
    }
    
    showNext();
}

// 添加背景动态效果
function addBackgroundEffect(container) {
    // 创建一个背景效果容器
    const bgEffect = document.createElement('div');
    bgEffect.className = 'draw-background-effect';
    
    // 添加脉冲圆圈
    for (let i = 0; i < 3; i++) {
        const circle = document.createElement('div');
        circle.className = 'pulse-circle';
        circle.style.animationDelay = `${i * 0.3}s`;
        bgEffect.appendChild(circle);
    }
    
    // 添加闪烁星星
    for (let i = 0; i < 30; i++) {
        const star = document.createElement('div');
        star.className = 'twinkling-star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 2}s`;
        star.style.animationDuration = `${1 + Math.random() * 2}s`;
        bgEffect.appendChild(star);
    }
    
    container.appendChild(bgEffect);
}

// 单个项目的动画
function singleItemAnimation(item, callback, candidatePool) {
    const animationItem = document.getElementById('drawAnimationItem');
    
    // 使用传入的候选池，如果没有则使用默认值
    const candidateItems = candidatePool && candidatePool.length > 0 ? 
        candidatePool : ['抽取中...', '随机选择...', '幸运抽取...', '正在抽取...', '选择中...'];
    let counter = 0;
    const maxIterations = 10; // 减少切换次数，优化性能
    
    // 添加鼓点效果
    const drumrollEffect = createDrumrollEffect();
    document.getElementById('drawAnimationContainer').appendChild(drumrollEffect);
    
    // 随机切换候选项
    function animateRandomSelection() {
        if (counter < maxIterations) {
            // 随机选择一个候选项
            const randomItem = candidateItems[Math.floor(Math.random() * candidateItems.length)];
            
            // 使用更简单的文字切换
            animationItem.innerHTML = '';
            const textSpan = document.createElement('div');
            textSpan.textContent = randomItem;
            textSpan.className = counter < maxIterations - 3 ? 'draw-item-text' : 'draw-item-text slowing';
            animationItem.appendChild(textSpan);
            
            // 简化动画类名控制
            animationItem.className = 'draw-item';
            
            // 速度变化更平滑
            const delay = 100 + Math.min(counter * 30, 200);
            
            // 继续下一次迭代
            counter++;
            const timer = setTimeout(animateRandomSelection, delay);
            window.drawAnimationTimers.push(timer);
            
            // 只在最后两次迭代闪烁背景
            if (counter > maxIterations - 3) {
                flashBackground();
            }
        } else {
            // 移除鼓点效果
            drumrollEffect.remove();
            
            // 直接显示最终结果 - 减少中间过程
            const pauseTimer = setTimeout(() => {
                // 显示最终结果 - 简化类和动画
                animationItem.innerHTML = '';
                const finalSpan = document.createElement('div');
                finalSpan.textContent = item;
                finalSpan.className = 'final-text';
                animationItem.appendChild(finalSpan);
                animationItem.className = 'draw-item highlight';
                
                // 简化：只添加一个冲击波效果
                addShockwaveEffect();
                
                // 简化最终效果处理
                const timer1 = setTimeout(() => {
                    // 使用更简单的类名
                    animationItem.className = 'draw-item final-result';
                    
                    // 提前创建礼花效果，避免最后时刻的卡顿
                    const fireworkElements = createIntenseFireworks();
                    
                    // 2.5秒后结束动画
                    const timer2 = setTimeout(() => {
                        // 清理计时器
                        window.drawAnimationTimers.forEach(t => clearTimeout(t));
                        window.drawAnimationTimers = [];
                        
                        // 移除礼花元素
                        fireworkElements.forEach(element => {
                            if (typeof element === 'function') {
                                element(); // 执行清理函数
                            } else if (element && element.remove) {
                                element.remove();
                            }
                        });
                        
                        // 执行回调
                        if (callback && typeof callback === 'function') {
                            try {
                                callback();
                            } catch (error) {
                                console.error('动画回调函数执行错误:', error);
                                hideDrawAnimation();
                            }
                        } else {
                            hideDrawAnimation();
                        }
                    }, 2500);
                    window.drawAnimationTimers.push(timer2);
                }, 300); // 减少延迟
                window.drawAnimationTimers.push(timer1);
            }, 300); // 减少延迟
            
            window.drawAnimationTimers.push(pauseTimer);
        }
    }
    
    // 开始动画
    animationItem.className = 'draw-item';
    animateRandomSelection();
}

// 创建鼓点效果元素
function createDrumrollEffect() {
    const drumroll = document.createElement('div');
    drumroll.className = 'drumroll-effect';
    
    for (let i = 0; i < 5; i++) {
        const beat = document.createElement('div');
        beat.className = 'drumroll-beat';
        beat.style.animationDelay = `${i * 0.1}s`;
        drumroll.appendChild(beat);
    }
    
    return drumroll;
}

// 闪烁背景增加紧张感
function flashBackground() {
    const container = document.getElementById('drawAnimationContainer');
    container.classList.add('flash');
    
    const timer = setTimeout(() => {
        container.classList.remove('flash');
    }, 100);
    
    window.drawAnimationTimers.push(timer);
}

// 添加冲击波效果
function addShockwaveEffect() {
    const container = document.getElementById('drawAnimationContainer');
    const shockwave = document.createElement('div');
    shockwave.className = 'shockwave';
    container.appendChild(shockwave);
    
    // 动画结束后移除
    const timer = setTimeout(() => {
        shockwave.remove();
    }, 1000);
    
    window.drawAnimationTimers.push(timer);
}

// 创建增强版的礼花效果
function createIntenseFireworks() {
    const fireworkContainer = document.getElementById('fireworkContainer');
    const colors = [
        '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', 
        '#448AFF', '#40C4FF', '#FFD700', '#FFA500', '#76FF03'
    ];
    
    const elements = [];
    
    // 使用一个canvas元素替代多个DOM元素实现礼花效果，大幅提升性能
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    
    fireworkContainer.appendChild(canvas);
    elements.push(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // 创建中心爆发效果 - 仍然使用DOM元素
    const centerBurst = document.createElement('div');
    centerBurst.className = 'center-burst';
    fireworkContainer.appendChild(centerBurst);
    elements.push(centerBurst);
    
    // 创建极简的几个大型礼花 - 仅使用DOM元素
    const simplifiedFireworks = 10; // 减少到10个大型礼花
    
    for (let i = 0; i < simplifiedFireworks; i++) {
            const firework = document.createElement('div');
        firework.className = 'simplified-firework';
        
        // 随机位置 - 更集中在中心区域
        const left = 50 + (Math.random() - 0.5) * 40; // 更窄的范围
        const top = 50 + (Math.random() - 0.5) * 40;  // 更窄的范围
            
            // 随机颜色
            const color = colors[Math.floor(Math.random() * colors.length)];
        
        // 更大的尺寸
        const size = 3 + Math.random() * 2;
            
            firework.style.left = `${left}%`;
            firework.style.top = `${top}%`;
            firework.style.backgroundColor = color;
        firework.style.width = `${size}px`;
        firework.style.height = `${size}px`;
        firework.style.boxShadow = `0 0 ${8 + size}px ${color}`;
        firework.style.animationDelay = `${i * 100}ms`;
        
        fireworkContainer.appendChild(firework);
        elements.push(firework);
    }
    
    // 使用canvas绘制粒子效果，而不是DOM元素
    let particles = [];
    
    // 创建粒子
    function createParticles() {
        // 限制粒子数量
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const x = canvas.width / 2;
            const y = canvas.height / 2;
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            const size = 1 + Math.random() * 2;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                color,
                alpha: 1
            });
        }
    }
    
    // 动画帧
    let frameId;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.01;
            
            if (p.alpha <= 0) {
                particles.splice(i, 1);
                i--;
                continue;
            }
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fill();
        }
        
        if (particles.length > 0) {
            frameId = requestAnimationFrame(animate);
        }
    }
    
    // 分两批创建粒子，减轻瞬时压力
    createParticles();
    
    setTimeout(() => {
        createParticles();
    }, 300);
    
    // 开始动画
    animate();
    
    // 添加清理函数
    const cleanupFunc = () => {
        if (frameId) {
            cancelAnimationFrame(frameId);
        }
    };
    
    elements.push(cleanupFunc);
    
    return elements;
}

// 隐藏抽取动画
function hideDrawAnimation() {
    const container = document.getElementById('drawAnimationContainer');
    container.classList.remove('show');
    document.body.style.overflow = 'auto'; // 恢复页面滚动
    
    // 确保动画容器中的内容被清空
    const animationItem = document.getElementById('drawAnimationItem');
    const fireworkContainer = document.getElementById('fireworkContainer');
    if (animationItem) animationItem.innerHTML = '';
    if (fireworkContainer) fireworkContainer.innerHTML = '';
    
    // 移除所有添加的背景效果元素
    const bgEffect = container.querySelector('.draw-background-effect');
    if (bgEffect) bgEffect.remove();
    
    // 确保取消所有可能的动画帧
    if (window.fireworkAnimationFrame) {
        cancelAnimationFrame(window.fireworkAnimationFrame);
        window.fireworkAnimationFrame = null;
    }
    
    console.log('动画已隐藏'); // 调试信息
}

// 修改随机抽取结果显示函数
function showDrawResult(items) {
        const drawResult = document.getElementById('drawResult');
        const drawResultContent = document.getElementById('drawResultContent');

    if (!drawResult || !drawResultContent) {
        console.error('找不到结果显示元素');
        return;
    }
        
        drawResultContent.innerHTML = items.map((item, index) => 
            `<div class="py-1">${index + 1}. ${item}</div>`
        ).join('');
        
        drawResult.classList.remove('hidden');
    console.log('结果已显示'); // 调试信息
}

// 添加一个重写的performRandomDraw函数，用于修复动画完成后返回的问题
function performRandomDraw_Fixed() {
    const type = document.getElementById('randomDrawTitle').textContent.includes('小组') ? 'group' : 'student';
    const count = parseInt(document.getElementById('drawCount').value) || 1;
    
    // 获取组别筛选状态
    const includeGroupA = document.getElementById('selectGroupA').checked;
    const includeGroupB = document.getElementById('selectGroupB').checked;
    const includeGroupC = document.getElementById('selectGroupC').checked;

    let result = [];
    if (type === 'group') {
        // 随机抽取小组
        const groups = [...appState.groups];
        const originalCount = groups.length;
        const actualCount = Math.min(count, originalCount);
        
        // 检查是否需要使用权重系统 - 仅当抽取1个小组时
        if (count === 1) {
            // 初始化小组权重如果不存在
            if (!appState.groupWeights) {
                appState.groupWeights = {};
                appState.groups.forEach(group => {
                    appState.groupWeights[group.id] = 100; // 初始权重为100
                });
            }
            
            console.log('权重系统启用，抽取前的权重:', JSON.parse(JSON.stringify(appState.groupWeights)));
            
            // 计算总权重
            let totalWeight = 0;
            groups.forEach(group => {
                totalWeight += (appState.groupWeights[group.id] || 100);
            });
            
            // 根据权重随机选择
            let randomWeight = Math.random() * totalWeight;
            let cumulativeWeight = 0;
            let selectedIndex = -1;
            
            for (let i = 0; i < groups.length; i++) {
                cumulativeWeight += (appState.groupWeights[groups[i].id] || 100);
                if (randomWeight <= cumulativeWeight) {
                    selectedIndex = i;
                    break;
                }
            }
            
            const selectedGroup = groups.splice(selectedIndex, 1)[0];
            result.push(selectedGroup);
            
            console.log('被选中的小组ID:', selectedGroup.id);
            
            // 更新权重：被选中的重置为100，未选中的增加50%
            Object.keys(appState.groupWeights).forEach(groupId => {
                if (groupId === selectedGroup.id) {
                    appState.groupWeights[groupId] = 100; // 重置为基础权重
                } else {
                    appState.groupWeights[groupId] = Math.round(appState.groupWeights[groupId] * 1.5); // 增加50%
                }
            });
            
            console.log('抽取后更新的权重:', JSON.parse(JSON.stringify(appState.groupWeights)));
            
            // 保存权重到本地存储
            saveData(appState);
            
            console.log('保存后 appState 中的权重:', JSON.parse(JSON.stringify(appState.groupWeights)));
        } else {
            // 使用普通的随机方法抽取多个小组
            for (let i = 0; i < actualCount; i++) {
                const randomIndex = Math.floor(Math.random() * groups.length);
                const selectedGroup = groups.splice(randomIndex, 1)[0];
                result.push(selectedGroup);
            }
        }
        
        // 只有抽取1个小组时才显示动画
        if (count === 1 && actualCount === 1) {
            // 传递所有可能的小组名称作为候选项
            const allGroupNames = appState.groups.map(group => group.name);
            
            // 这里我们直接使用动画完成后的回调来显示结果
            showDrawAnimation(result.map(group => group.name), function() {
                console.log('动画完成回调执行'); // 调试信息
                showDrawResult(result.map(group => group.name));
            }, allGroupNames);
        } else {
            showDrawResult(result.map(group => group.name));
        }
    } else {
        // 随机抽取学生的逻辑与上面类似
        const eligibleStudents = [];
        appState.groups.forEach(group => {
            // 根据组内学生数量确定学生位置
            const isSevenPersonGroup = group.students.length >= 7;
            const firstRowCount = isSevenPersonGroup ? 4 : 3;
            const students = group.students;

            // 遍历所有学生
            students.forEach((student, index) => {
                // 确定学生所在的列（A组、B组或C组）
                let studentGroup = '';
                if (index === 0 || index === firstRowCount) {
                    studentGroup = 'A';
                } else if (index === 1 || index === firstRowCount + 1) {
                    studentGroup = 'B';
                } else {
                    studentGroup = 'C';
                }
                
                // 根据选择的组别筛选学生
                if ((studentGroup === 'A' && includeGroupA) || 
                    (studentGroup === 'B' && includeGroupB) || 
                    (studentGroup === 'C' && includeGroupC)) {
                    eligibleStudents.push({
                        name: student.name,
                        groupName: group.name
                    });
                }
            });
        });

        // 随机抽取学生
        const availableStudents = [...eligibleStudents];
        // 保存原始学生数，确保可以抽取指定数量
        const originalCount = availableStudents.length;
        const actualCount = Math.min(count, originalCount);
        
        // 准备所有可能的结果
        const allPossibleResults = [];
        for (let i = 0; i < actualCount; i++) {
            const randomIndex = Math.floor(Math.random() * availableStudents.length);
            const selectedStudent = availableStudents.splice(randomIndex, 1)[0];
            result.push(selectedStudent);
            allPossibleResults.push(`${selectedStudent.name}（${selectedStudent.groupName}）`);
        }
        
        // 显示结果
        if (result.length > 0) {
            if (count === 1 && result.length === 1) {
                const allStudentNames = eligibleStudents.map(student => `${student.name}（${student.groupName}）`);
                
                // 直接使用回调显示结果
                showDrawAnimation(result.map(student => `${student.name}（${student.groupName}）`), function() {
                    console.log('学生抽取动画完成回调执行'); // 调试信息
                    showDrawResult(result.map(student => `${student.name}（${student.groupName}）`));
                }, allStudentNames);
            } else {
                showDrawResult(result.map(student => `${student.name}（${student.groupName}）`));
            }
        } else {
            alert('没有符合条件的学生可抽取！');
        }
    }
}

// 在页面加载时替换原有的performRandomDraw函数
document.addEventListener('DOMContentLoaded', function() {
    // 保存原始函数的引用
    window.original_performRandomDraw = window.performRandomDraw;
    
    // 替换为修复版本
    window.performRandomDraw = performRandomDraw_Fixed;
    
    console.log('随机抽取函数已替换为修复版本，原始函数:', typeof window.original_performRandomDraw, '修复函数:', typeof window.performRandomDraw);
    
    // 检查全局 appState 是否有 groupWeights
    if (window.appState) {
        console.log('DOMContentLoaded 时 appState.groupWeights:', window.appState.groupWeights);
    }
});