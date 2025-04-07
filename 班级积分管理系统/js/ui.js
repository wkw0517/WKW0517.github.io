const levelColors = [
    'bg-blue-100',   // 师傅
    'bg-green-100',  // 二级师傅
    'bg-yellow-100', // 三级师傅
    'bg-red-100',    // 徒弟
];

function showGroupForm(editMode = false, groupId = null) {
    const password = prompt('请输入管理密码：');
    if (password === '0605') {
        const modal = document.getElementById('groupFormModal');
        modal.classList.add('show');
        
        // 获取要编辑的组信息
        const group = groupId ? appState.groups.find(g => g.id === groupId) : null;
        
        // 添加表单头部
        const formHeader = document.querySelector('#groupFormModal .modal-header');
        formHeader.innerHTML = `
            <div class="flex items-center justify-between w-full">
                <h3 class="text-lg font-bold">${editMode ? '编辑小组' : '创建小组'}</h3>
                <div class="flex items-center gap-2">
                    ${!editMode ? `
                        <input type="file" id="excelFileInput" accept=".xlsx,.xls" class="hidden" onchange="handleExcelImport(event)">
                        <button onclick="document.getElementById('excelFileInput').click()" 
                            class="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors">
                            从Excel导入
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        // 修改表单内容
        const form = document.getElementById('groupForm');
        const formContent = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">小组头像</label>
                    <div class="mt-1 flex items-center gap-4">
                        <div class="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                            <img id="groupAvatar" src="${group?.avatar || ''}" class="w-full h-full object-cover ${group?.avatar ? '' : 'hidden'}">
                            <span id="avatarPlaceholder" class="text-gray-400 ${group?.avatar ? 'hidden' : ''}">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                                </svg>
                            </span>
                        </div>
                        <div class="flex gap-2">
                            <input type="file" id="avatarInput" accept="image/*" class="hidden" onchange="handleAvatarChange(event)">
                            <button type="button" onclick="document.getElementById('avatarInput').click()" 
                                class="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors">
                                选择图片
                            </button>
                            <button type="button" onclick="clearAvatar()" 
                                class="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors">
                                清除图片
                            </button>
                        </div>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">小组背景图片</label>
                    <div class="mt-1 flex items-center gap-4">
                        <div class="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                            <img id="groupBackground" src="${group?.backgroundImage || ''}" class="w-full h-full object-cover ${group?.backgroundImage ? '' : 'hidden'}">
                            <span id="backgroundPlaceholder" class="text-gray-400 ${group?.backgroundImage ? 'hidden' : ''}">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                            </span>
                        </div>
                    </div>
                    <div class="flex gap-2 mt-2">
                        <input type="file" id="backgroundInput" accept="image/*" class="hidden" onchange="handleBackgroundChange(event)">
                        <button type="button" onclick="document.getElementById('backgroundInput').click()" 
                            class="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors">
                            选择背景图片
                        </button>
                        <button type="button" onclick="clearBackground()" 
                            class="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors">
                            清除背景图片
                        </button>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">支持JPG、PNG格式，大小不超过30MB</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">小组名称</label>
                    <input
                        type="text"
                        id="groupName"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                        value="${group?.name || ''}"
                    >
                </div>
                ${!editMode ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">学生列表</label>
                        <div id="studentsList" class="space-y-2"></div>
                        <button type="button" onclick="addStudent()" class="mt-2 text-blue-600 hover:text-blue-700">
                            + 添加学生
                        </button>
                    </div>
                ` : ''}
                ${editMode ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700">积分调整</label>
                        <div class="grid grid-cols-2 gap-4 mt-2">
                            <div>
                                <label class="block text-xs text-gray-500">历史积分</label>
                                <input
                                    type="number"
                                    id="totalScore"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value="${group?.totalScore || 0}"
                                    step="0.01"
                                >
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500">剩余积分</label>
                                <input
                                    type="number"
                                    id="remainingScore"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value="${group?.remainingScore || 0}"
                                    step="0.01"
                                >
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
            <input type="hidden" id="groupId" value="${groupId || ''}">
            <input type="hidden" id="editMode" value="${editMode}">
            <div class="mt-4 flex justify-end gap-2">
                <button type="button" onclick="hideGroupForm()" class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                    取消
                </button>
                <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    ${editMode ? '保存修改' : '创建小组'}
                </button>
            </div>
        `;
        
        form.innerHTML = formContent;
        
        // 如果是创建模式，添加一个默认的学生输入框
        if (!editMode) {
            addStudent();
        }
    } else {
        alert('密码错误！');
    }
}

function hideGroupForm() {
    document.getElementById('groupFormModal').classList.remove('show');
    document.getElementById('groupForm').reset();
    document.getElementById('studentsList').innerHTML = '';
}

function showRecords() {
    document.getElementById('recordsModal').classList.add('show');
    switchTab('score');
}

function hideRecords() {
    document.getElementById('recordsModal').classList.remove('show');
}

function switchTab(tab) {
    const scoreTab = document.getElementById('scoreTab');
    const exchangeTab = document.getElementById('exchangeTab');
    
    if (tab === 'score') {
        scoreTab.classList.add('border-blue-500', 'text-blue-600');
        scoreTab.classList.remove('text-gray-500');
        exchangeTab.classList.remove('border-blue-500', 'text-blue-600');
        exchangeTab.classList.add('text-gray-500');
        renderScoreRecords();
    } else {
        exchangeTab.classList.add('border-blue-500', 'text-blue-600');
        exchangeTab.classList.remove('text-gray-500');
        scoreTab.classList.remove('border-blue-500', 'text-blue-600');
        scoreTab.classList.add('text-gray-500');
        renderExchangeRecords();
    }
}

function addStudent() {
    const studentsList = document.getElementById('studentsList');
    const studentIndex = studentsList.children.length;
    
    const studentDiv = document.createElement('div');
    studentDiv.className = 'flex gap-2 items-center';
    studentDiv.innerHTML = `
        <input
            type="text"
            name="student_name_${studentIndex}"
            placeholder="学生姓名"
            class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
            onchange="updateMentorOptions()"
            maxlength="1"
        />
        <select
            name="student_mentor_${studentIndex}"
            class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            style="display: none"
        >
            <option value="">无师傅</option>
        </select>
        <button
            type="button"
            onclick="this.parentElement.remove(); updateMentorOptions()"
            class="text-red-600 hover:text-red-700"
        >
            删除
        </button>
    `;
    
    studentsList.appendChild(studentDiv);
}

function updateMentorOptions() {
    const studentsList = document.getElementById('studentsList');
    const students = Array.from(studentsList.children);
    
    students.forEach((studentDiv, studentIndex) => {
        const select = studentDiv.querySelector(`[name="student_mentor_${studentIndex}"]`);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = `
                <option value="">无师傅</option>
                ${students.map((div, i) => {
                    if (i !== studentIndex) {
                        const nameInput = div.querySelector(`[name="student_name_${i}"]`);
                        const studentName = nameInput ? nameInput.value : `学生 ${i + 1}`;
                        return `<option value="${i}" ${currentValue === i.toString() ? 'selected' : ''}>${studentName}</option>`;
                    }
                    return '';
                }).join('')}
            `;
        }
    });
}

function getRankStyle(rank) {
    if (rank === 1) return { card: 'group-card-king', badge: 'rank-king', name: '最强王者' };
    if (rank === 2) return { card: 'group-card-master', badge: 'rank-master', name: '大师' };
    if (rank === 3) return { card: 'group-card-diamond', badge: 'rank-diamond', name: '钻石' };
    if (rank === 4) return { card: 'group-card-platinum', badge: 'rank-platinum', name: '铂金' };
    if (rank === 5) return { card: 'group-card-gold', badge: 'rank-gold', name: '黄金' };
    if (rank === 6) return { card: 'group-card-silver', badge: 'rank-silver', name: '白银' };
    if (rank === 7) return { card: 'group-card-bronze', badge: 'rank-bronze', name: '青铜' };
    return { card: 'group-card-iron', badge: 'rank-iron', name: '黑铁' };
}

function renderGroups(groups) {
    const container = document.getElementById('groupsContainer');
    
    // 计算排名但不改变顺序
    const groupsWithRank = groups.map(group => ({
        ...group,
        rank: groups.filter(g => g.totalScore > group.totalScore).length + 1
    }));

    const groupsHtml = groupsWithRank.map(group => {
        const rankStyle = getRankStyle(group.rank);
        const totalStudents = group.students.length;
        const firstRowCount = totalStudents > 6 ? 4 : Math.ceil(totalStudents / 2);
        const firstRow = group.students.slice(0, firstRowCount);
        const secondRow = group.students.slice(firstRowCount);

        const studentCardHtml = student => `
            <div class="student-card cursor-pointer hover:shadow-sm transition-all duration-200" 
                 onclick="showStudentMenu(event, '${student.id}', '${group.id}')"
                 ontouchstart="showStudentMenu(event, '${student.id}', '${group.id}')">
                <div class="student-info flex items-center justify-between">
                    <div class="student-name font-medium text-gray-800">${student.name}</div>
                    <span class="font-mono font-semibold text-lg ${student.score >= 0 ? 'text-green-600' : 'text-red-600'}">${student.score.toFixed(2)}</span>
                </div>
            </div>
        `;

        // 设置背景图片样式
        const backgroundStyle = group.backgroundImage ? 
            `style="position: relative; overflow: hidden;"` : '';
            
        let cardContent = '';
        
        if (group.backgroundImage) {
            cardContent = `
            <div class="border rounded-lg shadow-md h-full overflow-hidden ${rankStyle.card}" style="position: relative;">
                <!-- 背景图片层 -->
                <div style="position: absolute; inset: 0; z-index: 0;">
                    <div style="position: absolute; inset: 0; background-image: url('${group.backgroundImage}'); background-size: cover; background-position: center; filter: blur(1px); transform: scale(1.1);"></div>
                    <div style="position: absolute; inset: 0; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(1px);"></div>
                </div>
                <!-- 内容层 -->
                <div class="relative z-10 p-4 h-full overflow-y-auto">
                    <div class="group-header mb-3">`;
        } else {
            cardContent = `
            <div class="border rounded-lg p-4 shadow-md h-full overflow-y-auto ${rankStyle.card}">
                <div class="group-header mb-3">`;
        }
        
        return cardContent +`
                <div class="flex items-center gap-4 mb-3">
                    <div class="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50">
                        ${group.avatar ? 
                            `<img src="${group.avatar}" alt="${group.name}" class="w-full h-full object-cover">` :
                            `<span class="text-gray-400">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                            </span>`
                        }
                    </div>
                    <div class="flex-1">
                        <div class="group-title flex items-center justify-between">
                            <h3 class="text-lg font-bold flex items-center gap-2">
                                ${group.name}
                                <span class="rank-badge ${rankStyle.badge} text-sm">${rankStyle.name}</span>
                            </h3>
                            <button onclick="showGroupForm(true, '${group.id}')" 
                                class="text-gray-500 hover:text-gray-700">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                            </button>
                        </div>
                        <div class="flex items-center gap-4 text-sm mt-1">
                            <div class="flex items-center gap-1">
                                <span class="text-gray-600">历史:</span>
                                <span class="font-bold ${group.totalScore >= 0 ? 'text-gray-900' : 'text-red-600'}">${group.totalScore.toFixed(2)}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="text-gray-600">剩余:</span>
                                <span class="font-bold ${group.remainingScore >= 0 ? 'text-green-600' : 'text-red-600'}">${group.remainingScore.toFixed(2)}</span>
                                <button onclick="event.stopPropagation(); handleGroupExchange('${group.id}')" 
                                    class="ml-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded hover:bg-blue-600 transition-colors">
                                    兑换
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="space-y-2">
                <!-- 第一行学生 -->
                <div class="grid grid-cols-4 gap-2">
                    ${firstRow.map(student => studentCardHtml(student)).join('')}
                </div>
                <!-- 第二行学生 -->
                ${secondRow.length > 0 ? `
                <div class="grid grid-cols-4 gap-2">
                    ${secondRow.map(student => studentCardHtml(student)).join('')}
                </div>
                ` : ''}
            </div>
        </div>
    ${group.backgroundImage ? '</div>' : ''}
    </div>
    `});

    // 添加空白占位组
    const totalSlots = 8;
    const emptySlots = Array(totalSlots - groups.length).fill(`
        <div class="border rounded-lg p-4 shadow-md border-dashed border-gray-300 flex items-center justify-center">
            <span class="text-gray-400">空组位置</span>
        </div>
    `);

    container.innerHTML = [...groupsHtml, ...emptySlots].join('');

    if (groups.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 mt-8 col-span-2 row-span-4">
                暂无小组数据。点击"创建小组"按钮添加小组。
            </div>
        `;
    }
}

function renderScoreRecords() {
    const { scoreRecords, groups } = appState;
    const recordsList = document.getElementById('recordsList');
    
    if (scoreRecords.length === 0) {
        recordsList.innerHTML = '<div class="text-center text-gray-500 py-4">暂无积分记录</div>';
        return;
    }

    recordsList.innerHTML = scoreRecords.map(record => {
        // 判断是否是小组对决记录
        const isBattleRecord = record.type === 'battle';
        // 获取学生或小组名称显示
        let nameDisplay = '';
        
        if (isBattleRecord) {
            // 对于小组对决记录，直接显示描述文本（已包含小组名称）
            nameDisplay = `<strong>${record.description}</strong>`;
        } else {
            // 对于普通学生加减分记录，显示学生名称
            nameDisplay = `<strong>${getStudentName(record.studentId)}</strong>
                <span class="${record.score >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${record.score >= 0 ? ' +' : ' '}${record.score}分
                </span>`;
        }
        
        return `
        <div class="border rounded p-3 ${isBattleRecord ? 'bg-blue-50' : ''}">
            <div class="flex justify-between text-sm text-gray-500">
                <span>${new Date(record.timestamp).toLocaleString('zh-CN')}</span>
                ${isBattleRecord ? `
                <span class="${record.score >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${record.score >= 0 ? ' +' : ' '}${record.score}分
                </span>` : ''}
            </div>
            <div class="mt-1">
                ${nameDisplay}
            </div>
            ${!isBattleRecord && record.affectedStudents.length > 0 ? `
            <div class="mt-2 text-sm text-gray-600">
                影响的其他成员：
                <ul class="list-disc list-inside">
                    ${record.affectedStudents
                        .filter(as => as.studentId !== record.studentId)
                        .map(as => `
                            <li>
                                ${getStudentName(as.studentId)}:
                                <span class="${as.scoreChange >= 0 ? 'text-green-600' : 'text-red-600'}">
                                    ${as.scoreChange >= 0 ? ' +' : ' '}${as.scoreChange}分
                                </span>
                            </li>
                        `).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    `}).join('');
}

function renderExchangeRecords() {
    const { exchangeRecords, groups } = appState;
    const recordsList = document.getElementById('recordsList');
    
    if (exchangeRecords.length === 0) {
        recordsList.innerHTML = '<div class="text-center text-gray-500 py-4">暂无兑换记录</div>';
        return;
    }

    recordsList.innerHTML = exchangeRecords.map(record => `
        <div class="border rounded p-3 ${record.item ? 'bg-amber-50' : ''}">
            <div class="flex justify-between text-sm text-gray-500">
                <span>${new Date(record.timestamp).toLocaleString('zh-CN')}</span>
                <span class="text-red-600">-${record.points}分</span>
            </div>
            <div class="mt-1 flex justify-between items-center">
                <strong>${getGroupName(record.groupId)}</strong>
                ${record.item ? `
                    <span class="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                        商品兑换
                    </span>
                ` : ''}
            </div>
            <div class="mt-1 text-sm text-gray-600">
                ${record.item ? `
                    <div class="flex items-center">
                        <svg class="w-4 h-4 text-amber-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
                        </svg>
                        <span class="font-medium">${record.item}</span>
                    </div>
                ` : record.description}
            </div>
        </div>
    `).join('');
}

function getStudentName(studentId) {
    const student = appState.groups
        .flatMap(g => g.students)
        .find(s => s.id === studentId);
    return student?.name || '未知学生';
}

function getGroupName(groupId) {
    const group = appState.groups.find(g => g.id === groupId);
    return group?.name || '未知小组';
}

function confirmReset() {
    // 创建自定义确认对话框
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full m-auto">
            <h2 class="text-xl font-bold mb-4 text-red-600">重置数据确认</h2>
            <div class="mb-4">
                <p class="text-gray-700 mb-4">此操作将删除所有小组、学生和积分记录。此操作不可撤销。</p>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">管理密码</label>
                    <input
                        type="password"
                        id="resetPassword"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="请输入管理密码"
                    >
                </div>
            </div>
            <div class="flex justify-end gap-2">
                <button type="button" onclick="this.closest('.modal').remove()" class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                    取消
                </button>
                <button type="button" onclick="verifyResetPassword(this)" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                    确认重置
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function verifyResetPassword(button) {
    const modal = button.closest('.modal');
    const password = modal.querySelector('#resetPassword').value;
    
    if (password === '0605') {
        resetData();
        modal.remove();
    } else {
        alert('密码错误！');
    }
}

function showStudentMenu(event, studentId, groupId) {
    event.preventDefault();
    event.stopPropagation();

    // 移除任何已存在的菜单
    const existingMenu = document.querySelector('.student-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    const student = appState.groups
        .flatMap(g => g.students)
        .find(s => s.id === studentId);

    const menu = document.createElement('div');
    menu.className = 'student-menu fixed bg-white rounded-lg shadow-lg z-50 py-2';

    // 根据事件类型设置菜单位置
    if (event.type === 'touchstart' || event.type === 'touchend') {
        // 处理触摸事件
        const touch = event.touches && event.touches[0] ? 
                      event.touches[0] : 
                      (event.changedTouches && event.changedTouches[0] ? 
                      event.changedTouches[0] : null);
                      
        if (touch) {
            // 确保菜单不会超出屏幕边缘
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const menuWidth = 160; // 估计的菜单宽度
            const menuHeight = 120; // 估计的菜单高度
            
            let left = touch.clientX;
            let top = touch.clientY;
            
            // 如果菜单会超出右边缘，向左调整
            if (left + menuWidth > screenWidth) {
                left = screenWidth - menuWidth - 10;
            }
            
            // 如果菜单会超出底部边缘，向上调整
            if (top + menuHeight > screenHeight) {
                top = screenHeight - menuHeight - 10;
            }
            
            menu.style.left = `${left}px`;
            menu.style.top = `${top}px`;
        }
    } else {
        // 处理鼠标事件
        const rect = event.target.getBoundingClientRect();
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
    }

    // 添加菜单项，使用更大的点击区域
    menu.innerHTML = `
        <button onclick="handleScoreChange('${studentId}', 1)" class="w-full text-left px-4 py-3 hover:bg-gray-100 min-h-[44px]">
            <div class="flex items-center">
                <span class="text-green-600 mr-2">+</span>
                加分 (+1)
            </div>
        </button>
        <button onclick="handleScoreChange('${studentId}', -1)" class="w-full text-left px-4 py-3 hover:bg-gray-100 min-h-[44px]">
            <div class="flex items-center">
                <span class="text-red-600 mr-2">−</span>
                减分 (-1)
            </div>
        </button>
    `;

    document.body.appendChild(menu);

    // 点击或触摸其他地方关闭菜单
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
            document.removeEventListener('touchstart', closeMenu);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
        document.addEventListener('touchstart', closeMenu);
    }, 0);
}

function handleGroupExchange(groupId) {
    try {
        if (groupId) {
            console.log('打开积分兑换商城，组ID:', groupId);
            showShopModal(groupId);
        } else {
            console.log('打开商品管理界面');
            showShopAdmin();
        }
    } catch (error) {
        console.error('处理组兑换操作时出错:', error);
        alert('操作失败: ' + error.message);
    }
}

// 旧的兑换处理函数，保留以供参考
function handleGroupExchangeOld(groupId) {
    // ... existing code ...
}

// 修改Excel导入处理函数
async function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('请选择文件！');
        return;
    }

    // 检查文件类型
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        alert('请选择正确的Excel文件（.xlsx或.xls格式）！');
        return;
    }

    try {
        console.log('开始导入文件:', file.name);
        const response = await readExcelFile(file);
        
        if (!response || !response.length) {
            alert('Excel文件为空或格式不正确！');
            return;
        }

        console.log('Excel数据读取成功，开始处理数据...');
        const groups = [];
        const maxGroups = 8; // 最大组数限制
        
        // 每两行处理一个小组
        for (let i = 0; i < response.length && groups.length < maxGroups; i += 2) {
            const firstRow = response[i];
            const secondRow = response[i + 1];
            
            // 确保有第一行数据和组名
            if (!firstRow || !firstRow[0] || !firstRow[0].trim()) {
                continue;
            }

            // 获取组名和学生数据
            const groupName = firstRow[0].trim();
            const firstRowStudents = [];
            const secondRowStudents = [];

            // 获取第一行的学生（最多4个）
            for (let j = 1; j <= 4; j++) {
                if (firstRow[j] && firstRow[j].trim()) {
                    firstRowStudents.push({
                        name: firstRow[j].trim(),
                        mentorName: ''
                    });
                }
            }

            // 获取第二行的学生（最多3个）
            if (secondRow) {
                for (let j = 1; j <= 3; j++) {
                    if (secondRow[j] && secondRow[j].trim()) {
                        secondRowStudents.push({
                            name: secondRow[j].trim(),
                            mentorName: ''
                        });
                    }
                }
            }

            // 合并学生列表
            const students = [...firstRowStudents, ...secondRowStudents];

            // 如果有学生数据，创建小组
            if (students.length > 0) {
                try {
                    const newGroup = createNewGroup(groupName, students);
                    groups.push(newGroup);
                } catch (error) {
                    console.error('创建小组失败:', error);
                    continue;
                }
            }
        }

        // 检查现有组数和新增组数的总和是否超过限制
        const totalGroups = appState.groups.length + groups.length;
        if (totalGroups > maxGroups) {
            alert(`导入失败：总组数（${totalGroups}）超过最大限制（${maxGroups}）！`);
            return;
        }

        // 更新应用状态
        if (groups.length > 0) {
            const updatedGroups = [...appState.groups];
            groups.forEach(group => {
                // 检查是否已存在同名组
                const existingGroupIndex = updatedGroups.findIndex(g => g.name === group.name);
                if (existingGroupIndex !== -1) {
                    // 更新现有组
                    updatedGroups[existingGroupIndex] = group;
                } else {
                    // 添加新组
                    updatedGroups.push(group);
                }
            });

            appState = {
                ...appState,
                groups: updatedGroups
            };
            saveData(appState);
            renderGroups(appState.groups);
            hideGroupForm();
            alert(`成功导入 ${groups.length} 个小组！`);
        } else {
            alert('未找到有效的小组数据！');
        }

        event.target.value = ''; // 清空文件输入
    } catch (error) {
        console.error('导入Excel出错：', error);
        alert('导入Excel文件失败：' + error.message);
    }
}

// 添加创建新小组的辅助函数
function createNewGroup(groupName, students) {
    const groupId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const studentsWithIds = students.map((student, index) => ({
        id: `student${groupId}_${index}`,
        name: student.name,
        mentorName: student.mentorName,
        mentorId: null
    }));

    // 设置师徒关系
    // 判断是七人组还是六人组
    const isSevenPersonGroup = students.length >= 7;
    
    // 根据组类型确定第一行的人数
    const firstRowCount = isSevenPersonGroup ? 4 : 3;
    const firstRow = studentsWithIds.slice(0, firstRowCount);
    const secondRow = studentsWithIds.slice(firstRowCount);

    // 设置第一行的师徒关系
    for (let i = 0; i < firstRow.length - 1; i++) {
        firstRow[i + 1].mentorName = firstRow[i].name;
    }

    // 设置第二行的师徒关系
    if (secondRow.length > 0) {
        secondRow[0].mentorName = firstRow[0].name; // 第二行第一个人的师傅是第一行第一个人
        for (let i = 0; i < secondRow.length - 1; i++) {
            secondRow[i + 1].mentorName = secondRow[i].name;
        }
    }

    // 设置mentorId
    studentsWithIds.forEach(student => {
        if (student.mentorName) {
            const mentor = studentsWithIds.find(s => s.name === student.mentorName);
            if (mentor) {
                student.mentorId = mentor.id;
            }
        }
    });

    return {
        id: groupId,
        name: groupName,
        avatar: '',
        backgroundImage: '',
        totalScore: 0,
        remainingScore: 0,
        students: studentsWithIds.map(student => ({
            id: student.id,
            name: student.name,
            score: 0,
            mentorId: student.mentorId,
            groupId: groupId,
            level: calculateLevel(student, studentsWithIds)
        }))
    };
}

// 修改表单提交处理
document.getElementById('groupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const editMode = document.getElementById('editMode').value === 'true';
    const groupId = document.getElementById('groupId').value;
    const name = document.getElementById('groupName').value;
    const avatarImg = document.getElementById('groupAvatar');
    const avatar = avatarImg.classList.contains('hidden') ? '' : avatarImg.src;
    const backgroundImg = document.getElementById('groupBackground');
    const backgroundImage = backgroundImg.classList.contains('hidden') ? '' : backgroundImg.src;
    
    // 调试信息，确认背景图片数据
    console.log('保存表单数据:', { name, avatar, backgroundImage });

    if (!name) {
        alert('请填写小组名称！');
        return;
    }

    if (editMode) {
        // 编辑模式
        const totalScore = parseFloat(document.getElementById('totalScore').value) || 0;
        const remainingScore = parseFloat(document.getElementById('remainingScore').value) || 0;

        const updatedGroups = appState.groups.map(g => 
            g.id === groupId ? {
                ...g,
                name,
                avatar,
                backgroundImage,
                totalScore,
                remainingScore
            } : g
        );

        appState = {
            ...appState,
            groups: updatedGroups
        };
    } else {
        // 创建模式
        const studentsList = document.getElementById('studentsList');
        const startIndex = appState.groups.flatMap(g => g.students).length + 1;

        // 解析师徒关系
        parseStudentRelationships();

        const studentsWithIds = Array.from(studentsList.children).map((div, index) => {
            const nameInput = div.querySelector(`[name="student_name_${index}"]`);
            const mentorSelect = div.querySelector(`[name="student_mentor_${index}"]`);
            return {
                id: `student${startIndex + index}`,
                name: nameInput.value,
                mentorName: mentorSelect.value,
                mentorId: null
            };
        }).filter(student => student.name.trim());

        if (studentsWithIds.length === 0) {
            alert('请至少添加一名学生！');
            return;
        }

        // 设置师徒关系的ID
        studentsWithIds.forEach(student => {
            if (student.mentorName) {
                const mentor = studentsWithIds.find(s => s.name === student.mentorName);
                if (mentor) {
                    student.mentorId = mentor.id;
                }
            }
        });

        const newGroupId = Date.now().toString();
        const newGroup = {
            id: newGroupId,
            name,
            avatar,
            backgroundImage,
            totalScore: 0,
            remainingScore: 0,
            students: studentsWithIds.map(student => ({
                id: student.id,
                name: student.name,
                score: 0,
                mentorId: student.mentorId,
                groupId: newGroupId,
                level: calculateLevel(student, studentsWithIds)
            }))
        };

        appState = {
            ...appState,
            groups: [...appState.groups, newGroup]
        };
    }

    saveData(appState);
    renderGroups(appState.groups);
    hideGroupForm();
});

// 修改计算师徒层级的函数
function calculateLevel(student, students) {
    let level = 0;
    let currentStudent = student;
    
    while (currentStudent && currentStudent.mentorId) {
        level++;
        currentStudent = students.find(s => s.id === currentStudent.mentorId);
    }
    
    return level;
}

// 添加头像处理函数
function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件！');
        return;
    }

    // 检查文件大小（限制为2MB）
    if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过2MB！');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.getElementById('groupAvatar');
        const placeholder = document.getElementById('avatarPlaceholder');
        img.src = e.target.result;
        img.classList.remove('hidden');
        placeholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

// 添加清除头像函数
function clearAvatar() {
    const img = document.getElementById('groupAvatar');
    const placeholder = document.getElementById('avatarPlaceholder');
    img.src = '';
    img.classList.add('hidden');
    placeholder.classList.remove('hidden');
}

// 添加背景图片处理函数
function handleBackgroundChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件！');
        return;
    }

    // 检查文件大小（限制为30MB）
    if (file.size > 30 * 1024 * 1024) {
        alert('图片大小不能超过30MB！请选择更小的图片或压缩后再上传。');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        // 压缩图片
        const img = new Image();
        img.onload = function() {
            // 创建canvas进行压缩
            const canvas = document.createElement('canvas');
            // 计算压缩后的尺寸，最大宽度为800px
            const maxWidth = 800;
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // 绘制并压缩图片
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // 转换为base64，使用较低质量
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            // 更新UI
            const backgroundImg = document.getElementById('groupBackground');
            const placeholder = document.getElementById('backgroundPlaceholder');
            backgroundImg.src = compressedDataUrl;
            backgroundImg.classList.remove('hidden');
            placeholder.classList.add('hidden');
            
            console.log('图片已压缩，原始大小：', file.size, '压缩后大小约：', compressedDataUrl.length * 0.75);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 添加清除背景图片函数
function clearBackground() {
    const img = document.getElementById('groupBackground');
    const placeholder = document.getElementById('backgroundPlaceholder');
    img.src = '';
    img.classList.add('hidden');
    placeholder.classList.remove('hidden');
}

// 渲染看板区域
function renderDashboard(groups, scoreRecords) {
    renderRankingBoard(groups);
    renderScoreChart(groups, scoreRecords);
    renderTotalScoreBoard(groups);
}

// 渲染实时排名
function renderRankingBoard(groups) {
    const rankingBoard = document.getElementById('rankingBoard');
    if (!rankingBoard) return;
    
    // 按总积分排序
    const sortedGroups = [...groups].sort((a, b) => b.totalScore - a.totalScore);
    
    rankingBoard.innerHTML = sortedGroups.map((group, index) => {
        const rankStyle = getRankStyle(index + 1);
        return `
        <div class="flex items-center p-2 border rounded-lg mb-2 hover:bg-gray-50">
            <div class="w-8 h-8 flex items-center justify-center rounded-full ${rankStyle.badge} mr-3">
                ${index + 1}
            </div>
            <div class="flex-1">
                <div class="font-medium">${group.name}</div>
            </div>
            <div class="font-bold text-lg ${group.totalScore >= 0 ? 'text-green-600' : 'text-red-600'}">
                ${group.totalScore.toFixed(2)}
            </div>
        </div>
        `;
    }).join('');
}

// 渲染积分变化曲线
function renderScoreChart(groups, scoreRecords) {
    const chartCanvas = document.getElementById('scoreChart');
    if (!chartCanvas) return;
    
    // 检查 Chart.js 是否已加载
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js 未加载，无法显示积分曲线');
        const ctx = chartCanvas.getContext('2d');
        ctx.font = '14px Arial';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('图表库加载中...', chartCanvas.width / 2, chartCanvas.height / 2);
        return;
    }
    
    // 如果已经有图表实例，销毁它
    if (window.scoreChartInstance) {
        window.scoreChartInstance.destroy();
    }
    
    // 如果没有足够的记录，显示提示信息
    if (scoreRecords.length < 2) {
        const ctx = chartCanvas.getContext('2d');
        ctx.font = '14px Arial';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('需要至少两条积分记录才能生成图表', chartCanvas.width / 2, chartCanvas.height / 2);
        return;
    }
    
    // 准备数据
    const timestamps = [];
    const datasets = [];
    
    // 固定的时间段数量
    const NUM_TIME_SEGMENTS = 10;
    
    // 按时间排序所有记录（从早到晚）
    const sortedRecords = [...scoreRecords].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // 获取最早和最晚的时间戳
    const earliestTime = new Date(sortedRecords[0].timestamp).getTime();
    const latestTime = new Date(sortedRecords[sortedRecords.length - 1].timestamp).getTime();
    const timeRange = latestTime - earliestTime;
    
    // 创建时间段
    const timeSegments = [];
    for (let i = 0; i <= NUM_TIME_SEGMENTS; i++) {
        const segmentTime = earliestTime + (timeRange * i / NUM_TIME_SEGMENTS);
        timeSegments.push(segmentTime);
        
        // 格式化时间标签
        const date = new Date(segmentTime);
        timestamps.push(date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    }
    
    // 为每个小组创建一个数据集
    groups.forEach((group, index) => {
        const data = [];
        
        // 计算每个时间段的积分
        for (let i = 0; i <= NUM_TIME_SEGMENTS; i++) {
            const segmentTime = timeSegments[i];
            let totalScore = 0;
            
            // 找出该时间段之前的所有记录
            const recordsBeforeSegment = sortedRecords.filter(record => 
                new Date(record.timestamp).getTime() <= segmentTime
            );
            
            // 计算这些记录对当前小组的总影响
            recordsBeforeSegment.forEach(record => {
                // 处理小组对决记录
                if (record.type === 'battle') {
                    // 如果是针对当前小组的对决记录
                    if (record.description.includes(group.name)) {
                        totalScore += record.score;
                    }
                } else {
                    // 处理普通学生加减分记录
                    const groupImpact = record.affectedStudents
                        .filter(affected => {
                            // 检查这个学生是否属于当前小组
                            const student = group.students.find(s => s.id === affected.studentId);
                            return student !== undefined;
                        })
                        .reduce((sum, affected) => sum + affected.scoreChange, 0);
                    
                    totalScore += groupImpact;
                }
            });
            
            data.push(totalScore);
        }
        
        // 为每个小组选择不同的颜色
        const colors = [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)'
        ];
        
        datasets.push({
            label: group.name,
            data: data,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length].replace('1)', '0.2)'),
            borderWidth: 2,
            tension: 0.3
        });
    });
    
    // 创建图表
    window.scoreChartInstance = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// 渲染总积分统计
function renderTotalScoreBoard(groups) {
    const totalScoreBoard = document.getElementById('totalScoreBoard');
    if (!totalScoreBoard) return;
    
    // 计算所有小组的总积分和剩余积分
    const totalHistoryScore = groups.reduce((sum, group) => sum + group.totalScore, 0);
    const totalRemainingScore = groups.reduce((sum, group) => sum + group.remainingScore, 0);
    const totalExchangedScore = totalHistoryScore - totalRemainingScore;
    
    // 创建统计卡片
    totalScoreBoard.innerHTML = `
        <div class="bg-blue-50 p-4 rounded-lg shadow-sm">
            <div class="text-blue-800 font-medium mb-1">历史总积分</div>
            <div class="text-2xl font-bold text-blue-600">${totalHistoryScore.toFixed(2)}</div>
        </div>
        <div class="bg-green-50 p-4 rounded-lg shadow-sm">
            <div class="text-green-800 font-medium mb-1">剩余总积分</div>
            <div class="text-2xl font-bold text-green-600">${totalRemainingScore.toFixed(2)}</div>
        </div>
        <div class="bg-orange-50 p-4 rounded-lg shadow-sm">
            <div class="text-orange-800 font-medium mb-1">已兑换总积分</div>
            <div class="text-2xl font-bold text-orange-600">${totalExchangedScore.toFixed(2)}</div>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg shadow-sm">
            <div class="text-purple-800 font-medium mb-1">小组平均积分</div>
            <div class="text-2xl font-bold text-purple-600">${(totalHistoryScore / (groups.length || 1)).toFixed(2)}</div>
        </div>
    `;
}

function toggleRandomMenu() {
    const menu = document.getElementById('randomMenu');
    menu.classList.toggle('hidden');

    // 点击其他地方关闭菜单
    const closeMenu = (e) => {
        if (!menu.contains(e.target) && e.target.id !== 'randomMenu') {
            menu.classList.add('hidden');
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

function showRandomDrawModal(type) {
    const modal = document.getElementById('randomDrawModal');
    const title = document.getElementById('randomDrawTitle');
    const groupSelectContainer = document.getElementById('groupSelectContainer');
    const drawResult = document.getElementById('drawResult');
    const drawResultContent = document.getElementById('drawResultContent');
    const probabilitiesBtn = document.getElementById('showProbabilitiesBtn');

    // 重置状态
    modal.classList.add('show');
    drawResult.classList.add('hidden');
    drawResultContent.textContent = '';
    document.getElementById('drawCount').value = '1';
    
    // 初始化组别选择框
    document.getElementById('selectAllGroups').checked = true;
    document.getElementById('selectGroupA').checked = true;
    document.getElementById('selectGroupB').checked = true;
    document.getElementById('selectGroupC').checked = true;

    // 设置标题和显示列选择
    if (type === 'group') {
        title.textContent = '随机抽取小组';
        groupSelectContainer.classList.add('hidden');
        
        // 只有抽取小组时才显示概率按钮
        probabilitiesBtn.classList.remove('hidden');
        
        // 监听抽取数量变化，只有数量为1时才显示概率按钮
        const drawCount = document.getElementById('drawCount');
        const updateProbabilityBtn = () => {
            if (parseInt(drawCount.value) === 1) {
                probabilitiesBtn.classList.remove('hidden');
            } else {
                probabilitiesBtn.classList.add('hidden');
            }
        };
        
        // 立即执行一次检查
        updateProbabilityBtn();
        
        // 添加事件监听
        drawCount.addEventListener('input', updateProbabilityBtn);
    } else {
        title.textContent = '随机抽取学生';
        groupSelectContainer.classList.remove('hidden');
        probabilitiesBtn.classList.add('hidden');
    }

    // 关闭下拉菜单
    document.getElementById('randomMenu').classList.add('hidden');
}

function hideRandomDrawModal() {
    const modal = document.getElementById('randomDrawModal');
    modal.classList.remove('show');
}

function performRandomDraw() {
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
        // 保存原始组数，确保可以抽取指定数量
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
            
            // 更新权重：被选中的重置为100，未选中的增加50%
            console.log('抽取前的权重:', JSON.parse(JSON.stringify(appState.groupWeights)));
            console.log('被选中的小组ID:', selectedGroup.id);
            
            Object.keys(appState.groupWeights).forEach(groupId => {
                if (groupId === selectedGroup.id) {
                    appState.groupWeights[groupId] = 100; // 重置为基础权重
                } else {
                    appState.groupWeights[groupId] = Math.round(appState.groupWeights[groupId] * 1.5); // 增加50%
                }
            });
            
            // 保存权重到本地存储
            console.log('抽取后更新的权重:', JSON.parse(JSON.stringify(appState.groupWeights)));
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
        
        const allPossibleResults = result.map(group => group.name);
        
        // 只有抽取1个小组时才显示动画
        if (count === 1 && actualCount === 1) {
            // 传递所有可能的小组名称作为候选项
            const allGroupNames = appState.groups.map(group => group.name);
            showDrawAnimation(result.map(group => group.name), () => {
                showDrawResult(result.map(group => group.name));
            }, allGroupNames);
        } else {
            showDrawResult(result.map(group => group.name));
        }
    } else {
        // 随机抽取同列学生
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
        
        // 只有抽取1个学生时才显示动画
        if (count === 1 && actualCount === 1) {
            // 传递所有可能的学生名称作为候选项
            const allStudentNames = eligibleStudents.map(student => `${student.name}（${student.groupName}）`);
            showDrawAnimation(result.map(student => `${student.name}（${student.groupName}）`), () => {
                showDrawResult(result.map(student => `${student.name}（${student.groupName}）`));
            }, allStudentNames);
        } else {
            showDrawResult(result.map(student => `${student.name}（${student.groupName}）`));
        }
    }
}

function showDrawResult(items) {
    const drawResult = document.getElementById('drawResult');
    const drawResultContent = document.getElementById('drawResultContent');
    
    drawResultContent.innerHTML = items.map((item, index) => 
        `<div class="py-1">${index + 1}. ${item}</div>`
    ).join('');
    
    drawResult.classList.remove('hidden');
}

// 添加复选框事件处理
function setupGroupCheckboxes() {
    const selectAllGroups = document.getElementById('selectAllGroups');
    const selectGroupA = document.getElementById('selectGroupA');
    const selectGroupB = document.getElementById('selectGroupB');
    const selectGroupC = document.getElementById('selectGroupC');
    
    // 全选按钮事件
    selectAllGroups.addEventListener('change', function() {
        const checked = this.checked;
        selectGroupA.checked = checked;
        selectGroupB.checked = checked;
        selectGroupC.checked = checked;
    });
    
    // 各组选择按钮事件
    [selectGroupA, selectGroupB, selectGroupC].forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // 如果所有组都被选中，则全选按钮也选中
            selectAllGroups.checked = selectGroupA.checked && selectGroupB.checked && selectGroupC.checked;
        });
    });
}

// 页面加载完成后初始化复选框事件
document.addEventListener('DOMContentLoaded', function() {
    setupGroupCheckboxes();
});

// 显示数据管理界面
function showDataManagement() {
    const modal = document.getElementById('dataManagementModal');
    modal.classList.add('show');
    
    // 重置文件输入框
    document.getElementById('jsonFileInput').value = '';
    document.getElementById('excelFileInput').value = '';
    document.getElementById('importDataBtn').disabled = true;
}

// 隐藏数据管理界面
function hideDataManagement() {
    const modal = document.getElementById('dataManagementModal');
    modal.classList.remove('show');
}

// 设置文件选择和导入按钮的事件监听
document.addEventListener('DOMContentLoaded', function() {
    // 文件输入框变更事件
    const jsonFileInput = document.getElementById('jsonFileInput');
    const excelFileInput = document.getElementById('excelFileInput');
    const importDataBtn = document.getElementById('importDataBtn');
    
    // 监听JSON文件选择
    jsonFileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            excelFileInput.value = ''; // 清除Excel文件选择
            importDataBtn.disabled = false;
        } else {
            if (!excelFileInput.files.length) {
                importDataBtn.disabled = true;
            }
        }
    });
    
    // 监听Excel文件选择
    excelFileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            jsonFileInput.value = ''; // 清除JSON文件选择
            importDataBtn.disabled = false;
        } else {
            if (!jsonFileInput.files.length) {
                importDataBtn.disabled = true;
            }
        }
    });
    
    // 导入按钮点击事件
    importDataBtn.addEventListener('click', async function() {
        // 检查是否有JSON文件
        if (jsonFileInput.files.length > 0) {
            try {
                const file = jsonFileInput.files[0];
                const data = await importData(file);
                alert('JSON数据导入成功！');
                location.reload(); // 刷新页面以加载新数据
            } catch (error) {
                alert('导入失败: ' + error.message);
            }
        }
        // 检查是否有Excel文件
        else if (excelFileInput.files.length > 0) {
            try {
                const file = excelFileInput.files[0];
                const data = await importFromExcel(file);
                alert('Excel数据导入成功！');
                location.reload(); // 刷新页面以加载新数据
            } catch (error) {
                alert('导入失败: ' + error.message);
            }
        }
    });
    
    // 添加数据管理按钮到主操作区
    const operationsContainer = document.querySelector('.mt-8.pb-4.flex.justify-center.space-x-4');
    if (operationsContainer) {
        const dataManagementButton = document.createElement('button');
        dataManagementButton.className = 'bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600';
        dataManagementButton.textContent = '数据管理';
        dataManagementButton.onclick = showDataManagement;
        operationsContainer.appendChild(dataManagementButton);
    }
});

// 显示小组抽取概率弹窗
function showDrawProbabilities() {
    // 检查本地存储中的权重数据
    console.log('显示概率前检查存储的权重数据:');
    const storedWeights = checkStoredWeights();
    
    // 确保有小组权重数据
    if (!appState.groupWeights) {
        console.log('appState 中没有 groupWeights，正在初始化');
        appState.groupWeights = {};
        appState.groups.forEach(group => {
            appState.groupWeights[group.id] = 100; // 初始权重为100
        });
        saveData(appState);
    } else {
        console.log('appState 中存在 groupWeights:', appState.groupWeights);
    }
    
    // 创建弹窗元素
    let modal = document.getElementById('probabilitiesModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'probabilitiesModal';
        modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-800">小组抽取概率</h3>
                    <button id="closeProbabilitiesBtn" class="text-gray-500 hover:text-gray-800">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div id="probabilitiesContent" class="max-h-96 overflow-y-auto"></div>
                <div class="mt-6 text-right">
                    <button id="resetWeightsBtn" class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2">
                        重置权重
                    </button>
                    <button id="closeProbabilitiesModalBtn" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        关闭
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 绑定关闭按钮事件
        document.getElementById('closeProbabilitiesBtn').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        document.getElementById('closeProbabilitiesModalBtn').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        // 绑定重置权重按钮事件
        document.getElementById('resetWeightsBtn').addEventListener('click', () => {
            appState.groupWeights = {};
            appState.groups.forEach(group => {
                appState.groupWeights[group.id] = 100; // 重置为初始权重
            });
            saveData(appState);
            updateProbabilitiesDisplay(); // 更新显示
        });
    } else {
        modal.classList.remove('hidden');
    }
    
    // 更新概率显示
    updateProbabilitiesDisplay();
}

// 更新概率显示
function updateProbabilitiesDisplay() {
    const probabilitiesContent = document.getElementById('probabilitiesContent');
    if (!probabilitiesContent) return;
    
    // 计算总权重
    let totalWeight = 0;
    appState.groups.forEach(group => {
        totalWeight += (appState.groupWeights[group.id] || 100);
    });
    
    // 生成概率内容
    let html = '<div class="space-y-2">';
    
    // 按概率从高到低排序组
    const groupsWithProbability = appState.groups.map(group => {
        const weight = appState.groupWeights[group.id] || 100;
        const probability = (weight / totalWeight * 100).toFixed(2);
        return {
            id: group.id,
            name: group.name,
            weight,
            probability
        };
    }).sort((a, b) => b.probability - a.probability);
    
    // 显示每个组的概率
    groupsWithProbability.forEach(item => {
        const widthPercentage = Math.min(100, Math.max(10, parseFloat(item.probability))); // 确保进度条宽度在10-100%之间
        html += `
            <div class="bg-gray-50 p-3 rounded-lg">
                <div class="flex justify-between mb-1">
                    <span class="font-medium">${item.name}</span>
                    <span class="text-blue-600 font-bold">${item.probability}%</span>
                </div>
                <div class="relative">
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${widthPercentage}%"></div>
                    </div>
                    <div class="mt-1 text-xs text-gray-500">权重: ${item.weight}</div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    probabilitiesContent.innerHTML = html;
}

// 检查 localStorage 中的权重数据
function checkStoredWeights() {
    try {
        const stored = localStorage.getItem('class-score-system');
        if (stored) {
            const data = JSON.parse(stored);
            console.log('localStorage 中的数据是否包含 groupWeights:', data.hasOwnProperty('groupWeights'));
            console.log('localStorage 中的 groupWeights 数据:', data.groupWeights);
            return data.groupWeights;
        } else {
            console.log('localStorage 中没有找到数据');
            return null;
        }
    } catch (error) {
        console.error('检查存储的权重数据时出错:', error);
        return null;
    }
}

// 添加一个全局函数用于直接测试权重更新
window.testWeightUpdate = function(groupId) {
    if (!appState.groupWeights) {
        appState.groupWeights = {};
        appState.groups.forEach(group => {
            appState.groupWeights[group.id] = 100;
        });
    }
    
    console.log('更新前的权重:', JSON.parse(JSON.stringify(appState.groupWeights)));
    
    // 更新权重
    Object.keys(appState.groupWeights).forEach(id => {
        if (id === groupId) {
            appState.groupWeights[id] = 100; // 重置
        } else {
            appState.groupWeights[id] = Math.round(appState.groupWeights[id] * 1.5); // 增加50%
        }
    });
    
    console.log('更新后的权重:', JSON.parse(JSON.stringify(appState.groupWeights)));
    
    // 保存到本地存储
    saveData(appState);
    
    // 重新加载以验证保存是否成功
    setTimeout(() => {
        console.log('从 localStorage 加载的权重:', checkStoredWeights());
    }, 100);
    
    return appState.groupWeights;
};