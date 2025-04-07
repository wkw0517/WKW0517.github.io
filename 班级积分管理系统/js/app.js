// 初始数据
const initialData = {
    groups: [
        {
            id: '1',
            name: '第一组',
            totalScore: 0,
            remainingScore: 0,
            students: [
                {
                    id: 'student1',
                    name: '张三',
                    score: 0,
                    mentorId: null,
                    groupId: '1',
                    level: 0
                },
                {
                    id: 'student2',
                    name: '李四',
                    score: 0,
                    mentorId: 'student1',
                    groupId: '1',
                    level: 1
                },
                {
                    id: 'student3',
                    name: '王五',
                    score: 0,
                    mentorId: 'student2',
                    groupId: '1',
                    level: 2
                }
            ]
        },
        {
            id: '2',
            name: '第二组',
            totalScore: 0,
            remainingScore: 0,
            students: [
                {
                    id: 'student4',
                    name: '赵六',
                    score: 0,
                    mentorId: null,
                    groupId: '2',
                    level: 0
                },
                {
                    id: 'student5',
                    name: '钱七',
                    score: 0,
                    mentorId: 'student4',
                    groupId: '2',
                    level: 1
                }
            ]
        }
    ],
    scoreRecords: [],
    exchangeRecords: []
};

// 全局状态
let appState = {
    groups: [],
    scoreRecords: [],
    exchangeRecords: [],
    selectedStudents: []
};

// 初始化应用
function initApp() {
    const savedData = loadData();
    if (savedData) {
        appState = savedData;
        console.log('加载保存的应用数据：', savedData);
        console.log('加载的 groupWeights 数据：', savedData.groupWeights);
    } else {
        appState = initialData;
        saveData(appState);
    }
    renderGroups(appState.groups);
    renderDashboard(appState.groups, appState.scoreRecords); // 添加这行，初始化时更新看板
}

// 处理学生积分变更
function handleScoreChange(studentId, score) {
    const affectedStudents = [];
    
    // 先找到当前学生和他的师徒关系链
    const allStudents = appState.groups.flatMap(g => g.students);
    const student = allStudents.find(s => s.id === studentId);
    
    if (!student) return;
    
    // 添加当前学生的分数变化
    affectedStudents.push({
        studentId: student.id,
        scoreChange: score
    });
    
    // 查找并给师傅加分（第一级）
    if (student.mentorId) {
        const mentor = allStudents.find(s => s.id === student.mentorId);
        if (mentor) {
            const mentorScore = score * 0.5;
            affectedStudents.push({
                studentId: mentor.id,
                scoreChange: mentorScore
            });
            
            // 查找并给师傅的师傅加分（第二级）
            if (mentor.mentorId) {
                const grandMentor = allStudents.find(s => s.id === mentor.mentorId);
                if (grandMentor) {
                    const grandMentorScore = score * 0.25;
                    affectedStudents.push({
                        studentId: grandMentor.id,
                        scoreChange: grandMentorScore
                    });
                }
            }
        }
    }
    
    // 更新所有组的学生分数和组的总分
    const updatedGroups = appState.groups.map(group => {
        let groupScoreChange = 0;
        const updatedStudents = group.students.map(student => {
            const affected = affectedStudents.find(as => as.studentId === student.id);
            if (affected) {
                groupScoreChange += affected.scoreChange;
                return {
                    ...student,
                    score: student.score + affected.scoreChange
                };
            }
            return student;
        });
        
        // 如果这个组有受影响的学生，更新组的历史总分和剩余分
        if (groupScoreChange !== 0) {
            return {
                ...group,
                students: updatedStudents,
                totalScore: group.totalScore + groupScoreChange,
                remainingScore: group.remainingScore + groupScoreChange
            };
        }
        
        return group;
    });

    const newScoreRecord = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        studentId,
        score,
        affectedStudents
    };

    appState = {
        ...appState,
        groups: updatedGroups,
        scoreRecords: [newScoreRecord, ...appState.scoreRecords]
    };

    saveData(appState);
    renderGroups(appState.groups);
    renderDashboard(appState.groups, appState.scoreRecords); // 添加这行，确保积分变更后更新看板
    
    // 更新每周排名
    if (typeof updateWeeklyRankings === 'function') {
        updateWeeklyRankings();
    }
}

// 处理积分兑换
function handleExchange(groupId) {
    const input = document.getElementById(`exchange_${groupId}`);
    const points = Number(input.value);
    
    if (!points || points <= 0) {
        alert('请输入有效的兑换积分！');
        return;
    }

    const group = appState.groups.find(g => g.id === groupId);
    if (!group || points > group.remainingScore) {
        alert('兑换积分不能超过剩余积分！');
        return;
    }

    const newExchangeRecord = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        groupId,
        points,
        description: `${group.name}兑换了${points}积分`
    };

    const updatedGroups = appState.groups.map(g =>
        g.id === groupId
            ? { ...g, remainingScore: g.remainingScore - points }
            : g
    );

    appState = {
        ...appState,
        groups: updatedGroups,
        exchangeRecords: [...appState.exchangeRecords, newExchangeRecord]
    };

    saveData(appState);
    renderGroups(appState.groups);
    renderDashboard(appState.groups, appState.scoreRecords); // 添加这行，确保积分兑换后更新看板
    input.value = '';
    
    // 更新每周排名
    if (typeof updateWeeklyRankings === 'function') {
        updateWeeklyRankings();
    }
}

// 处理学生选择
function handleStudentSelect(studentId, checked) {
    if (checked) {
        appState.selectedStudents.push(studentId);
    } else {
        appState.selectedStudents = appState.selectedStudents.filter(id => id !== studentId);
    }
}

// 处理批量积分变更
function handleBatchScoreChange(score) {
    if (!appState.selectedStudents.length) {
        alert('请先选择学生！');
        return;
    }

    appState.selectedStudents.forEach(studentId => {
        handleScoreChange(studentId, score);
    });

    appState.selectedStudents = [];
    renderGroups(appState.groups);
}

// 处理创建小组表单提交
document.getElementById('groupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('groupName').value;
    const studentsList = document.getElementById('studentsList');
    const startIndex = appState.groups.flatMap(g => g.students).length + 1;

    // 首先创建学生数组，设置好ID
    const studentsWithIds = Array.from(studentsList.children).map((div, index) => {
        const nameInput = div.querySelector(`[name="student_name_${index}"]`);
        const mentorSelect = div.querySelector(`[name="student_mentor_${index}"]`);
        return {
            tempIndex: index,
            id: `student${startIndex + index}`,
            name: nameInput.value,
            mentorValue: mentorSelect.value,
            mentorId: null // 稍后设置
        };
    });

    // 然后设置师徒关系
    studentsWithIds.forEach(student => {
        if (student.mentorValue !== '') {
            const mentorIndex = parseInt(student.mentorValue);
            student.mentorId = studentsWithIds[mentorIndex].id;
        }
    });

    if (!name || studentsWithIds.length === 0) {
        alert('请填写完整的小组信息！');
        return;
    }

    const groupId = Date.now().toString();
    const newGroup = {
        id: groupId,
        name,
        totalScore: 0,
        remainingScore: 0,
        students: studentsWithIds.map(student => ({
            id: student.id,
            name: student.name,
            score: 0,
            mentorId: student.mentorId,
            groupId: groupId,
            level: calculateLevel(student.tempIndex, studentsWithIds)
        }))
    };

    appState = {
        ...appState,
        groups: [...appState.groups, newGroup]
    };

    saveData(appState);
    renderGroups(appState.groups);
    hideGroupForm();
});

// 处理重置数据
function resetData() {
    // 移除重复的确认对话框，因为UI中已经有确认步骤
    clearData();
    
    // 保存当前的 groupWeights 数据
    const currentGroupWeights = appState.groupWeights || {};
    
    appState = {
        groups: [],
        scoreRecords: [],
        exchangeRecords: [],
        selectedStudents: [],
        groupWeights: currentGroupWeights  // 保留权重数据
    };
    renderGroups(appState.groups);
    // 显示成功消息
    alert('所有数据已成功重置！');
}

// 计算师徒层级
function calculateLevel(index, students) {
    let level = 0;
    let currentStudent = students[index];
    
    while (currentStudent && currentStudent.mentorId) {
        level++;
        currentStudent = students.find(s => s.id === currentStudent.mentorId);
    }
    
    return level;
}

// 应用初始化
document.addEventListener('DOMContentLoaded', function() {
    // 从本地存储加载数据
    const savedData = loadData();
    if (savedData) {
        appState = savedData;
    }
    
    // 渲染小组列表
    renderGroups(appState.groups);
    
    // 初始化看板
    renderDashboard(appState.groups, appState.scoreRecords); // 添加这行，初始化时更新看板
    
    // 初始化每周排名
    if (typeof updateWeeklyRankings === 'function') {
        updateWeeklyRankings();
    }
    
    // 初始化小组对决系统
    if (typeof initBattleSystem === 'function') {
        initBattleSystem();
    }
});

// 更新整个应用的UI
function updateAppUI() {
    console.log("正在更新整个应用UI...");
    
    // 渲染小组列表和排名
    renderGroups(appState.groups);
    
    // 更新小组卡片显示
    if (appState.groups.length > 0) {
        const groupCardContainer = document.getElementById('groupCardContainer');
        if (groupCardContainer) {
            renderGroupCards();
        }
    }
    
    // 更新积分记录显示
    if (typeof renderScoreRecords === 'function') {
        renderScoreRecords();
    }
    
    // 更新仪表盘（包含积分曲线和总分排行榜）
    if (typeof renderDashboard === 'function') {
        renderDashboard(appState.groups, appState.scoreRecords);
    }
    
    // 更新每周排名
    if (typeof updateWeeklyRankings === 'function') {
        updateWeeklyRankings();
    }
    
    // 更新荣誉殿堂
    if (typeof updateHallOfFame === 'function') {
        updateHallOfFame();
    }
    
    // 触发自定义事件，通知应用状态已更新
    const updateEvent = new CustomEvent('appStateUpdated', { 
        detail: { source: 'app', timestamp: Date.now() } 
    });
    document.dispatchEvent(updateEvent);
}

// 将此函数暴露给全局作用域，使其他脚本可以调用
window.updateAppUI = updateAppUI;