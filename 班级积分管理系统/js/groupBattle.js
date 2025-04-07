// 小组对决功能

// 对决状态数据（已移除独立存储，整合到appState中）
// 初始化应用状态时会检查这些字段

// 初始化小组对决功能
function initBattleSystem() {
    // 确保appState中有对决相关的字段
    if (!appState.currentBattles) {
        appState.currentBattles = [];
    }
    if (!appState.historyBattles) {
        appState.historyBattles = [];
    }
    
    // 渲染当前对决和历史对决
    renderCurrentBattles();
    renderHistoryBattles();
}

// 已移除loadBattleData函数，使用appState

// 已移除saveBattleData函数，直接使用saveData(appState)

// 显示对决页面
function showBattleModal() {
    const modal = document.getElementById('battleModal');
    modal.classList.add('show');
    
    // 添加入场动画
    const content = modal.querySelector('.modal-content');
    content.style.transition = 'all 0.3s ease-out';
    
    // 先设置初始状态
    content.style.transform = 'scale(0.95)';
    content.style.opacity = '0';
    
    // 触发重排后应用动画
    setTimeout(() => {
        content.style.transform = 'scale(1)';
        content.style.opacity = '1';
    }, 10);
    
    // 默认显示当前对决标签页
    switchBattleTab('current');
}

// 隐藏对决页面
function hideBattleModal() {
    const modal = document.getElementById('battleModal');
    const content = modal.querySelector('.modal-content');
    
    // 添加退出动画
    content.style.transform = 'scale(0.95)';
    content.style.opacity = '0';
    
    // 等待动画完成后隐藏
    setTimeout(() => {
        modal.classList.remove('show');
    }, 300);
}

// 切换对决标签页（当前/历史）
function switchBattleTab(tabName) {
    // 更新标签样式
    document.getElementById('currentBattleTab').classList.remove('border-blue-500', 'text-blue-600');
    document.getElementById('currentBattleTab').classList.add('text-gray-500');
    document.getElementById('historyBattleTab').classList.remove('border-blue-500', 'text-blue-600');
    document.getElementById('historyBattleTab').classList.add('text-gray-500');
    
    // 激活选中的标签
    document.getElementById(`${tabName}BattleTab`).classList.remove('text-gray-500');
    document.getElementById(`${tabName}BattleTab`).classList.add('border-blue-500', 'text-blue-600');
    
    // 显示对应内容
    document.getElementById('currentBattleContent').style.display = tabName === 'current' ? 'block' : 'none';
    document.getElementById('historyBattleContent').style.display = tabName === 'history' ? 'block' : 'none';
    
    // 渲染对应内容
    if (tabName === 'current') {
        renderCurrentBattles();
    } else {
        renderHistoryBattles();
    }
}

// 显示创建对决表单
function showCreateBattleForm() {
    const modal = document.getElementById('battleFormModal');
    modal.classList.add('show');
    
    // 添加动画效果
    const formContent = modal.querySelector('.modal-content');
    formContent.classList.add('animate-scale-in');
    
    // 加载小组选项
    const groupSelectContainer = document.getElementById('battleGroupSelect');
    groupSelectContainer.innerHTML = '';
    
    appState.groups.forEach(group => {
        const checkbox = document.createElement('div');
        checkbox.className = 'flex items-center my-2 p-2 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors';
        checkbox.innerHTML = `
            <input type="checkbox" id="battle_group_${group.id}" name="battle_groups" value="${group.id}" 
                   class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
            <label for="battle_group_${group.id}" class="ml-2 block text-sm text-gray-900 w-full cursor-pointer">
                ${group.name} 
                <span class="float-right font-medium ${group.remainingScore >= 10 ? 'text-green-600' : 'text-amber-600'}">
                    ${group.remainingScore.toFixed(2)} 积分
                </span>
            </label>
        `;
        groupSelectContainer.appendChild(checkbox);
    });
}

// 隐藏创建对决表单
function hideBattleForm() {
    const modal = document.getElementById('battleFormModal');
    const formContent = modal.querySelector('.modal-content');
    
    // 添加退出动画
    formContent.classList.remove('animate-scale-in');
    formContent.classList.add('animate-scale-out');
    
    // 等待动画完成后隐藏
    setTimeout(() => {
        modal.classList.remove('show');
        formContent.classList.remove('animate-scale-out');
    }, 200);
}

// 创建新对决
function createBattle() {
    const title = document.getElementById('battleTitle').value.trim();
    const ticketAmount = parseFloat(document.getElementById('battleTicket').value);
    const incentive = parseFloat(document.getElementById('battleIncentive').value || 0);
    
    // 验证输入
    if (!title) {
        alert('请输入对决主题');
        return;
    }
    
    if (isNaN(ticketAmount) || ticketAmount <= 0) {
        alert('请输入有效的门票积分');
        return;
    }
    
    // 获取选中的小组
    const selectedGroups = [];
    const checkboxes = document.querySelectorAll('input[name="battle_groups"]:checked');
    
    if (checkboxes.length < 2) {
        alert('至少需要选择两个小组参与对决');
        return;
    }
    
    checkboxes.forEach(checkbox => {
        const groupId = checkbox.value;
        const group = appState.groups.find(g => g.id === groupId);
        
        if (group.remainingScore < ticketAmount) {
            alert(`${group.name}的剩余积分不足，无法支付门票`);
            return;
        }
        
        selectedGroups.push({
            id: group.id,
            name: group.name
        });
    });
    
    // 如果有任何小组积分不足，终止创建过程
    if (selectedGroups.length < 2) {
        return;
    }
    
    // 创建对决
    const battle = {
        id: Date.now().toString(),
        title,
        ticketAmount,
        incentive,
        createdAt: new Date().toISOString(),
        groups: selectedGroups,
        status: 'ongoing', // ongoing, completed
        winners: [],
        totalPool: ticketAmount * selectedGroups.length
    };
    
    // 扣除参与小组的门票积分
    selectedGroups.forEach(selectedGroup => {
        // 从小组剩余积分和历史积分中扣除门票
        appState.groups = appState.groups.map(group => {
            if (group.id === selectedGroup.id) {
                // 创建积分减少记录（不再使用exchangeRecords）
                const scoreRecord = {
                    id: Date.now().toString() + "_" + group.id,
                    timestamp: new Date().toISOString(),
                    studentId: null, // 无学生，直接给小组扣分
                    score: -ticketAmount, // 负值表示扣分
                    description: `【小组对决】${group.name} 参加对决: ${title}，支付门票积分`,
                    // 积分直接从小组扣除，不通过学生
                    affectedStudents: [],
                    type: 'battle' // 标记为对决类型
                };
                
                // 添加到积分记录而非兑换记录
                appState.scoreRecords = [scoreRecord, ...appState.scoreRecords];
                
                return {
                    ...group,
                    totalScore: group.totalScore - ticketAmount, // 扣除历史总积分
                    remainingScore: group.remainingScore - ticketAmount // 扣除剩余积分
                };
            }
            return group;
        });
    });
    
    // 保存小组数据
    saveData(appState);
    
    // 添加到当前对决
    if (!appState.currentBattles) {
        appState.currentBattles = [];
    }
    appState.currentBattles.push(battle);
    
    // 保存对决数据
    saveData(appState);
    
    // 渲染对决列表
    renderCurrentBattles();
    
    // 刷新页面显示
    renderGroups(appState.groups);
    
    // 更新积分曲线、排名和荣誉殿堂
    updateAllRankings();
    
    // 隐藏表单
    hideBattleForm();
}

// 渲染当前对决列表
function renderCurrentBattles() {
    const container = document.getElementById('currentBattleList');
    
    if (!container) return;
    
    if (!appState.currentBattles || appState.currentBattles.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>当前没有进行中的对决</p>
                <button id="createBattleBtn" class="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md">
                    <span class="flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        创建新对决
                    </span>
                </button>
            </div>
        `;
        // 确保按钮存在后再添加事件监听器
        const createBattleBtn = document.getElementById('createBattleBtn');
        if (createBattleBtn) {
            createBattleBtn.addEventListener('click', showCreateBattleForm);
        }
        return;
    }
    
    // 显示对决列表
    let html = `
        <div class="mb-4 flex justify-end">
            <button id="createBattleBtn" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md">
                <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    创建新对决
                </span>
            </button>
        </div>
        <div class="space-y-6">
    `;
    
    appState.currentBattles.forEach(battle => {
        html += `
            <div class="battle-card bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-5 transform hover:scale-[1.01] transition-all duration-200 border border-gray-200 hover:border-blue-200" data-battle-id="${battle.id}">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-xl font-bold text-gray-800">${battle.title}</h3>
                    <span class="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full">${new Date(battle.createdAt).toLocaleString()}</span>
                </div>
                <div class="mb-4 border-b border-gray-200 pb-3">
                    <div class="flex items-center text-sm text-gray-700 mb-2">
                        <svg class="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                        </svg>
                        参与小组: <span class="font-medium ml-1">${battle.groups.map(g => g.name).join('、')}</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-700 mb-2">
                        <svg class="w-5 h-5 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                        </svg>
                        门票: <span class="font-medium ml-1 text-amber-600">${battle.ticketAmount.toFixed(2)} 积分/组</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-700">
                        <svg class="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clip-rule="evenodd"></path>
                        </svg>
                        总奖池: <span class="font-bold ml-1 text-red-600">${battle.totalPool.toFixed(2)} 积分</span>
                    </div>
                    ${battle.incentive > 0 ? `
                    <div class="flex items-center text-sm text-gray-700 mt-2">
                        <svg class="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clip-rule="evenodd"></path>
                        </svg>
                        额外奖励: <span class="font-bold ml-1 text-purple-600">${battle.incentive.toFixed(2)} 积分</span>
                    </div>` : ''}
                </div>
                <div class="flex gap-3">
                    <button class="join-battle-btn flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md" 
                            data-battle-id="${battle.id}">
                        <span class="flex items-center justify-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                            </svg>
                            加入对决
                        </span>
                    </button>
                    <button class="settle-battle-btn flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md" 
                            data-battle-id="${battle.id}">
                        <span class="flex items-center justify-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            胜利结算
                        </span>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // 绑定按钮事件
    document.getElementById('createBattleBtn').addEventListener('click', showCreateBattleForm);
    
    document.querySelectorAll('.join-battle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const battleId = btn.getAttribute('data-battle-id');
            showJoinBattleForm(battleId);
        });
    });
    
    document.querySelectorAll('.settle-battle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const battleId = btn.getAttribute('data-battle-id');
            showSettleBattleForm(battleId);
        });
    });
}

// 渲染历史对决列表
function renderHistoryBattles() {
    const container = document.getElementById('historyBattleList');
    
    if (!container) return;
    
    if (!appState.historyBattles || appState.historyBattles.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>没有历史对决记录</p>
            </div>
        `;
        return;
    }
    
    // 显示历史对决列表
    let html = '<div class="space-y-6">';
    
    appState.historyBattles.forEach(battle => {
        html += `
            <div class="battle-card bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md p-5 border border-gray-200">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-xl font-bold text-gray-800">${battle.title}</h3>
                    <span class="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full">${new Date(battle.createdAt).toLocaleString()}</span>
                </div>
                <div class="mb-3 border-b border-gray-200 pb-3">
                    <div class="flex items-center text-sm text-gray-700 mb-2">
                        <svg class="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                        </svg>
                        参与小组: <span class="font-medium ml-1">${battle.groups.map(g => g.name).join('、')}</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-700 mb-2">
                        <svg class="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="font-medium text-green-600">获胜小组: 
                            ${battle.winners.map(g => `
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    ${g.name}
                                    <svg class="ml-1 w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                    </svg>
                                </span>
                            `).join(' ')}
                        </span>
                    </div>
                    <div class="flex items-center text-sm text-gray-700 mb-2">
                        <svg class="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clip-rule="evenodd"></path>
                        </svg>
                        奖池: <span class="font-bold ml-1 text-red-600">${battle.totalPool.toFixed(2)} 积分</span>
                    </div>
                    ${battle.incentive > 0 ? `
                    <div class="flex items-center text-sm text-gray-700">
                        <svg class="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clip-rule="evenodd"></path>
                        </svg>
                        额外奖励: <span class="font-bold ml-1 text-purple-600">${battle.incentive.toFixed(2)} 积分</span>
                    </div>` : ''}
                </div>
                <div class="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                    </svg>
                    结算时间: ${new Date(battle.settledAt).toLocaleString()}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// 显示加入对决表单
function showJoinBattleForm(battleId) {
    const battle = appState.currentBattles.find(b => b.id === battleId);
    if (!battle) return;
    
    const modal = document.getElementById('joinBattleFormModal');
    modal.classList.add('show');
    
    // 添加入场动画
    const content = modal.querySelector('.modal-content');
    content.style.transition = 'all 0.3s ease-out';
    content.style.transform = 'scale(0.95)';
    content.style.opacity = '0';
    
    setTimeout(() => {
        content.style.transform = 'scale(1)';
        content.style.opacity = '1';
    }, 10);
    
    document.getElementById('joinBattleTitle').textContent = `加入对决: ${battle.title}`;
    
    // 加载小组选项，排除已参与的小组
    const joinGroupSelect = document.getElementById('joinBattleGroupSelect');
    joinGroupSelect.innerHTML = '';
    
    const existingGroupIds = battle.groups.map(g => g.id);
    
    appState.groups.forEach(group => {
        // 跳过已经参与的小组
        if (existingGroupIds.includes(group.id)) return;
        
        const checkbox = document.createElement('div');
        checkbox.className = 'flex items-center my-2 p-2 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors';
        checkbox.innerHTML = `
            <input type="checkbox" id="join_battle_group_${group.id}" name="join_battle_groups" value="${group.id}" 
                   class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                   ${group.remainingScore < battle.ticketAmount ? 'disabled' : ''}>
            <label for="join_battle_group_${group.id}" class="ml-2 block text-sm text-gray-900 w-full cursor-pointer">
                ${group.name} 
                <span class="float-right font-medium ${group.remainingScore >= battle.ticketAmount ? 'text-green-600' : 'text-red-600'}">
                    ${group.remainingScore.toFixed(2)} 积分
                    ${group.remainingScore < battle.ticketAmount ? ' - 积分不足' : ''}
                </span>
            </label>
        `;
        joinGroupSelect.appendChild(checkbox);
    });
    
    // 保存当前对决ID到表单，用于提交时识别
    document.getElementById('joinBattleForm').setAttribute('data-battle-id', battleId);
}

// 隐藏加入对决表单
function hideJoinBattleForm() {
    const modal = document.getElementById('joinBattleFormModal');
    const content = modal.querySelector('.modal-content');
    
    // 添加退出动画
    content.style.transform = 'scale(0.95)';
    content.style.opacity = '0';
    
    // 等待动画完成后隐藏
    setTimeout(() => {
        modal.classList.remove('show');
    }, 300);
}

// 加入对决
function joinBattle() {
    const battleId = document.getElementById('joinBattleForm').getAttribute('data-battle-id');
    const battle = appState.currentBattles.find(b => b.id === battleId);
    
    if (!battle) return;
    
    // 获取选中的小组
    const checkboxes = document.querySelectorAll('input[name="join_battle_groups"]:checked');
    
    if (checkboxes.length === 0) {
        alert('请至少选择一个小组参与对决');
        return;
    }
    
    // 新参与的小组
    const newGroups = [];
    
    checkboxes.forEach(checkbox => {
        const groupId = checkbox.value;
        const group = appState.groups.find(g => g.id === groupId);
        
        if (group.remainingScore < battle.ticketAmount) {
            alert(`${group.name}的剩余积分不足，无法支付门票`);
            return;
        }
        
        newGroups.push({
            id: group.id,
            name: group.name
        });
    });
    
    // 如果有小组积分不足，终止过程
    if (newGroups.length === 0) {
        return;
    }
    
    // 扣除新参与小组的门票积分
    newGroups.forEach(newGroup => {
        // 从小组历史积分和剩余积分中扣除门票
        appState.groups = appState.groups.map(group => {
            if (group.id === newGroup.id) {
                // 创建积分减少记录（不再使用exchangeRecords）
                const scoreRecord = {
                    id: Date.now().toString() + "_" + group.id,
                    timestamp: new Date().toISOString(),
                    studentId: null, // 无学生，直接给小组扣分
                    score: -battle.ticketAmount, // 负值表示扣分
                    description: `【小组对决】${group.name} 参加对决: ${battle.title}，支付门票积分`,
                    // 积分直接从小组扣除，不通过学生
                    affectedStudents: [],
                    type: 'battle' // 标记为对决类型
                };
                
                // 添加到积分记录而非兑换记录
                appState.scoreRecords = [scoreRecord, ...appState.scoreRecords];
                
                return {
                    ...group,
                    totalScore: group.totalScore - battle.ticketAmount, // 扣除历史总积分
                    remainingScore: group.remainingScore - battle.ticketAmount // 扣除剩余积分
                };
            }
            return group;
        });
    });
    
    // 更新对决信息
    battle.groups = [...battle.groups, ...newGroups];
    battle.totalPool += battle.ticketAmount * newGroups.length;
    
    // 更新界面
    saveData(appState);
    renderCurrentBattles();
    renderGroups(appState.groups);
    
    // 更新积分曲线、排名和荣誉殿堂
    updateAllRankings();
    
    // 隐藏表单
    hideJoinBattleForm();
}

// 显示结算对决表单
function showSettleBattleForm(battleId) {
    const battle = appState.currentBattles.find(b => b.id === battleId);
    if (!battle) return;
    
    const modal = document.getElementById('settleBattleFormModal');
    modal.classList.add('show');
    
    // 添加入场动画
    const content = modal.querySelector('.modal-content');
    content.style.transition = 'all 0.3s ease-out';
    content.style.transform = 'scale(0.95)';
    content.style.opacity = '0';
    
    setTimeout(() => {
        content.style.transform = 'scale(1)';
        content.style.opacity = '1';
    }, 10);
    
    document.getElementById('settleBattleTitle').textContent = `结算对决: ${battle.title}`;
    
    // 加载参与小组列表
    const settleBattleGroupSelect = document.getElementById('settleBattleGroupSelect');
    settleBattleGroupSelect.innerHTML = '';
    
    battle.groups.forEach(group => {
        const checkbox = document.createElement('div');
        checkbox.className = 'flex items-center my-2 p-2 border border-gray-200 rounded-lg hover:bg-green-50 transition-colors';
        checkbox.innerHTML = `
            <input type="checkbox" id="settle_battle_group_${group.id}" name="settle_battle_groups" value="${group.id}" 
                   class="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500">
            <label for="settle_battle_group_${group.id}" class="ml-2 block text-sm text-gray-900 w-full cursor-pointer">
                ${group.name}
                <span class="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full float-right">
                    潜在获胜者
                </span>
            </label>
        `;
        settleBattleGroupSelect.appendChild(checkbox);
    });
    
    // 显示对决信息
    document.getElementById('settleBattleInfo').innerHTML = `
        <div class="flex flex-col">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600">总奖池:</span>
                <span class="text-lg font-bold text-red-600">${battle.totalPool.toFixed(2)} 积分</span>
            </div>
            ${battle.incentive > 0 ? `
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-600">额外奖励:</span>
                <span class="text-lg font-bold text-purple-600">${battle.incentive.toFixed(2)} 积分</span>
            </div>
            ` : ''}
            <div class="mt-2 pt-2 border-t border-gray-200 text-sm text-center text-gray-500">
                获胜奖励将平均分配给所有获胜小组
            </div>
        </div>
    `;
    
    // 保存当前对决ID到表单
    document.getElementById('settleBattleForm').setAttribute('data-battle-id', battleId);
}

// 隐藏结算对决表单
function hideSettleBattleForm() {
    const modal = document.getElementById('settleBattleFormModal');
    const content = modal.querySelector('.modal-content');
    
    // 添加退出动画
    content.style.transform = 'scale(0.95)';
    content.style.opacity = '0';
    
    // 等待动画完成后隐藏
    setTimeout(() => {
        modal.classList.remove('show');
    }, 300);
}

// 结算对决
function settleBattle() {
    const battleId = document.getElementById('settleBattleForm').getAttribute('data-battle-id');
    const battle = appState.currentBattles.find(b => b.id === battleId);
    
    if (!battle) return;
    
    // 获取选中的获胜小组
    const checkboxes = document.querySelectorAll('input[name="settle_battle_groups"]:checked');
    
    if (checkboxes.length === 0) {
        alert('请至少选择一个获胜小组');
        return;
    }
    
    const winners = [];
    
    checkboxes.forEach(checkbox => {
        const groupId = checkbox.value;
        const groupInfo = battle.groups.find(g => g.id === groupId);
        winners.push(groupInfo);
    });
    
    // 计算每个获胜小组应获得的积分
    const totalWinnerScore = battle.totalPool + battle.incentive;
    const scorePerWinner = totalWinnerScore / winners.length;
    
    // 更新获胜小组的积分
    winners.forEach(winner => {
        const groupId = winner.id;
        const group = appState.groups.find(g => g.id === groupId);
        
        if (group) {
            // 创建积分记录
            const scoreRecord = {
                id: Date.now().toString() + "_" + group.id,
                timestamp: new Date().toISOString(),
                studentId: null, // 无学生，直接给小组
                score: scorePerWinner, // 正值表示加分
                description: `【小组对决】${group.name} 在对决: ${battle.title} 中获胜，获得积分奖励`,
                // 积分直接分配给小组，不通过学生
                affectedStudents: [],
                type: 'battle' // 标记为对决类型
            };
            
            appState.scoreRecords = [scoreRecord, ...appState.scoreRecords];
            
            // 更新小组积分
            appState.groups = appState.groups.map(g => {
                if (g.id === groupId) {
                    return {
                        ...g,
                        totalScore: g.totalScore + scorePerWinner,
                        remainingScore: g.remainingScore + scorePerWinner
                    };
                }
                return g;
            });
        }
    });
    
    // 更新对决状态
    battle.status = 'completed';
    battle.winners = winners;
    battle.settledAt = new Date().toISOString();
    
    // 将对决从当前移到历史
    appState.currentBattles = appState.currentBattles.filter(b => b.id !== battleId);
    if (!appState.historyBattles) {
        appState.historyBattles = [];
    }
    appState.historyBattles.unshift(battle);
    
    // 保存数据
    saveData(appState);
    
    // 更新界面
    renderCurrentBattles();
    renderHistoryBattles();
    renderGroups(appState.groups);
    
    // 更新所有排名相关数据
    updateAllRankings();
    
    // 隐藏表单
    hideSettleBattleForm();
    
    // 显示胜利动画效果
    showVictoryAnimation(winners);
}

// 显示胜利动画效果
function showVictoryAnimation(winners) {
    // 创建一个胜利动画层
    const victoryOverlay = document.createElement('div');
    victoryOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    victoryOverlay.style.animation = 'fadeIn 0.5s ease-out';
    
    // 创建胜利内容
    const victoryContent = document.createElement('div');
    victoryContent.className = 'bg-white rounded-lg p-6 max-w-md w-full text-center shadow-2xl';
    victoryContent.style.animation = 'scaleIn 0.5s ease-out';
    
    // 胜利标题
    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold mb-4 text-red-600';
    title.textContent = '恭喜获胜！';
    
    // 获胜小组列表
    const winnersList = document.createElement('div');
    winnersList.className = 'space-y-2 mb-4';
    
    winners.forEach(winner => {
        const winnerItem = document.createElement('div');
        winnerItem.className = 'flex items-center justify-center bg-green-100 p-3 rounded-lg';
        
        winnerItem.innerHTML = `
            <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                ${winner.name.charAt(0)}
            </div>
            <div class="text-left">
                <div class="font-semibold text-lg">${winner.name}</div>
                <div class="text-green-600 font-medium">
                    +${(battle.totalPool + battle.incentive) / winners.length} 积分
                </div>
            </div>
        `;
        
        winnersList.appendChild(winnerItem);
    });
    
    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'mt-4 px-6 py-2 bg-gradient-to-r from-red-500 to-amber-500 text-white rounded-lg hover:from-red-600 hover:to-amber-600 transition-all duration-200 transform hover:scale-105 shadow-md';
    closeButton.textContent = '关闭';
    closeButton.onclick = () => {
        // 添加退出动画
        victoryOverlay.style.animation = 'fadeOut 0.5s ease-out';
        victoryContent.style.animation = 'scaleOut 0.5s ease-out';
        
        // 等待动画完成后移除
        setTimeout(() => {
            document.body.removeChild(victoryOverlay);
        }, 500);
    };
    
    // 拼接元素
    victoryContent.appendChild(title);
    victoryContent.appendChild(winnersList);
    victoryContent.appendChild(closeButton);
    victoryOverlay.appendChild(victoryContent);
    
    // 添加到页面
    document.body.appendChild(victoryOverlay);
    
    // 添加一些CSS动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes scaleIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        @keyframes scaleOut {
            from { transform: scale(1); opacity: 1; }
            to { transform: scale(0.8); opacity: 0; }
        }
        @keyframes slideIn {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .animate-scale-in {
            animation: scaleIn 0.3s ease-out;
        }
        .animate-scale-out {
            animation: scaleOut 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
}

// 更新所有排名相关数据
function updateAllRankings() {
    console.log("正在更新所有排名相关数据...");
    
    // 如果updateAppUI函数可用，直接调用它来更新整个UI
    if (typeof window.updateAppUI === 'function') {
        window.updateAppUI();
        return; // 已经全部更新，无需继续执行下面的代码
    }
    
    // 如果updateAppUI不可用，则使用备用方案
    
    // 直接调用ui.js中的渲染函数刷新整个页面显示
    if (typeof renderScoreRecords === 'function') {
        renderScoreRecords();
    }
    
    // 更新小组排名
    if (typeof renderGroups === 'function') {
        renderGroups(appState.groups);
    }
    
    // 更新每周排名（如果有）
    if (typeof updateWeeklyRankings === 'function') {
        updateWeeklyRankings();
    }
    
    // 更新积分曲线（如果有）
    try {
        if (typeof updateScoreChart === 'function') {
            updateScoreChart();
        } else if (window.updateScoreChart) {
            window.updateScoreChart();
        }
    } catch (e) {
        console.error("更新积分曲线时出错:", e);
    }
    
    // 更新排名（如果有）
    try {
        if (typeof updateGroupRanking === 'function') {
            updateGroupRanking();
        } else if (window.updateGroupRanking) {
            window.updateGroupRanking();
        }
    } catch (e) {
        console.error("更新小组排名时出错:", e);
    }
    
    // 更新荣誉殿堂（如果有）
    try {
        if (typeof updateHallOfFame === 'function') {
            updateHallOfFame();
        } else if (window.updateHallOfFame) {
            window.updateHallOfFame();
        }
    } catch (e) {
        console.error("更新荣誉殿堂时出错:", e);
    }
    
    // 立即更新UI，解决某些函数可能在其他文件中的问题
    setTimeout(() => {
        // 触发一个自定义事件，通知其他文件数据已更新
        const updateEvent = new CustomEvent('appStateUpdated', { detail: { source: 'battle' } });
        document.dispatchEvent(updateEvent);
    }, 100);
}

// 在页面加载时初始化对决系统
document.addEventListener('DOMContentLoaded', function() {
    // 延迟加载，确保appState已经初始化
    setTimeout(() => {
        // 确保appState中有对决相关的字段
        if (!appState.currentBattles) {
            appState.currentBattles = [];
        }
        if (!appState.historyBattles) {
            appState.historyBattles = [];
        }
    }, 500);
    
    // 监听appState更新事件
    document.addEventListener('appStateUpdated', function(e) {
        // 如果更新来源不是battle，则需要刷新battle界面
        if (e.detail && e.detail.source !== 'battle') {
            renderCurrentBattles();
            renderHistoryBattles();
        }
    });
}); 