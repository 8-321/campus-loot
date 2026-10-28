/* data.js — 所有演示数据集中在这里。
   隐私：不含真实姓名 / 学号 / 手机号 / 宿舍号 / 微信 / 邮箱 / 学校全称。
   换真实校园时，只改 CAMPUSES 里的 spots 与 SEED 即可。 */

const CAMPUSES = [
  {
    id: 'north',
    name: '北苑校区（演示）',
    short: '北苑',
    scope: '仅校内 · 免费 · 不收款',
    /* 假地点，集中在此，方便整块替换 */
    spots: [
      { id: 'canteen3', name: '三食堂 · 侧门', area: '生活区东' },
      { id: 'canteen2', name: '二食堂 · 一层', area: '生活区东' },
      { id: 'canteen1', name: '一食堂 · 水果档', area: '教学区南' },
      { id: 'lib2', name: '图书馆 · 二层还书处', area: '教学区中' },
      { id: 'teach7', name: '七号楼 · 一层大厅', area: '教学区北' },
      { id: 'teach4', name: '四号楼 · 走廊书架', area: '教学区西' },
      { id: 'studyroom', name: '自习室 · 门厅', area: '教学区中' },
      { id: 'hall', name: '小报告厅 · 门口', area: '教学区北' },
      { id: 'gate', name: '东门 · 快递架旁', area: '生活区北' },
      { id: 'court', name: '球场边 · 车棚', area: '生活区西' },
      { id: 'shop', name: '校内超市 · 后门', area: '生活区南' },
      { id: 'yard', name: '宿舍楼下 · 公告板', area: '生活区西' }
    ]
  }
];

const CATEGORIES = [
  { id: 'all', name: '全部', icon: 'M4 6h16M4 12h16M4 18h10' },
  { id: 'food', name: '吃的', icon: 'M3 12h18a9 9 0 0 1-18 0zM8 9c0-2 1-2.5 1-4M13 9c0-2 1-2.5 1-4' },
  { id: 'book', name: '教材', icon: 'M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM8 8h6M8 12h6' },
  { id: 'seat', name: '名额', icon: 'M3 8h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM9 8v8' },
  { id: 'idle', name: '闲置', icon: 'M4 9l8-4 8 4v9l-8 4-8-4zM4 9l8 4 8-4M12 13v9' },
  { id: 'green', name: '绿植', icon: 'M4 20c0-9 6-14 15-14 0 9-6 14-15 14zM4 20l8-8' },
  { id: 'sup', name: '文具', icon: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3' }
];

/* 14 条种子：距离 60–1180m 分层，6 个分类，3 条 <30 分钟 */
const SEED = [
  { id: 's01', cat: 'food', title: '三食堂拼盘 · 三盘热菜', spot: 'canteen3', distance: 60,
    expiresInMin: 18, stock: 3, estValue: 18, photo: 'food-spread',
    owner: '匿名 · 生活区', desc: '打完没动过，一份拼盘三盘菜。自带饭盒，18:10 前到侧门拿，过点就倒掉了。' },

  { id: 's02', cat: 'food', title: '自选餐盒 · 米饭另装', spot: 'canteen2', distance: 85,
    expiresInMin: 26, stock: 1, estValue: 16, photo: 'grain-bowl',
    owner: '匿名 · 二食堂帮厨', desc: '闭餐前最后一份，菜是刚盛的。校内自取，不收款，也不用说谢谢。' },

  { id: 's03', cat: 'food', title: '蔬菜沙拉碗 · 两份', spot: 'canteen1', distance: 110,
    expiresInMin: 95, stock: 2, estValue: 14, photo: 'salad-bowl',
    owner: '匿名 · 水果档', desc: '今日现做，冷藏柜里剩两份。晚餐前拿走，带个保温袋更好。' },

  { id: 's04', cat: 'book', title: '考研数学全套 · 九成新', spot: 'lib2', distance: 170,
    expiresInMin: 2880, stock: 1, estValue: 120, photo: 'textbooks-stack',
    owner: '匿名 · 四号楼', desc: '讲义 + 习题册共 9 本，几乎没有划线。放还书处台面上，拿走前在群里说一声。' },

  { id: 's05', cat: 'book', title: '商科原版教材 4 本', spot: 'teach4', distance: 230,
    expiresInMin: 10080, stock: 4, estValue: 90, photo: 'textbooks-used',
    owner: '匿名 · 交换生', desc: '英文原版，边角有笔记。一次拿一本也行，留言说清哪班要用的。' },

  { id: 's06', cat: 'book', title: '专业课手写笔记 3 本', spot: 'teach7', distance: 290,
    expiresInMin: 4320, stock: 3, estValue: 60, photo: 'notebook-handwritten',
    owner: '匿名 · 七号楼', desc: '一整学年的手写笔记，重点用方格纸标过。给真的会用的人。' },

  { id: 's07', cat: 'seat', title: '自习室固定座位 · 本周', spot: 'studyroom', distance: 340,
    expiresInMin: 1440, stock: 2, estValue: 0, photo: 'classroom-empty',
    owner: '匿名 · 自习室', desc: '本周整周的固定座位，我出差用不上。管理处登记后转给你，不收费。' },

  { id: 's08', cat: 'seat', title: '研讨室时段 · 今晚 19:00', spot: 'hall', distance: 420,
    expiresInMin: 480, stock: 1, estValue: 0, photo: 'lounge-chair',
    owner: '匿名 · 社团', desc: '两小时研讨室时段，四人间。组会临时取消，谁先要谁拿去用。' },

  { id: 's09', cat: 'idle', title: '通勤自行车 · 已换新', spot: 'court', distance: 480,
    expiresInMin: 2880, stock: 1, estValue: 260, photo: 'bicycle',
    owner: '匿名 · 车棚', desc: '骑了两年，链条刚上过油，锁一起给。自己带工具调一下座高就行。' },

  { id: 's10', cat: 'idle', title: '金属台灯 · 灯罩完好', spot: 'yard', distance: 560,
    expiresInMin: 1440, stock: 1, estValue: 80, photo: 'desk-lamp',
    owner: '匿名 · 宿舍楼下', desc: '搬家带不走，插电就能用。放在公告板下面的台阶上，自取。' },

  { id: 's11', cat: 'idle', title: '小书架 · 可拆走', spot: 'gate', distance: 680,
    expiresInMin: 4320, stock: 2, estValue: 45, photo: 'bookshelf',
    owner: '匿名 · 东门', desc: '两层的小书架，螺丝都在。快递架旁边，一个人能搬动。' },

  { id: 's12', cat: 'green', title: '多肉 · 连盆一起', spot: 'shop', distance: 780,
    expiresInMin: 2880, stock: 4, estValue: 12, photo: 'succulent-pot',
    owner: '匿名 · 超市后门', desc: '养了半年，长得太满要分盆。带个纸袋来装，土别撒在走廊。' },

  { id: 's13', cat: 'green', title: '换盆营养土 · 半袋', spot: 'yard', distance: 950,
    expiresInMin: 7200, stock: 1, estValue: 8, photo: 'soil-bag',
    owner: '匿名 · 阳台党', desc: '买多了，剩半袋。放在公告板下面，谁换盆谁拿。' },

  { id: 's14', cat: 'sup', title: '一盒中性笔 · 40 支', spot: 'canteen3', distance: 1180,
    expiresInMin: 60480, stock: 1, estValue: 6, photo: 'stationery-pen',
    owner: '匿名 · 班委', desc: '活动剩下的，0.5 黑笔 40 支。整盒拿走，别拆。' }
];

/* 发布表单里可选的图片（都是演示图，上线请换自有版权图） */
const PHOTO_CHOICES = [
  { photo: 'food-spread', label: '热菜 / 拼盘' },
  { photo: 'grain-bowl', label: '盒饭 / 主食' },
  { photo: 'textbooks-stack', label: '教材 / 书' },
  { photo: 'classroom-empty', label: '空间 / 座位' },
  { photo: 'desk-lamp', label: '电器 / 台灯' },
  { photo: 'succulent-pot', label: '绿植 / 盆栽' }
];
