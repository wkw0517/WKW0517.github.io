// 调试日志
console.log('shop.js 已加载');

// 商城商品数据
let shopItems = [
    {
        id: 's001',
        name: '课堂免答一次',
        description: '使用后，可在课堂提问环节免答一次。每位同学限用一次。',
        price: 2,
        category: 'basic',
        isLimited: false,
        discountRate: 1,
        discountEndDate: null,
        availableUntil: null,
        createdAt: new Date('2023-01-01')
    },
    {
        id: 's002',
        name: '小组作业延期一天',
        description: '使用后，小组作业可延期一天提交，不影响分数。每小组限用一次。',
        price: 4,
        category: 'basic',
        isLimited: false,
        discountRate: 1,
        discountEndDate: null,
        availableUntil: null,
        createdAt: new Date('2023-01-01')
    },
    {
        id: 's003',
        name: '课堂小零食',
        description: '小组可获得一次课间小零食福利。',
        price: 3,
        category: 'reward',
        isLimited: false,
        discountRate: 1,
        discountEndDate: null,
        availableUntil: null,
        createdAt: new Date('2023-01-01')
    },
    {
        id: 's004',
        name: '期末考试提分卡',
        description: '期末考试成绩可提高1分（不超过满分）。每位同学限用一次。',
        price: 5,
        category: 'premium',
        isLimited: true,
        discountRate: 1,
        discountEndDate: null,
        availableUntil: new Date(new Date().getFullYear(), 11, 31),
        createdAt: new Date('2023-01-01')
    },
    {
        id: 's005',
        name: '下课提前5分钟',
        description: '全班可以提前5分钟下课一次。每学期限用两次。',
        price: 4,
        category: 'special',
        isLimited: false,
        discountRate: 0.8,
        discountEndDate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000),
        availableUntil: null,
        createdAt: new Date('2023-01-01')
    },
    {
        id: 's006',
        name: '小组加分1分',
        description: '小组在某次作业中可获得额外1分奖励。',
        price: 3.5,
        category: 'reward',
        isLimited: false,
        discountRate: 1,
        discountEndDate: null,
        availableUntil: null,
        createdAt: new Date('2023-02-15')
    },
    {
        id: 's007',
        name: '自由活动课1节',
        description: '可兑换一节自由活动课，小组可自行组织活动。',
        price: 5,
        category: 'premium',
        isLimited: true,
        discountRate: 0.9,
        discountEndDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        availableUntil: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date('2023-03-01')
    },
    {
        id: 's008',
        name: '课堂点名豁免权',
        description: '使用后，当天课堂点名时可"出勤"一次。每位同学每学期限用一次。',
        price: 3,
        category: 'basic',
        isLimited: false,
        discountRate: 1,
        discountEndDate: null,
        availableUntil: null,
        createdAt: new Date('2023-04-01')
    },
    {
        id: 's009',
        name: '班级派对基金',
        description: '为班级派对提供基金支持，全班共享。',
        price: 5,
        category: 'premium',
        isLimited: true,
        discountRate: 0.5,
        discountEndDate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000),
        availableUntil: new Date(new Date().getFullYear(), 11, 31),
        createdAt: new Date('2023-05-01')
    }
];

// 是否处于管理模式
let isAdminMode = false;

// 当前编辑的商品ID
let currentEditItemId = null;

// 当前选中的小组ID
let currentShopGroupId = null;

// 商城初始化 - 在打开商城时调用
function initializeShop(groupId) {
    console.log('初始化商城，组ID:', groupId);
    currentShopGroupId = groupId;
    
    // 更新可用积分显示
    updateAvailableScore();
    
    // 初始化商品列表
    renderShopItems();
    
    // 移除现有事件监听器并重新绑定事件
    const searchInput = document.getElementById('shopSearch');
    const sortSelect = document.getElementById('shopSort');
    
    // 克隆并替换元素，彻底清除旧事件监听器
    const searchInput_new = searchInput.cloneNode(true);
    const sortSelect_new = sortSelect.cloneNode(true);
    searchInput.parentNode.replaceChild(searchInput_new, searchInput);
    sortSelect.parentNode.replaceChild(sortSelect_new, sortSelect);
    
    // 重新绑定事件
    searchInput_new.addEventListener('input', handleShopSearch);
    sortSelect_new.addEventListener('change', handleShopSort);
    
    // 初始化分类按钮
    const catButtons = document.querySelectorAll('.shop-categories button');
    catButtons.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr) {
            btn.removeAttribute('onclick');
            
            const match = onclickAttr.match(/filterShopItems\('(.+?)'\)/);
            if (match && match[1]) {
                const category = match[1];
                btn.addEventListener('click', function() {
                    filterShopItems(category);
                });
            }
        }
    });
}

// 显示商品表单（添加/编辑）
function showItemForm(itemId = null) {
    currentEditItemId = itemId;
    let item = null;
    
    if (itemId) {
        // 编辑现有商品
        item = shopItems.find(i => i.id === itemId);
        if (!item) {
            console.error('找不到要编辑的商品:', itemId);
            return;
        }
    }
    
    // 创建表单模态框
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'itemFormModal';
    
    const today = new Date().toISOString().split('T')[0];
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full m-auto">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">${item ? '编辑商品' : '添加新商品'}</h2>
                <button id="closeItemFormBtn" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            
            <form id="itemForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">商品名称</label>
                        <input type="text" id="itemName" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value="${item ? item.name : ''}" required>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700">价格（积分）</label>
                        <input type="number" id="itemPrice" step="0.1" min="0.1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value="${item ? item.price : '1'}" required>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700">商品描述</label>
                    <textarea id="itemDescription" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>${item ? item.description : ''}</textarea>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">商品分类</label>
                        <select id="itemCategory" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            <option value="basic" ${item && item.category === 'basic' ? 'selected' : ''}>基础商品</option>
                            <option value="reward" ${item && item.category === 'reward' ? 'selected' : ''}>奖励商品</option>
                            <option value="premium" ${item && item.category === 'premium' ? 'selected' : ''}>高级商品</option>
                            <option value="special" ${item && item.category === 'special' ? 'selected' : ''}>特殊商品</option>
                        </select>
                    </div>
                    
                    <div class="flex items-center space-x-3 pt-6">
                        <label class="inline-flex items-center">
                            <input type="checkbox" id="itemIsLimited" class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" ${item && item.isLimited ? 'checked' : ''}>
                            <span class="ml-2 text-sm text-gray-700">限量商品</span>
                        </label>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">折扣率（1 = 无折扣，0.5 = 5折，0.4 = 4折）</label>
                        <input type="number" id="itemDiscountRate" step="0.05" min="0.1" max="1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value="${item ? item.discountRate : '1'}">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700">折扣结束日期（可选）</label>
                        <input type="date" id="itemDiscountEndDate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value="${item && item.discountEndDate ? new Date(item.discountEndDate).toISOString().split('T')[0] : ''}">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700">有效期至（可选）</label>
                    <input type="date" id="itemAvailableUntil" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value="${item && item.availableUntil ? new Date(item.availableUntil).toISOString().split('T')[0] : ''}">
                </div>
                
                <div class="flex justify-end gap-2 pt-2">
                    ${item ? `
                        <button type="button" id="deleteItemBtn" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                            删除商品
                        </button>
                    ` : ''}
                    <button type="button" id="cancelItemFormBtn" class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                        取消
                    </button>
                    <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                        ${item ? '保存修改' : '添加商品'}
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定事件
    document.getElementById('closeItemFormBtn').addEventListener('click', closeItemForm);
    document.getElementById('cancelItemFormBtn').addEventListener('click', closeItemForm);
    
    if (item) {
        document.getElementById('deleteItemBtn').addEventListener('click', function() {
            if (confirm('确定要删除此商品吗？此操作不可撤销。')) {
                deleteItem(itemId);
                closeItemForm();
            }
        });
    }
    
    document.getElementById('itemForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveItem();
    });
}

// 关闭商品表单
function closeItemForm() {
    const modal = document.getElementById('itemFormModal');
    if (modal) {
        modal.remove();
    }
    currentEditItemId = null;
}

// 保存商品
function saveItem() {
    // 获取表单数据
    const form = document.getElementById('itemForm');
    const name = document.getElementById('itemName').value;
    const price = parseFloat(document.getElementById('itemPrice').value);
    const description = document.getElementById('itemDescription').value;
    const category = document.getElementById('itemCategory').value;
    const isLimited = document.getElementById('itemIsLimited').checked;
    const discountRate = parseFloat(document.getElementById('itemDiscountRate').value);
    
    // 处理日期字段
    const discountEndDateStr = document.getElementById('itemDiscountEndDate').value;
    const availableUntilStr = document.getElementById('itemAvailableUntil').value;
    
    const discountEndDate = discountEndDateStr ? new Date(discountEndDateStr) : null;
    const availableUntil = availableUntilStr ? new Date(availableUntilStr) : null;
    
    if (currentEditItemId) {
        // 编辑现有商品
        shopItems = shopItems.map(item => {
            if (item.id === currentEditItemId) {
                return {
                    ...item,
                    name,
                    price,
                    description,
                    category,
                    isLimited,
                    discountRate,
                    discountEndDate,
                    availableUntil,
                };
            }
            return item;
        });
    } else {
        // 创建新商品
        const newItem = {
            id: 's' + Date.now().toString().slice(-6), // 生成唯一ID
            name,
            description,
            price,
            category,
            isLimited,
            discountRate,
            discountEndDate,
            availableUntil,
            createdAt: new Date()
        };
        
        shopItems.push(newItem);
    }
    
    // 保存更新后的商品数据
    saveShopItems();
    
    // 关闭表单
    closeItemForm();
    
    // 重新渲染商品列表
    renderShopItems();
    
    // 如果商品管理界面正在显示，也刷新管理界面
    if (document.getElementById('shopAdminModal')) {
        renderAdminProducts();
    }
}

// 删除商品
function deleteItem(itemId) {
    // 从数组中移除商品
    shopItems = shopItems.filter(item => item.id !== itemId);
    
    // 保存更新后的商品数据
    saveShopItems();
    
    // 重新渲染商品列表
    renderShopItems();
    
    // 如果商品管理界面正在显示，也刷新管理界面
    if (document.getElementById('shopAdminModal')) {
        renderAdminProducts();
    }
}

// 保存商品数据到localStorage
function saveShopItems() {
    try {
        // 转换日期对象为ISO字符串，避免序列化问题
        const itemsToSave = shopItems.map(item => ({
            ...item,
            createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
            discountEndDate: item.discountEndDate instanceof Date ? item.discountEndDate.toISOString() : item.discountEndDate,
            availableUntil: item.availableUntil instanceof Date ? item.availableUntil.toISOString() : item.availableUntil
        }));
        
        localStorage.setItem('shopItems', JSON.stringify(itemsToSave));
        console.log('商品数据已保存');
    } catch (error) {
        console.error('保存商品数据时出错:', error);
    }
}

// 从localStorage加载商品数据
function loadShopItems() {
    try {
        const savedItems = localStorage.getItem('shopItems');
        if (savedItems) {
            // 解析JSON并将日期字符串转换为Date对象
            shopItems = JSON.parse(savedItems).map(item => ({
                ...item,
                createdAt: item.createdAt ? new Date(item.createdAt) : null,
                discountEndDate: item.discountEndDate ? new Date(item.discountEndDate) : null,
                availableUntil: item.availableUntil ? new Date(item.availableUntil) : null
            }));
            console.log('已加载商品数据');
        }
    } catch (error) {
        console.error('加载商品数据时出错:', error);
    }
}

// 显示商城模态框
function showShopModal(groupId) {
    console.log('显示商城模态框，组ID:', groupId);
    
    try {
        // 确保appState被正确初始化
        initializeAppState();
        
        // 加载商品数据
        loadShopItems();
        
        // 如果没有传入组ID，显示选择组的界面
        if (!groupId) {
            console.log('未提供组ID，显示组选择界面');
            showGroupSelectionForShop();
            return;
        }
        
        // 检查元素是否存在
        const modal = document.getElementById('shopModal');
        if (!modal) {
            console.error('找不到shopModal元素!');
            alert('商城组件加载失败，请刷新页面重试。');
            return;
        }
        
        // 初始化商城
        initializeShop(groupId);
        
        // 显示模态框
        modal.classList.add('show');
        console.log('商城模态框已显示');
    } catch (error) {
        console.error('显示商城时出错:', error);
        alert('打开商城时出错: ' + error.message);
    }
}

// 显示组选择界面
function showGroupSelectionForShop() {
    // 确保appState被正确初始化
    initializeAppState();
    
    // 获取所有组
    const groups = appState.groups;
    if (!groups || groups.length === 0) {
        alert('没有可用的小组！');
        return;
    }
    
    // 如果只有一个组，直接打开商城
    if (groups.length === 1) {
        showShopModal(groups[0].id);
        return;
    }
    
    // 创建一个临时模态框让用户选择组
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'groupSelectForShopModal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full m-auto">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">选择小组</h2>
                <button onclick="document.getElementById('groupSelectForShopModal').remove()" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="space-y-4">
                <p class="text-gray-600">请选择要为哪个小组兑换商品：</p>
                <div class="grid grid-cols-1 gap-2">
                    ${groups.map(group => `
                        <button onclick="document.getElementById('groupSelectForShopModal').remove(); showShopModal('${group.id}')" 
                                class="bg-white border border-gray-300 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 text-left flex items-center">
                            <div class="w-8 h-8 bg-gray-200 rounded-full overflow-hidden mr-3 flex-shrink-0">
                                ${group.avatar ? `<img src="${group.avatar}" alt="${group.name}" class="w-full h-full object-cover">` : ''}
                            </div>
                            <div>
                                <div class="font-medium">${group.name}</div>
                                <div class="text-sm text-gray-500">可用积分: ${group.remainingScore.toFixed(2)}</div>
                            </div>
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 隐藏商城模态框
function hideShopModal() {
    const modal = document.getElementById('shopModal');
    modal.classList.remove('show');
    currentShopGroupId = null;
}

// 更新可用积分显示
function updateAvailableScore() {
    try {
        if (!currentShopGroupId) return;
        
        // 确保appState被正确初始化
        initializeAppState();
        
        const group = appState.groups.find(g => g.id === currentShopGroupId);
        if (!group) return;
        
        const scoreElement = document.getElementById('shopGroupScore');
        if (!scoreElement) {
            console.error('找不到shopGroupScore元素');
            return;
        }
        
        const remainingScore = typeof group.remainingScore === 'number' ? group.remainingScore : 0;
        scoreElement.textContent = `可用积分: ${remainingScore.toFixed(2)}`;
    } catch (error) {
        console.error('更新可用积分显示时出错:', error);
    }
}

// 渲染商品列表
function renderShopItems(filteredItems = null) {
    const itemsToRender = filteredItems || getFilteredAndSortedItems();
    const grid = document.getElementById('shopItemsGrid');
    
    if (itemsToRender.length === 0) {
        grid.innerHTML = `
            <div class="col-span-3 py-8 text-center text-gray-500">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">没有找到商品</h3>
                <p class="mt-1 text-sm text-gray-500">尝试更改筛选条件或者清除搜索关键词。</p>
                ${isAdminMode ? `
                <div class="mt-4">
                    <button id="addNewItemEmptyBtn" class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        添加商品
                    </button>
                </div>
                ` : ''}
            </div>
        `;
        
        // 如果在管理模式下，绑定添加商品按钮
        if (isAdminMode) {
            setTimeout(() => {
                const addBtn = document.getElementById('addNewItemEmptyBtn');
                if (addBtn) {
                    addBtn.addEventListener('click', () => showItemForm());
                }
            }, 10);
        }
        
        return;
    }
    
    grid.innerHTML = itemsToRender.map(item => {
        // 计算实际价格
        const actualPrice = Math.round(item.price * item.discountRate * 10) / 10;
        const hasDiscount = item.discountRate < 1;
        
        // 检查是否限时
        const isExpiringSoon = item.availableUntil && 
                               (new Date(item.availableUntil).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000) < 7;
        
        // 检查折扣是否即将结束
        const isDiscountEnding = hasDiscount && item.discountEndDate && 
                                 (new Date(item.discountEndDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000) < 3;
        
        // 如果在管理模式下，显示编辑按钮
        const adminControls = isAdminMode ? `
            <button type="button" data-item-id="${item.id}" class="item-edit-btn text-sm px-3 py-1 border border-blue-300 rounded hover:bg-blue-50">
                编辑
            </button>
        ` : '';
        
        return `
            <div class="bg-white rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                <div class="p-4">
                    <div class="flex justify-between items-start">
                        <h3 class="text-lg font-medium text-gray-900">${item.name}</h3>
                        ${item.isLimited ? `
                            <span class="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded">限量</span>
                        ` : ''}
                    </div>
                    
                    <div class="mt-2 min-h-[60px]">
                        <p class="text-sm text-gray-500 line-clamp-3">${item.description}</p>
                    </div>
                    
                    <div class="mt-3 flex items-end justify-between">
                        <div>
                            ${hasDiscount ? `
                                <div class="flex items-center">
                                    <span class="text-lg font-bold text-red-600">${actualPrice}</span>
                                    <span class="ml-2 text-sm text-gray-500 line-through">${item.price}</span>
                                    <span class="ml-1 text-xs text-red-600 font-medium">${Math.round(item.discountRate*100)/10}折</span>
                                </div>
                            ` : `
                                <div class="text-lg font-bold text-gray-900">${item.price}</div>
                            `}
                            
                            ${isExpiringSoon ? `
                                <div class="text-xs text-orange-600 mt-1">
                                    <span class="inline-block align-middle">⏱️</span> 
                                    限时: ${new Date(item.availableUntil).toLocaleDateString()}
                                </div>
                            ` : ''}
                            
                            ${isDiscountEnding ? `
                                <div class="text-xs text-red-600 mt-1">
                                    <span class="inline-block align-middle">🔥</span> 
                                    折扣剩余: ${Math.ceil((new Date(item.discountEndDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))}天
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="flex space-x-2">
                            ${adminControls}
                            <button type="button" data-item-id="${item.id}" class="item-detail-btn text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                                详情
                            </button>
                            <button type="button" data-item-id="${item.id}" class="item-purchase-btn text-sm px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600">
                                兑换
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // 使用原生的事件绑定方式，在渲染后绑定事件处理函数
    const detailBtns = document.querySelectorAll('.item-detail-btn');
    detailBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-item-id');
            console.log('点击详情按钮，商品ID:', itemId);
            showItemDetail(itemId);
        });
    });
    
    const purchaseBtns = document.querySelectorAll('.item-purchase-btn');
    purchaseBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-item-id');
            console.log('点击兑换按钮，商品ID:', itemId);
            showPurchaseConfirmation(itemId);
        });
    });
    
    // 如果处于管理模式，绑定编辑按钮事件
    if (isAdminMode) {
        const editBtns = document.querySelectorAll('.item-edit-btn');
        editBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-item-id');
                console.log('点击编辑按钮，商品ID:', itemId);
                showItemForm(itemId);
            });
        });
    }
}

// 获取过滤和排序后的商品
function getFilteredAndSortedItems() {
    // 确保shopItems存在
    if (!Array.isArray(shopItems)) {
        console.error('shopItems不是数组或不存在');
        return [];
    }
    
    // 获取当前搜索关键词
    const searchInput = document.getElementById('shopSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    // 获取当前排序方式
    const sortSelect = document.getElementById('shopSort');
    const sortMethod = sortSelect ? sortSelect.value : 'priceAsc';
    
    // 过滤商品
    let filtered = [...shopItems];
    
    // 应用搜索过滤
    if (searchTerm) {
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(searchTerm) || 
            item.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // 应用当前的分类过滤器
    if (window.currentShopFilter && window.currentShopFilter !== 'all') {
        if (window.currentShopFilter === 'limited') {
            filtered = filtered.filter(item => item.availableUntil);
        } else if (window.currentShopFilter === 'discount') {
            filtered = filtered.filter(item => item.discountRate < 1);
        }
    }
    
    // 应用排序
    if (sortMethod === 'priceAsc') {
        filtered.sort((a, b) => (a.price * a.discountRate) - (b.price * b.discountRate));
    } else if (sortMethod === 'priceDesc') {
        filtered.sort((a, b) => (b.price * b.discountRate) - (a.price * a.discountRate));
    } else if (sortMethod === 'newest') {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    return filtered;
}

// 处理商品搜索
function handleShopSearch() {
    renderShopItems();
}

// 处理商品排序
function handleShopSort() {
    renderShopItems();
}

// 过滤商品类别
function filterShopItems(category) {
    // 更新所有分类按钮样式
    const buttons = document.querySelectorAll('.shop-categories button');
    buttons.forEach(btn => {
        btn.classList.remove('bg-blue-50', 'text-blue-700', 'font-medium');
        btn.classList.add('hover:bg-gray-100');
    });
    
    // 高亮当前选中的分类
    const currentButton = document.querySelector(`.shop-categories button[onclick*="filterShopItems('${category}')"]`);
    if (currentButton) {
        currentButton.classList.add('bg-blue-50', 'text-blue-700', 'font-medium');
        currentButton.classList.remove('hover:bg-gray-100');
    }
    
    // 保存当前过滤器
    window.currentShopFilter = category;
    
    // 重新渲染商品
    renderShopItems();
}

// 显示商品详情
function showItemDetail(itemId) {
    const item = shopItems.find(item => item.id === itemId);
    if (!item) {
        console.error('找不到商品:', itemId);
        return;
    }
    
    const actualPrice = Math.round(item.price * item.discountRate * 10) / 10;
    const hasDiscount = item.discountRate < 1;
    
    // 填充商品详情
    const detailContent = document.getElementById('itemDetailContent');
    detailContent.innerHTML = `
        <div class="flex justify-between items-start">
            <h2 class="text-xl font-bold">${item.name}</h2>
            <button type="button" id="closeDetailBtn" class="text-gray-500 hover:text-gray-700">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
        
        <div class="mt-4 pb-4 border-b">
            <div class="flex items-baseline mb-2">
                ${hasDiscount ? `
                    <span class="text-2xl font-bold text-red-600">${actualPrice} 积分</span>
                    <span class="ml-2 text-gray-500 line-through">${item.price} 积分</span>
                    <span class="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">${Math.round(item.discountRate*100)/10}折</span>
                ` : `
                    <span class="text-2xl font-bold text-gray-900">${item.price} 积分</span>
                `}
            </div>
            
            <div class="flex flex-wrap gap-2 mt-2">
                ${item.isLimited ? `<span class="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded">限量商品</span>` : ''}
                ${hasDiscount ? `<span class="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">特惠中</span>` : ''}
            </div>
            
            <div class="mt-4">
                <h3 class="text-lg font-medium mb-2">商品详情</h3>
                <p class="text-gray-600">${item.description}</p>
            </div>
            
            <div class="mt-4 space-y-2">
                ${item.availableUntil ? `
                    <div class="flex items-center text-sm">
                        <svg class="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>有效期至: ${new Date(item.availableUntil).toLocaleDateString()}</span>
                    </div>
                ` : ''}
                
                ${hasDiscount && item.discountEndDate ? `
                    <div class="flex items-center text-sm">
                        <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>折扣截止: ${new Date(item.discountEndDate).toLocaleDateString()}</span>
                    </div>
                ` : ''}
                
                <div class="flex items-center text-sm">
                    <svg class="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>上架时间: ${new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
        
        <div class="mt-4 flex justify-end">
            <button type="button" id="backFromDetailBtn" class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 mr-2">
                返回
            </button>
            <button type="button" id="purchaseFromDetailBtn" data-item-id="${item.id}" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700">
                立即兑换
            </button>
        </div>
    `;
    
    // 原生方式绑定事件
    setTimeout(() => {
        document.getElementById('closeDetailBtn').addEventListener('click', hideItemDetail);
        document.getElementById('backFromDetailBtn').addEventListener('click', hideItemDetail);
        
        document.getElementById('purchaseFromDetailBtn').addEventListener('click', function() {
            const itemId = this.getAttribute('data-item-id');
            hideItemDetail();
            showPurchaseConfirmation(itemId);
        });
    }, 10);
    
    // 显示详情模态框
    const modal = document.getElementById('itemDetailModal');
    modal.classList.add('show');
}

// 隐藏商品详情
function hideItemDetail() {
    const modal = document.getElementById('itemDetailModal');
    modal.classList.remove('show');
}

// 显示购买确认
function showPurchaseConfirmation(itemId) {
    console.log('显示购买确认，商品ID:', itemId);
    
    const item = shopItems.find(item => item.id === itemId);
    if (!item) {
        console.error('找不到商品:', itemId);
        return;
    }
    
    const group = appState.groups.find(g => g.id === currentShopGroupId);
    if (!group) {
        alert('找不到当前小组！');
        return;
    }
    
    const actualPrice = Math.round(item.price * item.discountRate * 10) / 10;
    
    // 检查积分是否足够
    if (group.remainingScore < actualPrice) {
        alert(`积分不足！需要 ${actualPrice} 积分，当前仅有 ${group.remainingScore.toFixed(2)} 积分。`);
        return;
    }
    
    try {
        // 获取模态框
        let modal = document.getElementById('purchaseConfirmModal');
        
        // 如果模态框不存在或出现问题，重新创建一个
        if (!modal || !document.getElementById('purchaseItemName') || !document.getElementById('purchaseItemPrice') || !document.getElementById('purchaseItemDesc')) {
            console.log('购买确认模态框元素缺失，重新创建');
            
            // 如果模态框存在但有问题，先移除它
            if (modal) {
                modal.remove();
            }
            
            // 创建新的模态框
            modal = document.createElement('div');
            modal.id = 'purchaseConfirmModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-md w-full m-auto">
                    <div class="text-center mb-4">
                        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900" id="purchaseItemName">确认购买</h3>
                        <div class="mt-2">
                            <p class="text-sm text-gray-500" id="purchaseItemDesc">
                                您确定要使用 <span id="purchaseItemPrice" class="font-bold text-red-600">0</span> 积分购买此商品吗？
                            </p>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-4">
                        <button type="button" id="cancelPurchaseBtn" class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                            取消
                        </button>
                        <button type="button" id="confirmPurchaseBtn" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                            确认购买
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }
        
        // 确保模态框存在后，再进行下一步操作
        const nameElement = document.getElementById('purchaseItemName');
        const priceElement = document.getElementById('purchaseItemPrice');
        const descElement = document.getElementById('purchaseItemDesc');
        
        // 再次检查元素是否存在
        if (!nameElement || !priceElement || !descElement) {
            throw new Error('购买确认模态框元素仍然无法找到，可能存在DOM结构问题');
        }
        
        // 填充确认信息
        nameElement.textContent = `确认购买: ${item.name}`;
        priceElement.textContent = actualPrice;
        descElement.innerHTML = `
            您确定要使用 <span class="font-bold text-red-600">${actualPrice}</span> 积分购买此商品吗？
            <div class="mt-2 p-2 bg-gray-50 rounded text-xs">
                ${item.description}
            </div>
        `;
        
        // 获取按钮
        const cancelBtn = document.getElementById('cancelPurchaseBtn');
        const confirmBtn = document.getElementById('confirmPurchaseBtn');
        
        if (!cancelBtn || !confirmBtn) {
            throw new Error('无法找到确认或取消按钮');
        }
        
        // 先移除所有已存在的事件监听器
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newConfirmBtn = confirmBtn.cloneNode(true);
        
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // 绑定新的事件监听器
        newCancelBtn.addEventListener('click', function() {
            console.log('取消购买');
            modal.classList.remove('show');
        });
        
        // 使用闭包保留变量
        newConfirmBtn.addEventListener('click', function() {
            console.log('确认购买', itemId, actualPrice);
            // 关闭模态框
            modal.classList.remove('show');
            // 然后处理购买
            setTimeout(() => {
                processPurchase(itemId, actualPrice);
            }, 50);
        });
        
        // 显示模态框
        modal.classList.add('show');
        console.log('购买确认模态框已显示');
    } catch (error) {
        console.error('显示购买确认模态框时出错:', error);
        alert('处理购买请求时出错: ' + error.message);
    }
}

// 初始化appState，如果它为null或undefined
function initializeAppState() {
    if (!appState) {
        console.warn('appState不存在，正在重新初始化');
        appState = {
            groups: [],
            scoreRecords: [],
            exchangeRecords: [],
            selectedStudents: []
        };
        
        // 尝试从localStorage加载数据
        try {
            const savedData = loadData();
            if (savedData) {
                appState = savedData;
                console.log('已从本地存储恢复appState');
            }
        } catch (error) {
            console.error('恢复appState时出错:', error);
        }
    }
    
    // 确保appState具有所有必要的属性
    if (!appState.groups) appState.groups = [];
    if (!appState.scoreRecords) appState.scoreRecords = [];
    if (!appState.exchangeRecords) appState.exchangeRecords = [];
    if (!appState.selectedStudents) appState.selectedStudents = [];
    
    return appState;
}

// 处理购买流程
function processPurchase(itemId, price) {
    console.log('处理购买，商品ID:', itemId, '价格:', price);
    
    // 确保appState被正确初始化
    initializeAppState();
    
    // 检查商品是否存在
    const item = shopItems.find(item => item.id === itemId);
    if (!item) {
        console.error('找不到商品:', itemId);
        alert('找不到所选商品，可能已下架');
        return;
    }
    
    // 确保appState.groups存在
    if (!Array.isArray(appState.groups)) {
        console.error('appState.groups不是数组或不存在');
        alert('小组数据加载失败，请刷新页面后重试');
        return;
    }
    
    // 检查当前小组ID和小组对象
    if (!currentShopGroupId) {
        console.error('未找到当前小组ID');
        alert('请先选择一个小组');
        return;
    }
    
    const group = appState.groups.find(g => g.id === currentShopGroupId);
    if (!group) {
        console.error('找不到当前小组:', currentShopGroupId);
        alert('找不到当前小组，请重新选择');
        return;
    }
    
    // 检查remainingScore属性是否存在且为数字
    if (typeof group.remainingScore !== 'number') {
        console.error('小组剩余积分不是有效数值:', group.remainingScore);
        alert('小组积分数据错误，请刷新页面后重试');
        return;
    }
    
    // 再次检查积分是否足够
    if (group.remainingScore < price) {
        alert(`积分不足！需要 ${price} 积分，当前仅有 ${group.remainingScore.toFixed(2)} 积分。`);
        return;
    }
    
    try {
        // 创建兑换记录
        const newExchangeRecord = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            groupId: currentShopGroupId,
            points: price,
            item: item.name,
            description: `兑换商品: ${item.name}`
        };
        
        // 更新小组剩余积分 - 确保使用深拷贝防止潜在引用问题
        const updatedGroups = appState.groups.map(g => {
            if (g.id === currentShopGroupId) {
                return {
                    ...g,
                    remainingScore: g.remainingScore - price
                };
            }
            return {...g}; // 返回其他组的深拷贝
        });
        
        // 确保appState所有必要属性都存在
        const updatedAppState = {
            groups: updatedGroups,
            scoreRecords: Array.isArray(appState.scoreRecords) ? [...appState.scoreRecords] : [],
            exchangeRecords: Array.isArray(appState.exchangeRecords) ? [...appState.exchangeRecords, newExchangeRecord] : [newExchangeRecord],
            selectedStudents: Array.isArray(appState.selectedStudents) ? [...appState.selectedStudents] : []
        };
        
        // 更新应用状态 - 完全替换
        appState = updatedAppState;
        
        console.log('已更新appState', appState);
        
        // 保存更新后的状态
        try {
            saveData(appState);
        } catch (saveError) {
            console.error('保存数据时出错:', saveError);
            alert('保存数据失败，但兑换操作已完成。下次启动可能不会保留此次兑换记录。');
        }
        
        // 更新可用积分显示
        updateAvailableScore();
        
        // 重新渲染商品列表，更新UI状态
        renderShopItems();
        
        // 更新小组卡片显示
        updateGroupDisplay();
        
        // 显示成功提示
        showPurchaseSuccess(item);
        
        console.log('购买完成，交易成功');
    } catch (error) {
        console.error('购买处理过程中出错:', error);
        alert('购买过程中出错: ' + error.message);
    }
}

// 更新小组卡片显示
function updateGroupDisplay() {
    try {
        // 确保appState被正确初始化
        initializeAppState();
        
        // 检查是否有renderGroups函数（在ui.js中定义）
        if (typeof renderGroups === 'function') {
            try {
                renderGroups(appState.groups);
                return;
            } catch (error) {
                console.error('调用renderGroups函数时出错:', error);
            }
        } else {
            console.log('renderGroups函数不可用，尝试替代方法更新小组卡片显示');
        }
        
        // 如果renderGroups不存在或失败，尝试手动更新
        if (!currentShopGroupId) return;
        
        try {
            // 尝试查找并更新当前小组的分数显示
            const groupElement = document.querySelector(`[data-group-id="${currentShopGroupId}"]`);
            if (!groupElement) {
                console.log('找不到小组元素，无法更新显示');
                return;
            }
            
            const scoreElement = groupElement.querySelector('.group-remaining-score');
            if (!scoreElement) {
                console.log('找不到积分元素，无法更新显示');
                return;
            }
            
            const group = appState.groups.find(g => g.id === currentShopGroupId);
            if (!group) {
                console.log('找不到当前小组数据，无法更新显示');
                return;
            }
            
            const remainingScore = typeof group.remainingScore === 'number' ? group.remainingScore : 0;
            scoreElement.textContent = `剩余积分: ${remainingScore.toFixed(2)}`;
        } catch (e) {
            console.error('尝试手动更新小组卡片时出错:', e);
        }
    } catch (error) {
        console.error('更新小组卡片显示时出错:', error);
    }
}

// 显示购买成功提示
function showPurchaseSuccess(item) {
    // 创建一个临时提示框
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50 animate-fade-in-up';
    toast.style.animationDuration = '0.5s';
    toast.innerHTML = `
        <div class="flex items-center">
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <div>
                <p class="font-bold">兑换成功！</p>
                <p class="text-sm">已成功兑换: ${item.name}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // 3秒后移除提示框
    setTimeout(() => {
        toast.style.animation = 'fade-out 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// 当页面加载完成时，尝试加载商品数据
document.addEventListener('DOMContentLoaded', function() {
    loadShopItems();
});

// 显示独立的商品管理界面
function showShopAdmin() {
    console.log('显示商品管理界面');
    
    // 加载商品数据
    loadShopItems();
    
    // 创建管理界面模态框
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'shopAdminModal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-5xl w-full m-auto max-h-[85vh] overflow-hidden flex flex-col">
            <div class="flex justify-between items-center mb-4 pb-3 border-b">
                <div class="flex items-center">
                    <svg class="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <h2 class="text-xl font-bold">商品管理</h2>
                </div>
                <div class="flex items-center">
                    <button id="addNewProductBtn" class="mr-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        <span>添加商品</span>
                    </button>
                    <button id="closeShopAdminBtn" class="text-gray-500 hover:text-gray-700 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="flex-1 overflow-y-auto">
                <table class="min-w-full bg-white">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价格</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                    <tbody id="adminProductsList" class="divide-y divide-gray-200">
                        <!-- 商品数据会动态加载 -->
                    </tbody>
                </table>
                
                <div id="emptyProductsMessage" class="py-8 text-center text-gray-500 hidden">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">暂无商品</h3>
                    <p class="mt-1 text-sm text-gray-500">点击添加商品按钮创建第一个商品</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定事件
    document.getElementById('closeShopAdminBtn').addEventListener('click', function() {
        modal.remove();
    });
    
    document.getElementById('addNewProductBtn').addEventListener('click', function() {
        showItemForm();
    });
    
    // 显示所有商品
    renderAdminProducts();
}

// 渲染管理界面中的商品列表
function renderAdminProducts() {
    const tableBody = document.getElementById('adminProductsList');
    const emptyMessage = document.getElementById('emptyProductsMessage');
    
    if (!tableBody || !emptyMessage) return;
    
    if (shopItems.length === 0) {
        tableBody.innerHTML = '';
        emptyMessage.classList.remove('hidden');
        return;
    }
    
    emptyMessage.classList.add('hidden');
    
    // 对商品排序，按创建时间降序
    const sortedItems = [...shopItems].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    tableBody.innerHTML = sortedItems.map(item => {
        const actualPrice = Math.round(item.price * item.discountRate * 10) / 10;
        const hasDiscount = item.discountRate < 1;
        
        // 商品状态标签
        let statusLabel = '';
        
        if (item.isLimited) {
            statusLabel += `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-1">限量</span>`;
        }
        
        if (hasDiscount) {
            statusLabel += `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-1">${Math.round(item.discountRate*100)/10}折</span>`;
        }
        
        if (item.availableUntil) {
            const daysLeft = Math.ceil((new Date(item.availableUntil).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
            if (daysLeft <= 7) {
                statusLabel += `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">剩${daysLeft}天</span>`;
            }
        }
        
        if (statusLabel === '') {
            statusLabel = '<span class="text-gray-500">-</span>';
        }
        
        // 分类标签
        let categoryName = '';
        switch(item.category) {
            case 'basic': categoryName = '基础商品'; break;
            case 'reward': categoryName = '奖励商品'; break;
            case 'premium': categoryName = '高级商品'; break;
            case 'special': categoryName = '特殊商品'; break;
            default: categoryName = item.category;
        }
        
        return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.name}</td>
                <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">${item.description}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${hasDiscount ? 
                        `<span class="text-red-600 font-medium">${actualPrice}</span> <span class="line-through">${item.price}</span>` : 
                        item.price
                    }
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${categoryName}</td>
                <td class="px-6 py-4 whitespace-nowrap">${statusLabel}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button data-item-id="${item.id}" class="admin-edit-btn text-blue-600 hover:text-blue-900 mr-2">编辑</button>
                    <button data-item-id="${item.id}" class="admin-delete-btn text-red-600 hover:text-red-900">删除</button>
                </td>
            </tr>
        `;
    }).join('');
    
    // 绑定编辑和删除按钮事件
    document.querySelectorAll('.admin-edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-item-id');
            showItemForm(itemId);
        });
    });
    
    document.querySelectorAll('.admin-delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-item-id');
            if (confirm('确定要删除此商品吗？此操作不可撤销。')) {
                deleteItem(itemId);
                renderAdminProducts(); // 重新渲染管理界面
            }
        });
    });
} 