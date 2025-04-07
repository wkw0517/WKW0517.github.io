// 周期相关功能 - 每周五晚12:00开始，7天一个周期

// 计算指定日期所属的周期
function getPeriodForDate(date) {
    const targetDate = new Date(date);
    
    // 查找最近的过去周五（当天周五也算）
    let periodStart = new Date(targetDate);
    while (periodStart.getDay() !== 5) { // 0 是周日，5 是周五
        periodStart.setDate(periodStart.getDate() - 1);
    }
    
    // 设置为周五晚上 12:00
    periodStart.setHours(0, 0, 0, 0);
    
    // 周期结束时间（7天后）
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 7);
    
    return {
        start: periodStart,
        end: periodEnd,
        id: `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}-${String(periodStart.getDate()).padStart(2, '0')}`
    };
}

// 获取当前周期
function getCurrentPeriod() {
    return getPeriodForDate(new Date());
}

// 获取所有历史周期
function getAllPeriods(scoreRecords) {
    if (!scoreRecords || !Array.isArray(scoreRecords) || scoreRecords.length === 0) {
        return [getCurrentPeriod()]; // 如果没有记录，返回当前周期
    }
    
    // 找到最早的记录日期
    const oldestRecord = [...scoreRecords].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )[0];
    
    const firstPeriod = getPeriodForDate(new Date(oldestRecord.timestamp));
    const currentPeriod = getCurrentPeriod();
    
    // 生成从第一个周期到当前周期的所有周期
    const periods = [];
    let periodStart = new Date(firstPeriod.start);
    
    while (periodStart <= currentPeriod.start) {
        const period = getPeriodForDate(periodStart);
        periods.push(period);
        
        // 移动到下一个周期
        periodStart.setDate(periodStart.getDate() + 7);
    }
    
    return periods;
}

// 获取指定周期内的积分变动记录
function getScoreRecordsInPeriod(period, scoreRecords) {
    if (!scoreRecords || !Array.isArray(scoreRecords)) return [];
    
    return scoreRecords.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= period.start && recordDate < period.end;
    });
}

// 计算指定周期内小组的积分变化
function calculateGroupScoreIncreaseInPeriod(groupId, period, scoreRecords) {
    // 筛选出该周期内的积分记录
    const periodRecords = getScoreRecordsInPeriod(period, scoreRecords);
    
    // 计算该组在这个周期内的积分变化总和
    let totalIncrease = 0;
    
    periodRecords.forEach(record => {
        // 处理小组对决记录
        if (record.type === 'battle') {
            // 检查记录描述中是否包含该小组的名称
            const group = appState.groups.find(g => g.id === groupId);
            if (group && record.description.includes(group.name)) {
                totalIncrease += record.score;
            }
            return;
        }
        
        // 处理普通学生积分记录
        // 查找记录中受影响的所有学生
        record.affectedStudents.forEach(affected => {
            // 检查这个学生是否属于该小组
            const student = appState.groups
                .find(g => g.id === groupId)?.students
                .find(s => s.id === affected.studentId);
            
            if (student) {
                totalIncrease += affected.scoreChange;
            }
        });
    });
    
    return totalIncrease;
}

// 获取指定周期的每周之星（积分增加最多的小组）
function getWeeklyStarGroup(period, scoreRecords, groups) {
    if (!groups || !Array.isArray(groups) || groups.length === 0) return null;
    
    let maxIncrease = Number.NEGATIVE_INFINITY; // 修改初始值以处理所有可能的值
    let starGroups = [];
    
    groups.forEach(group => {
        const increase = calculateGroupScoreIncreaseInPeriod(group.id, period, scoreRecords);
        
        if (increase > maxIncrease) {
            maxIncrease = increase;
            starGroups = [{ ...group, increase }];
        } else if (increase === maxIncrease && increase !== 0) { // 确保不会返回零积分变化的小组
            // 处理并列情况
            starGroups.push({ ...group, increase });
        }
    });
    
    // 确保只返回有实际积分变化的小组
    return (starGroups.length > 0 && maxIncrease !== 0) ? starGroups : null;
}

// 计算师徒对在指定周期内的积分增加情况
function calculateMentorshipScoreIncrease(student, mentor, period, scoreRecords) {
    if (!student || !mentor) return 0;
    
    const periodRecords = getScoreRecordsInPeriod(period, scoreRecords);
    let totalIncrease = 0;
    
    // 计算师徒两人在该周期内的积分增加总和
    periodRecords.forEach(record => {
        record.affectedStudents.forEach(affected => {
            if (affected.studentId === student.id || affected.studentId === mentor.id) {
                // 计算所有积分变化（包括正值和负值）
                totalIncrease += affected.scoreChange;
            }
        });
    });
    
    return totalIncrease;
}

// 获取指定周期的最佳师徒（积分增加最多的师徒对）
function getWeeklyBestMentorship(period, scoreRecords, groups) {
    if (!groups || !Array.isArray(groups) || groups.length === 0) return null;
    
    // 获取所有师徒对
    const mentorships = [];
    groups.forEach(group => {
        group.students.forEach(student => {
            if (student.mentorId) {
                const mentor = group.students.find(s => s.id === student.mentorId);
                if (mentor) {
                    mentorships.push({
                        student,
                        mentor,
                        groupId: group.id,
                        groupName: group.name
                    });
                }
            }
        });
    });
    
    if (mentorships.length === 0) return null;
    
    // 计算每对师徒的积分增加
    let maxIncrease = Number.NEGATIVE_INFINITY; // 修改初始值以处理所有可能的值
    let bestMentorships = [];
    
    mentorships.forEach(mentorship => {
        const increase = calculateMentorshipScoreIncrease(
            mentorship.student, 
            mentorship.mentor, 
            period, 
            scoreRecords
        );
        
        if (increase > maxIncrease) {
            maxIncrease = increase;
            bestMentorships = [{ 
                ...mentorship, 
                increase 
            }];
        } else if (increase === maxIncrease && increase !== 0) { // 确保不会返回零积分变化的师徒对
            // 处理并列情况
            bestMentorships.push({ 
                ...mentorship, 
                increase 
            });
        }
    });
    
    // 确保只返回有实际积分变化的师徒对
    return (bestMentorships.length > 0 && maxIncrease !== 0) ? bestMentorships : null;
}

// 每次积分更新时，更新当前周期的每周之星和最佳师徒
function updateWeeklyRankings() {
    const currentPeriod = getCurrentPeriod();
    const weeklyStarGroups = getWeeklyStarGroup(currentPeriod, appState.scoreRecords, appState.groups);
    const weeklyBestMentorships = getWeeklyBestMentorship(currentPeriod, appState.scoreRecords, appState.groups);
    
    renderWeeklyRankings(weeklyStarGroups, weeklyBestMentorships, currentPeriod);
}

// 渲染每周之星和最佳师徒区域
function renderWeeklyRankings(starGroups, bestMentorships, period) {
    const weeklyRankingsContainer = document.getElementById('weeklyRankingsContainer');
    if (!weeklyRankingsContainer) return;
    
    // 格式化日期范围
    const formatDate = (date) => `${date.getMonth() + 1}月${date.getDate()}日`;
    const periodDateRange = `${formatDate(period.start)}-${formatDate(period.end)}`;
    
    let starGroupHTML = '';
    if (starGroups && starGroups.length > 0) {
        if (starGroups.length === 1) {
            // 单个冠军
            const starGroup = starGroups[0];
            const scoreClass = starGroup.increase > 0 ? 'text-green-600' : 'text-red-600';
            const scoreSign = starGroup.increase > 0 ? '+' : '';
            
            starGroupHTML = `
                <div class="flex items-center">
                    <div class="w-16 h-16 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center text-amber-500 text-2xl border-4 border-amber-300">
                        ${starGroup.avatar ? 
                            `<img src="${starGroup.avatar}" alt="${starGroup.name}" class="w-full h-full object-cover">` : 
                            `<span>${starGroup.name.charAt(0)}</span>`
                        }
                    </div>
                    <div class="ml-4">
                        <h4 class="text-lg font-semibold">${starGroup.name}</h4>
                        <p class="${scoreClass} font-medium">${scoreSign}${starGroup.increase.toFixed(2)} 分</p>
                    </div>
                </div>
            `;
        } else {
            // 并列情况
            starGroupHTML = `
                <div class="flex items-center">
                    <div class="flex flex-col w-full">
                        <div class="text-amber-600 font-medium mb-2">${starGroups.length}个小组并列第一</div>
                        ${starGroups.map(group => {
                            const scoreClass = group.increase > 0 ? 'text-green-600' : 'text-red-600';
                            const scoreSign = group.increase > 0 ? '+' : '';
                            return `
                                <div class="flex items-center mb-2">
                                    <div class="w-12 h-12 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center text-amber-500 text-xl border-3 border-amber-300">
                                        ${group.avatar ? 
                                            `<img src="${group.avatar}" alt="${group.name}" class="w-full h-full object-cover">` : 
                                            `<span>${group.name.charAt(0)}</span>`
                                        }
                                    </div>
                                    <div class="ml-3">
                                        <h4 class="text-base font-semibold">${group.name}</h4>
                                        <p class="${scoreClass} font-medium text-sm">${scoreSign}${group.increase.toFixed(2)} 分</p>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
    } else {
        starGroupHTML = `
            <div class="text-center text-gray-500 py-4">
                <p>暂无小组获得积分</p>
            </div>
        `;
    }
    
    let mentorshipHTML = '';
    if (bestMentorships && bestMentorships.length > 0) {
        if (bestMentorships.length === 1) {
            // 单个最佳师徒
            const bestMentorship = bestMentorships[0];
            const scoreClass = bestMentorship.increase > 0 ? 'text-green-600' : 'text-red-600';
            const scoreSign = bestMentorship.increase > 0 ? '+' : '';
            
            mentorshipHTML = `
                <div class="flex items-center">
                    <div class="flex items-center">
                        <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-lg">
                            <span>${bestMentorship.mentor.name.charAt(0)}</span>
                        </div>
                        <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center mx-1 z-10">
                            <svg class="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 text-lg">
                            <span>${bestMentorship.student.name.charAt(0)}</span>
                        </div>
                    </div>
                    <div class="ml-4">
                        <h4 class="text-lg font-semibold">${bestMentorship.mentor.name} & ${bestMentorship.student.name}</h4>
                        <div class="flex items-center">
                            <span class="text-gray-600 text-sm mr-2">${bestMentorship.groupName}</span>
                            <span class="${scoreClass} font-medium">${scoreSign}${bestMentorship.increase.toFixed(2)} 分</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // 并列情况
            mentorshipHTML = `
                <div class="flex flex-col w-full">
                    <div class="text-purple-600 font-medium mb-2">${bestMentorships.length}对师徒并列第一</div>
                    ${bestMentorships.map(mentorship => {
                        const scoreClass = mentorship.increase > 0 ? 'text-green-600' : 'text-red-600';
                        const scoreSign = mentorship.increase > 0 ? '+' : '';
                        return `
                            <div class="flex items-center mb-2">
                                <div class="flex items-center">
                                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-sm">
                                        <span>${mentorship.mentor.name.charAt(0)}</span>
                                    </div>
                                    <div class="w-5 h-5 bg-white rounded-full flex items-center justify-center mx-1 z-10">
                                        <svg class="w-3 h-3 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                    <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 text-sm">
                                        <span>${mentorship.student.name.charAt(0)}</span>
                                    </div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="text-base font-semibold">${mentorship.mentor.name} & ${mentorship.student.name}</h4>
                                    <div class="flex items-center text-xs">
                                        <span class="text-gray-600 mr-2">${mentorship.groupName}</span>
                                        <span class="${scoreClass} font-medium">${scoreSign}${mentorship.increase.toFixed(2)} 分</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
    } else {
        mentorshipHTML = `
            <div class="text-center text-gray-500 py-4">
                <p>暂无师徒获得积分</p>
            </div>
        `;
    }
    
    weeklyRankingsContainer.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow-md p-4">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-lg font-semibold text-amber-700">本周之星</h3>
                    <span class="text-xs text-gray-500">${periodDateRange}</span>
                </div>
                ${starGroupHTML}
            </div>
            <div class="bg-white rounded-lg shadow-md p-4">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-lg font-semibold text-purple-700">最佳师徒</h3>
                    <span class="text-xs text-gray-500">${periodDateRange}</span>
                </div>
                ${mentorshipHTML}
            </div>
        </div>
    `;
}

// 显示荣誉殿堂
function showHallOfFame() {
    // 获取所有历史周期
    const periods = getAllPeriods(appState.scoreRecords);
    periods.reverse(); // 最新的周期排在前面
    
    // 创建荣誉殿堂模态框
    const modal = document.createElement('div');
    modal.id = 'hallOfFameModal';
    modal.className = 'modal show';
    
    let periodsHTML = '';
    
    // 为每个周期生成荣誉信息
    periods.forEach(period => {
        const weeklyStarGroups = getWeeklyStarGroup(period, appState.scoreRecords, appState.groups);
        const weeklyBestMentorships = getWeeklyBestMentorship(period, appState.scoreRecords, appState.groups);
        
        // 格式化日期
        const formatDate = (date) => `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
        const periodDateRange = `${formatDate(period.start)} - ${formatDate(period.end)}`;
        
        // 生成周期的荣誉信息HTML
        let periodHTML = `
            <div class="border rounded-lg shadow-sm mb-4 overflow-hidden">
                <div class="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                    <h3 class="font-medium">${periodDateRange}</h3>
                    <span class="text-xs text-gray-500">第 ${period.id} 周期</span>
                </div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        `;
        
        // 每周之星信息
        periodHTML += `
            <div class="bg-amber-50 rounded p-3 border border-amber-100">
                <h4 class="font-semibold text-amber-800 mb-2">本周之星</h4>
        `;
        
        if (weeklyStarGroups && weeklyStarGroups.length > 0) {
            if (weeklyStarGroups.length === 1) {
                // 单个冠军
                const starGroup = weeklyStarGroups[0];
                const scoreClass = starGroup.increase > 0 ? 'text-green-600' : 'text-red-600';
                const scoreSign = starGroup.increase > 0 ? '+' : '';
                
                periodHTML += `
                    <div class="flex items-center">
                        <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 border-2 border-amber-300">
                            ${starGroup.avatar ? 
                                `<img src="${starGroup.avatar}" alt="${starGroup.name}" class="w-full h-full object-cover rounded-full">` : 
                                `<span>${starGroup.name.charAt(0)}</span>`
                            }
                        </div>
                        <div class="ml-3">
                            <div class="font-semibold">${starGroup.name}</div>
                            <div class="text-sm ${scoreClass}">${scoreSign}${starGroup.increase.toFixed(2)} 分</div>
                        </div>
                    </div>
                `;
            } else {
                // 处理并列情况
                periodHTML += `
                    <div class="text-amber-600 font-medium mb-2 text-sm">${weeklyStarGroups.length}个小组并列第一</div>
                    <div class="space-y-2">
                        ${weeklyStarGroups.map(group => {
                            const scoreClass = group.increase > 0 ? 'text-green-600' : 'text-red-600';
                            const scoreSign = group.increase > 0 ? '+' : '';
                            return `
                                <div class="flex items-center">
                                    <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 border-2 border-amber-300">
                                        ${group.avatar ? 
                                            `<img src="${group.avatar}" alt="${group.name}" class="w-full h-full object-cover rounded-full">` : 
                                            `<span>${group.name.charAt(0)}</span>`
                                        }
                                    </div>
                                    <div class="ml-2">
                                        <div class="font-semibold text-sm">${group.name}</div>
                                        <div class="text-xs ${scoreClass}">${scoreSign}${group.increase.toFixed(2)} 分</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }
        } else {
            periodHTML += `<div class="text-center text-gray-500 py-2">暂无数据</div>`;
        }
        
        periodHTML += `</div>`;
        
        // 最佳师徒信息
        periodHTML += `
            <div class="bg-purple-50 rounded p-3 border border-purple-100">
                <h4 class="font-semibold text-purple-800 mb-2">最佳师徒</h4>
        `;
        
        if (weeklyBestMentorships && weeklyBestMentorships.length > 0) {
            if (weeklyBestMentorships.length === 1) {
                // 单个最佳师徒
                const bestMentorship = weeklyBestMentorships[0];
                const scoreClass = bestMentorship.increase > 0 ? 'text-green-600' : 'text-red-600';
                const scoreSign = bestMentorship.increase > 0 ? '+' : '';
                
                periodHTML += `
                    <div class="flex items-center">
                        <div class="flex items-center">
                            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-sm">
                                <span>${bestMentorship.mentor.name.charAt(0)}</span>
                            </div>
                            <div class="w-4 h-4 bg-white rounded-full flex items-center justify-center mx-1 z-10">
                                <svg class="w-3 h-3 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 text-sm">
                                <span>${bestMentorship.student.name.charAt(0)}</span>
                            </div>
                        </div>
                        <div class="ml-3">
                            <div class="font-semibold">${bestMentorship.mentor.name} & ${bestMentorship.student.name}</div>
                            <div class="flex items-center text-sm">
                                <span class="text-gray-600 mr-2">${bestMentorship.groupName}</span>
                                <span class="${scoreClass}">${scoreSign}${bestMentorship.increase.toFixed(2)} 分</span>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // 处理并列情况
                periodHTML += `
                    <div class="text-purple-600 font-medium mb-2 text-sm">${weeklyBestMentorships.length}对师徒并列第一</div>
                    <div class="space-y-2">
                        ${weeklyBestMentorships.map(mentorship => {
                            const scoreClass = mentorship.increase > 0 ? 'text-green-600' : 'text-red-600';
                            const scoreSign = mentorship.increase > 0 ? '+' : '';
                            return `
                                <div class="flex items-center">
                                    <div class="flex items-center">
                                        <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-xs">
                                            <span>${mentorship.mentor.name.charAt(0)}</span>
                                        </div>
                                        <div class="w-3 h-3 bg-white rounded-full flex items-center justify-center mx-1 z-10">
                                            <svg class="w-2 h-2 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                        <div class="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 text-xs">
                                            <span>${mentorship.student.name.charAt(0)}</span>
                                        </div>
                                    </div>
                                    <div class="ml-2">
                                        <div class="font-semibold text-xs">${mentorship.mentor.name} & ${mentorship.student.name}</div>
                                        <div class="flex items-center text-xs">
                                            <span class="text-gray-600 mr-1">${mentorship.groupName}</span>
                                            <span class="${scoreClass}">${scoreSign}${mentorship.increase.toFixed(2)} 分</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }
        } else {
            periodHTML += `<div class="text-center text-gray-500 py-2">暂无数据</div>`;
        }
        
        periodHTML += `</div>`;
        periodHTML += `</div></div>`;
        
        periodsHTML += periodHTML;
    });
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-5xl w-full m-auto max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4 pb-3 border-b">
                <div class="flex items-center">
                    <svg class="w-6 h-6 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v1h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2V4zm6 0H9v1h2V4zM5 7H4v10h12V7h-1v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7zm7 0v1H8V7h4z"></path>
                    </svg>
                    <h2 class="text-xl font-bold">荣誉殿堂</h2>
                </div>
                <button id="closeHallOfFameBtn" class="text-gray-500 hover:text-gray-700 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            
            <div id="hallOfFameContent">
                ${periodsHTML.length > 0 ? periodsHTML : '<div class="text-center text-gray-500 py-8">暂无历史数据</div>'}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定关闭按钮事件
    document.getElementById('closeHallOfFameBtn').addEventListener('click', function() {
        document.getElementById('hallOfFameModal').remove();
    });
}

// 初始化周期相关功能
function initializeWeeklyRankings() {
    // 在页面加载完成后初始化
    document.addEventListener('DOMContentLoaded', function() {
        updateWeeklyRankings();
    });
}

// 导出函数供其他模块使用
window.updateWeeklyRankings = updateWeeklyRankings;
window.showHallOfFame = showHallOfFame; 