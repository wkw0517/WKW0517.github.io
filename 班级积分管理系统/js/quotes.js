// 名言、诗词和数学知识点数据
const quotesData = {
    // 学习相关名言、名诗词、名句
    "learning": [
        "学而不思则罔，思而不学则殆。",
        "业精于勤，荒于嬉；行成于思，毁于随。",
        "书山有路勤为径，学海无涯苦作舟。",
        "立身以立学为先，立学以读书为本。",
        "读书百遍，其义自现。",
        "万般皆下品，唯有读书高。",
        "读书破万卷，下笔如有神。",
        "三更灯火五更鸡，正是男儿读书时。",
        "少年易学老难成，一寸光阴不可轻。",
        "莫等闲，白了少年头，空悲切。",
        "业精于勤，荒于嬉。",
        "知识如海洋，愈探愈深邃。",
        "青春须早为，岂能长少年。",
        "不积跬步，无以至千里。",
        "不积细流，无以成江海。",
        "锲而舍之，朽木不折；锲而不舍，金石可镂。",
        "饱食终日，无所用心，难矣哉！",
        "玉不琢，不成器；人不学，不知义。",
        "学而时习之，不亦说乎？",
        "温故而知新，可以为师矣。",
        "知之者不如好之者，好之者不如乐之者。",
        "三人行，必有我师焉。择其善者而从之。",
        "敏而好学，不耻下问。",
        "知不足者好学，耻下问者自满。",
        "好学近乎知，力行近乎仁。",
        "读书有三到：心到、眼到、口到。",
        "志不强者智不达，言不信者行不果。",
        "发奋识遍天下字，立志读尽人间书。",
        "书到用时方恨少，事非经过不知难。",
        "问渠那得清如许，为有源头活水来。",
        "纸上得来终觉浅，绝知此事要躬行。",
        "熟读唐诗三百首，不会作诗也会吟。",
        "鸟欲高飞先振翅，人求上进先读书。",
        "立志欲坚不欲锐，成功在久不在速。",
        "博观而约取，厚积而薄发。",
        "宝剑锋从磨砺出，梅花香自苦寒来。",
        "天才就是百分之九十九的汗水加百分之一的灵感。",
        "学而不厌，诲人不倦。",
        "知之为知之，不知为不知，是知也。",
        "博学而笃志，切问而近思。",
        "学者如登山焉，动而益高，如寤寐焉，久而益足。",
        "见贤思齐焉，见不贤而内自省也。",
        "吾日三省吾身：为人谋而不忠乎？与朋友交而不信乎？",
        "学如逆水行舟，不进则退。",
        "勤能补拙是良训，一分辛苦一分才。",
        "不飞则已，一飞冲天；不鸣则已，一鸣惊人。",
        "旧书不厌百回读，熟读精思子自知。",
        "书卷多情似故人，晨昏忧乐每相亲。",
        "读书之法，在循序而渐进，熟读而精思。",
        "聪明在于勤奋，天才在于积累。",
        "读万卷书，行万里路。",
        "知识犹如人体血液，不但需要新鲜补充，还需常常修整。",
        "行是知之始，知是行之成。",
        "学贵有疑，小疑则小进，大疑则大进。",
        "不登高山，不知天之高也；不临深溪，不知地之厚也。",
        "读书不觉已春深，一寸光阴一寸金。",
        "一日不读书，胸臆无佳想；一月不读书，耳目失精爽。",
        "十年磨一剑，霜刃未曾试。",
        "衣带渐宽终不悔，为伊消得人憔悴。",
        "春蚕到死丝方尽，蜡炬成灰泪始干。",
        "天生我材必有用，千金散尽还复来。",
        "盛年不重来，一日难再晨，及时当勉励，岁月不待人。",
        "人生自古谁无死，留取丹心照汗青。",
        "会当凌绝顶，一览众山小。",
        "路漫漫其修远兮，吾将上下而求索。",
        "天行健，君子以自强不息。",
        "地势坤，君子以厚德载物。",
        "非学无以广才，非志无以成学。",
        "学者如井中汲水，汲深致深，汲浅致浅。",
        "静以修身，俭以养德，非淡泊无以明志，非宁静无以致远。",
        "吾尝终日而思矣，不如须臾之所学也。",
        "奇文共欣赏，疑义相与析。",
        "学然后知不足，教然后知困。",
        "知识欲多深，须学其必博；思虑欲精通，须学其必专。",
        "勿以恶小而为之，勿以善小而不为。",
        "工欲善其事，必先利其器。",
        "凿壁借光，映雪读书。",
        "悬梁刺股，闻鸡起舞。",
        "读书破万卷，胸中无适主，便如暴富儿，颇为用钱苦。",
        "士志于道，而耻恶衣恶食者，未足与议也。",
        "学不可以已。青，取之于蓝，而青于蓝。",
        "读书志在圣贤，为官心存君国。",
        "纸上谈兵终觉浅，绝知此事要躬行。",
        "欲穷千里目，更上一层楼。",
        "旧时王谢堂前燕，飞入寻常百姓家。",
        "读书不知味，不如束高阁；蠢鱼尔何如，终日食糟粕。",
        "授人以鱼不如授人以渔。",
        "不迁怒，不贰过。",
        "夫学须志也，才须学也，非学无以广才，非志无以成学。",
        "好学而不贰，则巧知而不惑。",
        "夫君子之行，静以修身，俭以养德。",
        "君子坦荡荡，小人长戚戚。",
        "良药苦口利于病，忠言逆耳利于行。",
        "海纳百川，有容乃大；壁立千仞，无欲则刚。",
        "操千曲而后晓声，观千剑而后识器。",
        "青，取之于蓝，而青于蓝；冰，水为之，而寒于水。",
        "知不可乎骤得，功不可乎速成。"
    ],
    
    // 与学习和数学相关的名句
    "mathGrade7": [
        "数学是科学的女王，算术是数学的女王。——高斯",
        "数学是打开科学大门的钥匙。——培根",
        "几何使人明察，代数使人精确。——牛顿",
        "数学是一种思维方式，一种生活态度。——华罗庚",
        "数学是训练思维的最佳途径。——欧拉",
        "数学是逻辑的艺术，逻辑是数学的灵魂。——罗素",
        "数学的本质在于它的自由。——康托尔",
        "数学是所有科学中最美丽、最强大的分支。——傅里叶",
        "没有数学，就看不透事物的内在联系。——培根",
        "数学是一门独立的语言。——吉布斯",
        "数学的魅力在于简洁和和谐。——庞加莱",
        "数学是无穷的科学。——黎曼",
        "逻辑和数学是同义词。——罗素",
        "数学是人类理性的最高成就。——莱布尼茨",
        "数学是人类智慧的体操。——洛巴切夫斯基",
        "数学是一种理性的艺术。——赫尔曼·外尔",
        "数学永远不会使人失望。——希尔伯特",
        "数学的本质是自由。——康托尔",
        "数学是关于秩序的最纯粹形式。——哈代",
        "数学是探索宇宙的语言。——伽利略",
        "数学是一种精确而简洁的思想。——笛卡尔",
        "数学是一切科学之母。——高斯",
        "掌握了数学就掌握了通向一切科学的道路。——笛卡尔",
        "数学是科学语言的精华。——拉格朗日",
        "数学是开启一切科学大门的钥匙。——林肯",
        "数学是一切确定性的源泉。——爱因斯坦",
        "数学给科学带来确定性。——培根",
        "数学是理性的最高表现。——莱布尼茨",
        "数学是理性思维的训练。——柏拉图",
        "数学的构思是宇宙的构思。——雨果",
        "只有数学才具备完美的逻辑性。——爱因斯坦",
        "数学是科学和哲学的交汇点。——道布勒",
        "数学与哲学是人类认识的两种途径。——爱因斯坦",
        "逻辑是数学的骨骼。——罗素",
        "统计学是数学的心脏。——盖尔顿",
        "代数是智力的体操。——拉格朗日",
        "数学是一切深度思考的基础。——牛顿",
        "数学是抽象思维的艺术。——希尔伯特",
        "数学是科学大厦的基石。——华罗庚",
        "数学是人类已有的最伟大发明。——达芬奇",
        "数学是探索真理的灯塔。——普朗克",
        "数学是真理的闪光。——普朗克",
        "数学的美在于简洁与精确。——吉布斯",
        "数学与音乐是表达宇宙和谐的方式。——莱布尼茨",
        "学会珍惜知识，它能改变你的命运。",
        "学习之心不可无，懒惰之心不可有。",
        "学习的敌人是自己的满足，要教育自己永不满足。",
        "古今之成大事者，不惟有超世之才，亦必有坚忍不拔之志。",
        "学习是在众人都睡觉时你仍然在走路。",
        "阅读使人充实，思考使人深邃，交谈使人清醒。",
        "求学的三个条件：多观察，多吃苦，多研究。",
        "学而不思则罔，思而不学则殆。",
        "学习永远不晚，学习贵在坚持。",
        "不经一番寒彻骨，怎得梅花扑鼻香。",
        "好记性不如烂笔头，勤能补拙是良训。",
        "知识像烛光，能照亮一个人，也能照亮无数人。",
        "学习的最好方法是理解而不是记忆。",
        "书到用时方恨少，事非经过不知难。",
        "读万卷书，行万里路，胸中脱去尘浊。",
        "天才是百分之一的灵感加百分之九十九的汗水。",
        "学问勤中得，富裕俭中来。",
        "求学犹掘井，井愈深，水愈清。",
        "好读书，不求甚解；每有会意，便欣然忘食。",
        "读书破万卷，下笔如有神。",
        "立志宜思真品格，读书须尽苦功夫。",
        "立志是事业的大门，工作是登门入室的旅程。",
        "天下无难事，只怕有心人。",
        "业精于勤，荒于嬉；行成于思，毁于随。",
        "学习是一个缓慢的过程，应当用毅力去坚持它。",
        "成功=艰苦劳动+正确方法+少谈空话。",
        "读书贵精不贵多，读书贵思不贵记。",
        "少壮不努力，老大徒伤悲。",
        "学习永远不要惧怕失败和挫折。",
        "好问的人，只做了五分种的愚人。",
        "不登高山，不知天之高也；不临深溪，不知地之厚也。",
        "对科学家来说，不可逾越的界限就是永无止境。",
        "你的课本里有黄金屋，有颜如玉。",
        "迷茫时，行动是最好的解药。",
        "再长的路，一步步也能走完；再短的路，不迈开双脚也无法到达。",
        "困难与折磨对于人来说，是一把打向坯料的锤，打掉的应是脆弱的铁屑。",
        "读书是易事，思索是难事，但两者缺一，便全无用处。",
        "与其战胜敌人一百次，不如战胜自己一次。",
        "没有所谓失败，只有暂时停止成功。",
        "拼搏让梦想走得更远，奋斗让生命更加光彩。",
        "不积跬步，无以至千里；不积小流，无以成江海。",
        "做一个有思想，有主见，有毅力的人。",
        "求知的道路，就是不断质疑的过程。",
        "质疑是解决问题的重要途径。",
        "勤奋是你生命的密码，能译出你一部壮丽的史诗。",
        "用理想指导奋斗，用汗水浇灌梦想。",
        "静坐常思己过，闲谈莫论人非。",
        "认真做好每一件小事，收获一份大成就。",
        "学习中长大，长大中学习。",
        "失败只是暂时停止成功，坚持就是胜利。",
        "学问学问，又学又问才能成为学问。",
        "真正的知识是永远不会拥有的，只能发现，或透过一生来寻找。",
        "有志者事竟成。"
    ]
}; 

// 名言显示和管理功能

// 名言容器HTML
const quoteContainerHTML = `
<div id="quoteDisplayContainer" class="quote-display-container">
    <div class="particles" id="quoteParticles"></div>
    <div class="quote-display">
        <div class="quote-category" id="quoteCategory"></div>
        <div class="quote-text" id="quoteText"></div>
        <div class="quote-type" id="quoteType"></div>
        <button class="close-quote" onclick="hideQuote()">关闭</button>
    </div>
</div>
`;

// 初始化名言功能
function initQuotes() {
    // 将容器添加到body
    document.body.insertAdjacentHTML('beforeend', quoteContainerHTML);
    
    // 添加点击事件监听
    document.getElementById('quoteDisplayContainer').addEventListener('click', function(e) {
        if (e.target === this) {
            hideQuote();
        }
    });
}

// 获取随机名言
function getRandomQuote() {
    // 随机选择一个类别
    const categories = Object.keys(quotesData);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    // 从选中的类别中随机选择一条名言
    const quotes = quotesData[randomCategory];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    return {
        text: randomQuote,
        category: randomCategory
    };
}

// 显示名言
function showRandomQuote() {
    const quote = getRandomQuote();
    
    // 设置类别显示文本
    let categoryText = '';
    switch(quote.category) {
        case 'learning':
            categoryText = '学习名言';
            break;
        case 'mathGrade7':
            categoryText = '数学名言';
            break;
    }
    
    // 更新DOM
    document.getElementById('quoteCategory').textContent = categoryText;
    document.getElementById('quoteText').textContent = quote.text;
    
    const quoteType = document.getElementById('quoteType');
    quoteType.textContent = categoryText;
    quoteType.className = 'quote-type type-' + quote.category;
    
    // 显示容器
    const container = document.getElementById('quoteDisplayContainer');
    container.classList.add('show');
    
    // 创建粒子效果
    createParticles();
}

// 隐藏名言
function hideQuote() {
    const container = document.getElementById('quoteDisplayContainer');
    container.classList.remove('show');
}

// 创建粒子效果
function createParticles() {
    const particlesContainer = document.getElementById('quoteParticles');
    particlesContainer.innerHTML = '';
    
    const colors = ['#ffcc00', '#ff6699', '#33ccff', '#99ff66', '#ff99cc', '#99ccff'];
    
    // 创建30-50个粒子
    const particleCount = Math.floor(Math.random() * 20) + 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // 随机位置
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // 随机大小
        const size = Math.random() * 8 + 4;
        
        // 随机颜色
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // 随机动画延迟
        const delay = Math.random() * 2;
        
        // 随机动画持续时间
        const duration = Math.random() * 2 + 2;
        
        // 设置样式
        particle.style.left = `${x}%`;
        particle.style.top = `${y}%`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.background = color;
        particle.style.boxShadow = `0 0 ${size}px ${color}`;
        particle.style.animation = `float-up ${duration}s linear ${delay}s infinite`;
        particle.style.opacity = '0.8';
        
        particlesContainer.appendChild(particle);
    }
}

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initQuotes();
}); 