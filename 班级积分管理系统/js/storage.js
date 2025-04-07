const STORAGE_KEY = 'class-score-system';

function saveData(data) {
    try {
        console.log('保存数据开始，groupWeights 数据:', data.groupWeights);
        
        // 确保数据格式正确，但不进行图像压缩
        data = compressImages(data);
        
        // 估算数据大小
        const dataString = JSON.stringify(data);
        const dataSizeMB = dataString.length / (1024 * 1024);
        console.log(`数据大小：约 ${dataSizeMB.toFixed(2)} MB`);
        
        // 验证权重数据是否完整
        console.log('JSON 序列化后的数据中是否包含 groupWeights:', dataString.includes('groupWeights'));
        
        // 检查大小是否超过限制
        if (dataSizeMB > 4.5) { // 预留安全余量，实际限制为5MB
            alert('警告：数据量过大，接近浏览器存储限制。请考虑减少图片数量或质量。');
        }
        
        localStorage.setItem(STORAGE_KEY, dataString);
        console.log('数据保存成功，再次检查 groupWeights:', data.groupWeights);
        
        // 添加分块存储备份机制
        if (dataSizeMB > 2) { // 对于较大数据，使用分块存储
            saveDataInChunks(data);
        }
    } catch (error) {
        console.error('保存数据失败:', error);
        
        if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            alert('保存失败：数据量过大。请删除部分图片或降低图片质量。');
            
            // 尝试恢复上一次有效数据
            const lastValidData = getLastValidData();
            if (lastValidData) {
                return lastValidData;
            }
        }
    }
    return data;
}

// 压缩图片数据
function compressImages(data) {
    if (!data || !data.groups) return data;
    
    // 使用解构赋值创建新对象，保留所有原始字段
    const compressedData = {...data};
    
    console.log('压缩前检查 groupWeights:', data.groupWeights);
    
    // 只处理 groups 数组中的图片数据
    compressedData.groups = data.groups.map(group => {
        const compressedGroup = {...group};
        
        // 确保字段类型正确
        if (typeof group.backgroundImage !== 'string') {
            compressedGroup.backgroundImage = '';
        }
        if (typeof group.avatar !== 'string') {
            compressedGroup.avatar = '';
        }
        
        return compressedGroup;
    });
    
    console.log('压缩后检查 groupWeights:', compressedData.groupWeights);
    
    return compressedData;
}

// 分块存储大型数据
function saveDataInChunks(data) {
    try {
        const dataString = JSON.stringify(data);
        const chunkSize = 1024 * 1024; // 1MB块大小
        const chunks = [];
        
        // 分割数据
        for (let i = 0; i < dataString.length; i += chunkSize) {
            chunks.push(dataString.substring(i, i + chunkSize));
        }
        
        // 存储分块信息
        localStorage.setItem(`${STORAGE_KEY}_chunks_count`, chunks.length.toString());
        
        // 存储每个分块
        chunks.forEach((chunk, index) => {
            localStorage.setItem(`${STORAGE_KEY}_chunk_${index}`, chunk);
        });
        
        console.log(`数据已分块保存，共${chunks.length}块`);
    } catch (error) {
        console.error('分块保存失败:', error);
    }
}

// 修改加载数据函数，增加分块恢复功能
function loadData() {
    try {
        // 尝试常规加载
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
        
        // 尝试从分块中恢复
        return loadDataFromChunks();
    } catch (error) {
        console.error('加载数据失败:', error);
        return null;
    }
}

// 从分块中恢复数据
function loadDataFromChunks() {
    try {
        const chunksCount = parseInt(localStorage.getItem(`${STORAGE_KEY}_chunks_count`));
        if (!chunksCount) return null;
        
        let dataString = '';
        for (let i = 0; i < chunksCount; i++) {
            const chunk = localStorage.getItem(`${STORAGE_KEY}_chunk_${i}`);
            if (chunk) {
                dataString += chunk;
            } else {
                throw new Error(`缺少数据块 ${i}`);
            }
        }
        
        return JSON.parse(dataString);
    } catch (error) {
        console.error('从分块恢复数据失败:', error);
        return null;
    }
}

// 获取上一次有效的数据
function getLastValidData() {
    // 尝试从备份中恢复
    try {
        const backup = localStorage.getItem(`${STORAGE_KEY}_backup`);
        if (backup) {
            return JSON.parse(backup);
        }
    } catch (e) {
        console.error('恢复备份失败:', e);
    }
    return null;
}

// 添加导出数据功能
function exportData() {
    try {
        const data = loadData();
        if (!data) {
            alert('没有数据可导出！');
            return;
        }
        
        // 确保所有头像字段格式正确，保留完整的base64数据
        if (data.groups && Array.isArray(data.groups)) {
            data.groups.forEach(group => {
                // 确保avatar字段是字符串
                if (!group.avatar || typeof group.avatar !== 'string') {
                    group.avatar = '';
                }
                
                // 确保backgroundImage字段是字符串
                if (!group.backgroundImage || typeof group.backgroundImage !== 'string') {
                    group.backgroundImage = '';
                }
                
                // 验证avatar是否为有效的base64图像，如果不是，则清空
                if (group.avatar && !isValidBase64Image(group.avatar)) {
                    console.warn('检测到无效的头像数据，已清空');
                    group.avatar = '';
                }
                
                // 验证backgroundImage是否为有效的base64图像
                if (group.backgroundImage && !isValidBase64Image(group.backgroundImage)) {
                    console.warn('检测到无效的背景图像数据，已清空');
                    group.backgroundImage = '';
                }
            });
        }
        
        // 添加商品数据到导出内容
        try {
            const savedItems = localStorage.getItem('shopItems');
            if (savedItems) {
                data.shopItems = JSON.parse(savedItems);
                console.log('商品数据已添加到导出内容');
            }
        } catch (error) {
            console.warn('获取商品数据时出错，将不包含商品数据:', error);
        }
        
        // 创建下载链接
        const dataStr = JSON.stringify(data);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `班级积分系统备份_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        
        // 清理URL对象
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        console.log('数据导出成功，包含组数: ' + (data.groups ? data.groups.length : 0) +
                   ', 商品数: ' + (data.shopItems ? data.shopItems.length : 0) +
                   ', 兑换记录数: ' + (data.exchangeRecords ? data.exchangeRecords.length : 0));
    } catch (error) {
        console.error('导出数据失败:', error);
        alert('导出数据失败: ' + error.message);
    }
}

// 判断字符串是否为有效的base64编码图像
function isValidBase64Image(str) {
    // 空字符串不是有效的图像
    if (!str) return false;
    // 必须以data:image开头
    if (!str.startsWith('data:image')) return false;
    // 必须包含base64编码部分
    if (str.indexOf('base64,') === -1) return false;
    // 长度必须合理(最短的有效base64图像大约为100字符)
    return str.length > 100;
}

// 添加导入数据功能
function importData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (!data || !data.groups) {
                    reject(new Error('无效的数据格式'));
                    return;
                }
                
                // 兼容旧版本数据格式，保留原始图像数据
                if (data.groups && Array.isArray(data.groups)) {
                    data.groups = data.groups.map(group => {
                        const updatedGroup = {...group};
                        
                        // 确保avatar字段是字符串
                        if (typeof updatedGroup.avatar !== 'string') {
                            updatedGroup.avatar = '';
                        }
                        // 确保backgroundImage字段是字符串
                        if (typeof updatedGroup.backgroundImage !== 'string') {
                            updatedGroup.backgroundImage = '';
                        }
                        
                        // 验证头像数据有效性
                        if (updatedGroup.avatar && !isValidBase64Image(updatedGroup.avatar)) {
                            console.warn('导入时检测到无效的头像数据，已清空');
                            updatedGroup.avatar = '';
                        }
                        
                        return updatedGroup;
                    });
                }
                
                // 保存主应用数据
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                
                // 保存商品数据(如果存在)
                if (data.shopItems && Array.isArray(data.shopItems)) {
                    try {
                        localStorage.setItem('shopItems', JSON.stringify(data.shopItems));
                        console.log('已导入商品数据，数量:', data.shopItems.length);
                    } catch (error) {
                        console.warn('保存导入的商品数据时出错:', error);
                    }
                }
                
                resolve(data);
                console.log('数据导入成功，组数: ' + data.groups.length + 
                         ', 商品数: ' + (data.shopItems ? data.shopItems.length : 0) +
                         ', 兑换记录数: ' + (data.exchangeRecords ? data.exchangeRecords.length : 0));
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('读取文件失败'));
        };
        
        reader.readAsText(file);
    });
}

function clearData() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('清除数据失败:', error);
    }
}

// 添加导出数据到Excel功能
function exportToExcel() {
    try {
        const data = loadData();
        if (!data || !data.groups.length === 0) {
            alert('没有数据可导出！');
            return;
        }
        
        // 创建工作簿
        const wb = XLSX.utils.book_new();
        
        // 导出小组数据
        const groupsData = data.groups.map(group => ({
            '小组ID': group.id,
            '小组名称': group.name,
            '总积分': group.totalScore,
            '剩余积分': group.remainingScore,
            '学生人数': group.students ? group.students.length : 0
        }));
        const groupsSheet = XLSX.utils.json_to_sheet(groupsData);
        XLSX.utils.book_append_sheet(wb, groupsSheet, '小组信息');
        
        // 导出学生数据
        const studentsData = [];
        data.groups.forEach(group => {
            if (group.students) {
                group.students.forEach(student => {
                    studentsData.push({
                        '学生ID': student.id,
                        '学生姓名': student.name,
                        '所属小组': group.name,
                        '个人积分': student.score,
                        '师傅ID': student.mentorId || '无',
                        '小组ID': student.groupId,
                        '级别': student.level
                    });
                });
            }
        });
        const studentsSheet = XLSX.utils.json_to_sheet(studentsData);
        XLSX.utils.book_append_sheet(wb, studentsSheet, '学生信息');
        
        // 导出积分记录
        if (data.scoreRecords && data.scoreRecords.length > 0) {
            const scoreRecordsData = data.scoreRecords.map(record => ({
                '记录ID': record.id,
                '时间': new Date(record.timestamp).toLocaleString(),
                '小组ID': record.groupId,
                '学生ID': record.studentId,
                '学生姓名': record.studentName,
                '积分变化': record.score,
                '描述': record.description
            }));
            const scoreRecordsSheet = XLSX.utils.json_to_sheet(scoreRecordsData);
            XLSX.utils.book_append_sheet(wb, scoreRecordsSheet, '积分记录');
        }
        
        // 导出兑换记录
        if (data.exchangeRecords && data.exchangeRecords.length > 0) {
            const exchangeRecordsData = data.exchangeRecords.map(record => ({
                '记录ID': record.id,
                '时间': new Date(record.timestamp).toLocaleString(),
                '小组ID': record.groupId,
                '兑换积分': record.points,
                '兑换物品': record.item,
                '描述': record.description
            }));
            const exchangeRecordsSheet = XLSX.utils.json_to_sheet(exchangeRecordsData);
            XLSX.utils.book_append_sheet(wb, exchangeRecordsSheet, '兑换记录');
        }
        
        // 导出商品信息
        try {
            const savedItems = localStorage.getItem('shopItems');
            if (savedItems) {
                const shopItems = JSON.parse(savedItems);
                if (shopItems && shopItems.length > 0) {
                    const shopItemsData = shopItems.map(item => ({
                        '商品ID': item.id,
                        '商品名称': item.name,
                        '价格': item.price,
                        '描述': item.description,
                        '分类': item.category,
                        '是否限时': item.isLimited ? '是' : '否',
                        '折扣率': item.discountRate,
                        '折扣结束日期': item.discountEndDate ? new Date(item.discountEndDate).toLocaleDateString() : '',
                        '可用截止日期': item.availableUntil ? new Date(item.availableUntil).toLocaleDateString() : '',
                        '创建日期': item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''
                    }));
                    const shopItemsSheet = XLSX.utils.json_to_sheet(shopItemsData);
                    XLSX.utils.book_append_sheet(wb, shopItemsSheet, '商品信息');
                }
            }
        } catch (error) {
            console.warn('导出商品数据到Excel时出错:', error);
        }
        
        // 导出Excel文件
        XLSX.writeFile(wb, `班级积分系统数据_${new Date().toISOString().slice(0, 10)}.xlsx`);
        
    } catch (error) {
        console.error('导出Excel失败:', error);
        alert('导出Excel失败: ' + error.message);
    }
}

// 导出数据到CSV
function exportToCSV() {
    try {
        const data = loadData();
        if (!data || !data.groups.length === 0) {
            alert('没有数据可导出！');
            return;
        }
        
        // 导出小组数据
        let groupsCSV = '小组ID,小组名称,总积分,剩余积分,学生人数\n';
        data.groups.forEach(group => {
            groupsCSV += `${group.id},${escapeCsvValue(group.name)},${group.totalScore},${group.remainingScore},${group.students ? group.students.length : 0}\n`;
        });
        downloadCSV(groupsCSV, `小组数据_${new Date().toISOString().slice(0, 10)}.csv`);
        
        // 导出学生数据
        let studentsCSV = '学生ID,学生姓名,所属小组,个人积分,师傅ID,小组ID,级别\n';
        data.groups.forEach(group => {
            if (group.students) {
                group.students.forEach(student => {
                    studentsCSV += `${student.id},${escapeCsvValue(student.name)},${escapeCsvValue(group.name)},${student.score},${student.mentorId || '无'},${student.groupId},${student.level}\n`;
                });
            }
        });
        downloadCSV(studentsCSV, `学生数据_${new Date().toISOString().slice(0, 10)}.csv`);
        
        // 导出积分记录
        if (data.scoreRecords && data.scoreRecords.length > 0) {
            let scoreRecordsCSV = '记录ID,时间,小组ID,学生ID,学生姓名,积分变化,描述\n';
            data.scoreRecords.forEach(record => {
                scoreRecordsCSV += `${record.id},${new Date(record.timestamp).toLocaleString()},${record.groupId},${record.studentId},${escapeCsvValue(record.studentName)},${record.score},${escapeCsvValue(record.description || '')}\n`;
            });
            downloadCSV(scoreRecordsCSV, `积分记录_${new Date().toISOString().slice(0, 10)}.csv`);
        }
        
        // 导出兑换记录
        if (data.exchangeRecords && data.exchangeRecords.length > 0) {
            let exchangeRecordsCSV = '记录ID,时间,小组ID,兑换积分,兑换物品,描述\n';
            data.exchangeRecords.forEach(record => {
                exchangeRecordsCSV += `${record.id},${new Date(record.timestamp).toLocaleString()},${record.groupId},${record.points},${escapeCsvValue(record.item)},${escapeCsvValue(record.description || '')}\n`;
            });
            downloadCSV(exchangeRecordsCSV, `兑换记录_${new Date().toISOString().slice(0, 10)}.csv`);
        }
        
        // 导出商品信息
        try {
            const savedItems = localStorage.getItem('shopItems');
            if (savedItems) {
                const shopItems = JSON.parse(savedItems);
                if (shopItems && shopItems.length > 0) {
                    let shopItemsCSV = '商品ID,商品名称,价格,描述,分类,是否限时,折扣率,折扣结束日期,可用截止日期,创建日期\n';
                    shopItems.forEach(item => {
                        shopItemsCSV += `${item.id},${escapeCsvValue(item.name)},${item.price},${escapeCsvValue(item.description)},${escapeCsvValue(item.category)},${item.isLimited ? '是' : '否'},${item.discountRate},${item.discountEndDate ? new Date(item.discountEndDate).toLocaleDateString() : ''},${item.availableUntil ? new Date(item.availableUntil).toLocaleDateString() : ''},${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}\n`;
                    });
                    downloadCSV(shopItemsCSV, `商品信息_${new Date().toISOString().slice(0, 10)}.csv`);
                }
            }
        } catch (error) {
            console.warn('导出商品数据到CSV时出错:', error);
        }
        
    } catch (error) {
        console.error('导出CSV失败:', error);
        alert('导出CSV失败: ' + error.message);
    }
}

// 辅助函数：CSV值转义
function escapeCsvValue(value) {
    if (value == null) return '';
    return `"${String(value).replace(/"/g, '""')}"`;
}

// 辅助函数：下载CSV文件
function downloadCSV(csvContent, fileName) {
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

// 从Excel导入数据
function importFromExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // 初始化新数据结构
                const newData = {
                    groups: [],
                    scoreRecords: [],
                    exchangeRecords: []
                };
                
                // 读取小组信息
                if (workbook.SheetNames.includes('小组信息')) {
                    const groupsSheet = workbook.Sheets['小组信息'];
                    const groupsData = XLSX.utils.sheet_to_json(groupsSheet);
                    
                    groupsData.forEach(g => {
                        newData.groups.push({
                            id: g['小组ID'] || generateUniqueId(),
                            name: g['小组名称'],
                            totalScore: Number(g['总积分'] || 0),
                            remainingScore: Number(g['剩余积分'] || 0),
                            students: [] // 稍后填充
                        });
                    });
                }
                
                // 读取学生信息
                if (workbook.SheetNames.includes('学生信息')) {
                    const studentsSheet = workbook.Sheets['学生信息'];
                    const studentsData = XLSX.utils.sheet_to_json(studentsSheet);
                    
                    studentsData.forEach(s => {
                        const groupId = s['小组ID'];
                        const group = newData.groups.find(g => g.id === groupId);
                        
                        if (group) {
                            group.students.push({
                                id: s['学生ID'] || generateUniqueId(),
                                name: s['学生姓名'],
                                score: Number(s['个人积分'] || 0),
                                mentorId: s['师傅ID'] === '无' ? null : s['师傅ID'],
                                groupId: groupId,
                                level: Number(s['级别'] || 0)
                            });
                        }
                    });
                }
                
                // 读取积分记录
                if (workbook.SheetNames.includes('积分记录')) {
                    const scoreRecordsSheet = workbook.Sheets['积分记录'];
                    const scoreRecordsData = XLSX.utils.sheet_to_json(scoreRecordsSheet);
                    
                    scoreRecordsData.forEach(r => {
                        newData.scoreRecords.push({
                            id: r['记录ID'] || generateUniqueId(),
                            timestamp: parseExcelDate(r['时间']),
                            groupId: r['小组ID'],
                            studentId: r['学生ID'],
                            studentName: r['学生姓名'],
                            score: Number(r['积分变化'] || 0),
                            description: r['描述'] || ''
                        });
                    });
                }
                
                // 读取兑换记录
                if (workbook.SheetNames.includes('兑换记录')) {
                    const exchangeRecordsSheet = workbook.Sheets['兑换记录'];
                    const exchangeRecordsData = XLSX.utils.sheet_to_json(exchangeRecordsSheet);
                    
                    exchangeRecordsData.forEach(r => {
                        newData.exchangeRecords.push({
                            id: r['记录ID'] || generateUniqueId(),
                            timestamp: parseExcelDate(r['时间']),
                            groupId: r['小组ID'],
                            points: Number(r['兑换积分'] || 0),
                            item: r['兑换物品'] || '',
                            description: r['描述'] || ''
                        });
                    });
                }
                
                // 读取商品信息
                if (workbook.SheetNames.includes('商品信息')) {
                    const shopItemsSheet = workbook.Sheets['商品信息'];
                    const shopItemsData = XLSX.utils.sheet_to_json(shopItemsSheet);
                    
                    if (shopItemsData && shopItemsData.length > 0) {
                        const shopItems = shopItemsData.map(i => ({
                            id: i['商品ID'] || 's' + Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 5),
                            name: i['商品名称'] || '',
                            price: Number(i['价格'] || 0),
                            description: i['描述'] || '',
                            category: i['分类'] || '',
                            isLimited: i['是否限时'] === '是',
                            discountRate: Number(i['折扣率'] || 1),
                            discountEndDate: i['折扣结束日期'] ? new Date(i['折扣结束日期']) : null,
                            availableUntil: i['可用截止日期'] ? new Date(i['可用截止日期']) : null,
                            createdAt: i['创建日期'] ? new Date(i['创建日期']) : new Date()
                        }));
                        
                        // 保存商品信息到localStorage
                        try {
                            localStorage.setItem('shopItems', JSON.stringify(shopItems));
                            console.log('已从Excel导入商品数据，数量:', shopItems.length);
                        } catch (error) {
                            console.warn('保存导入的商品数据时出错:', error);
                        }
                    }
                }
                
                // 保存到localStorage
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
                
                resolve(newData);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('读取Excel文件失败'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

// 辅助函数：解析Excel日期
function parseExcelDate(dateStr) {
    if (!dateStr) return new Date().toISOString();
    try {
        return new Date(dateStr).toISOString();
    } catch (e) {
        return new Date().toISOString();
    }
}

// 辅助函数：生成唯一ID
function generateUniqueId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5);
}