/* =========================================================
   图标库 + 分类定义
   全部为内联 SVG（描边 1.7，圆角），零依赖
   ========================================================= */
(function () {
  var P = {
    /* 支出分类 */
    food:
      '<path d="M3 12h18a9 9 0 0 1-18 0z"/><path d="M7.6 3.2 10.2 10.6"/><path d="M11.6 3.2 12.6 10.6"/><path d="M16.2 10.4c0-2 1.6-3.6 3.6-3.6"/>',
    shop:
      '<circle cx="6.6" cy="19.2" r="1.6"/><circle cx="17.4" cy="19.2" r="1.6"/><path d="M2.8 4h2.3l2.6 10.4h9.6L19.6 7H6"/>',
    traffic:
      '<rect x="4.5" y="3.6" width="15" height="13" rx="3.2"/><path d="M4.5 10.2h15"/><path d="M8 16.6v2.4M16 16.6v2.4"/><circle cx="8.4" cy="13.2" r=".9" fill="currentColor" stroke="none"/><circle cx="15.6" cy="13.2" r=".9" fill="currentColor" stroke="none"/>',
    daily:
      '<path d="M4.4 8.4h15.2l-1.6 9.8a2.2 2.2 0 0 1-2.2 1.8H8.2a2.2 2.2 0 0 1-2.2-1.8z"/><path d="M8.6 8.4V6.2a3.4 3.4 0 0 1 6.8 0v2.2"/>',
    fun:
      '<rect x="2.6" y="7.6" width="18.8" height="8.8" rx="4.4"/><path d="M6.6 12h4M8.6 10v4"/><circle cx="16.4" cy="11" r=".95" fill="currentColor" stroke="none"/><circle cx="18.4" cy="13.4" r=".95" fill="currentColor" stroke="none"/>',
    study:
      '<path d="M4 5.4A2.4 2.4 0 0 1 6.4 3H20v15H6.4A2.4 2.4 0 0 0 4 20.4z"/><path d="M4 18.6V5.4"/><path d="M8.4 7.2h7.2"/>',
    medical:
      '<path d="M9.2 3.6h5.6v5.6h5.6v5.6h-5.6v5.6H9.2v-5.6H3.6V9.2h5.6z"/>',
    outfit:
      '<path d="M4.8 6.6 8.4 4.4a4 4 0 0 0 7.2 0l3.6 2.2-2.4 4-2.2-1.2v9.2a1.2 1.2 0 0 1-1.2 1.2H8.2a1.2 1.2 0 0 1-1.2-1.2v-9.2L4.8 10.6z"/>',
    social:
      '<path d="M20.6 11.4a8 8 0 0 1-11.6 7.2L4 20l1.4-5A8 8 0 1 1 20.6 11.4z"/><path d="M8.6 10.4h6.8M8.6 13.4h4.4"/>',
    beauty:
      '<path d="M12 3.4l1.9 5.2 5.2 1.9-5.2 1.9L12 17.6l-1.9-5.2-5.2-1.9 5.2-1.9z"/><path d="M17.6 16.4l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    family:
      '<circle cx="9" cy="7.6" r="3.1"/><path d="M3.4 20a5.6 5.6 0 0 1 11.2 0"/><circle cx="17.4" cy="10.4" r="2.3"/><path d="M14.6 20a4.2 4.2 0 0 1 7.4-2.6"/>',
    pet:
      '<circle cx="6.8" cy="9" r="1.9"/><circle cx="11.6" cy="6.4" r="2"/><circle cx="16.6" cy="8.8" r="1.9"/><path d="M11.9 11.2c3.4 0 6 2.5 6 4.8 0 1.8-1.6 2.8-3.3 2.8-1 0-1.8-.4-2.7-.4s-1.7.4-2.7.4C7.5 18.8 6 17.8 6 16c0-2.3 2.5-4.8 5.9-4.8z"/>',
    express:
      '<rect x="2.6" y="7" width="11" height="9.4" rx="1.8"/><path d="M13.6 10.4h3.9l2.9 3v3h-6.8"/><circle cx="6.4" cy="18.4" r="1.7"/><circle cx="16.8" cy="18.4" r="1.7"/>',
    travel:
      '<path d="M3.2 12.8 20.6 5l-7 17.4-2.9-7.1z"/><path d="M10.7 15.3 20.6 5"/>',
    rent:
      '<path d="M3.8 10.6 12 4l8.2 6.6"/><path d="M6.2 9.8v9.6h11.6V9.8"/><path d="M10 19.4v-4.6h4v4.6"/>',
    invest:
      '<path d="M4 20h16"/><rect x="5" y="12.6" width="3.4" height="5" rx="1.2"/><rect x="10.3" y="8.4" width="3.4" height="9.2" rx="1.2"/><rect x="15.6" y="10.4" width="3.4" height="7.2" rx="1.2"/>',
    transfer:
      '<path d="M3.6 8.4h15.2"/><path d="M15.4 5.2 18.8 8.4l-3.4 3.2"/><path d="M20.4 15.6H5.2"/><path d="M8.6 12.4 5.2 15.6l3.4 3.2"/>',
    lend:
      '<path d="M4.4 19.6h4l11-11-4-4-11 11z"/><path d="M13.4 6.6l4 4"/><path d="M15.6 4.4l4 4"/>',
    repay:
      '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20.4 4.2v4.2h-4.2"/>',
    other:
      '<circle cx="12" cy="12" r="8.6"/><circle cx="8.6" cy="12" r=".95" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r=".95" fill="currentColor" stroke="none"/><circle cx="15.4" cy="12" r=".95" fill="currentColor" stroke="none"/>',
    add:
      '<circle cx="12" cy="12" r="8.6"/><path d="M12 8.2v7.6M8.2 12h7.6"/>',

    /* 自定义分类可选图标 */
    coffee:
      '<path d="M4.2 8.6h12v6.2a4.6 4.6 0 0 1-4.6 4.6H8.8a4.6 4.6 0 0 1-4.6-4.6z"/><path d="M16.2 10.4h1.8a2.6 2.6 0 0 1 0 5.2h-1.8"/><path d="M4.6 21.4h13.4"/>',
    cake:
      '<path d="M4 20.4h16v-6.2a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z"/><path d="M4 16.6c1.6 1.4 3.2 1.4 4.8 0s3.2-1.4 4.8 0 3.2 1.4 4.8 0"/><path d="M12 12.2V8.6"/><circle cx="12" cy="6.8" r="1"/>',
    basket:
      '<path d="M3.6 9.4h16.8l-1.8 9.2a2.2 2.2 0 0 1-2.2 1.8H7.6a2.2 2.2 0 0 1-2.2-1.8z"/><path d="M8.4 9.4 10.6 3.6M15.6 9.4 13.4 3.6"/>',
    pill:
      '<g transform="rotate(-40 12 12)"><rect x="2.6" y="8.2" width="18.8" height="7.6" rx="3.8"/><path d="M12 8.2v7.6"/></g>',
    gym:
      '<path d="M4 9.4v5.2M7.4 7.4v9.2M16.6 7.4v9.2M20 9.4v5.2M7.4 12h9.2"/>',
    music:
      '<circle cx="7" cy="17.4" r="2.4"/><circle cx="17.4" cy="15.4" r="2.4"/><path d="M9.4 17.4V7.6l10.4-2v9.8"/>',
    car:
      '<path d="M3.8 16.6v-3.4l1.9-4.8a2 2 0 0 1 1.9-1.3h8.8a2 2 0 0 1 1.9 1.3l1.9 4.8v3.4"/><path d="M3.8 16.6h16.4"/><circle cx="7.6" cy="17.8" r="1.8"/><circle cx="16.4" cy="17.8" r="1.8"/>',
    gift:
      '<rect x="3.4" y="9.2" width="17.2" height="11.2" rx="2"/><path d="M3.4 13.4h17.2M12 9.2v11.2"/><path d="M12 9.2S9.8 4 7.6 5s1 4.2 4.4 4.2zM12 9.2s2.2-5.2 4.4-4.2-1 4.2-4.4 4.2z"/>',
    phone:
      '<rect x="6.6" y="2.6" width="10.8" height="18.8" rx="2.6"/><path d="M10.8 18.6h2.4"/>',
    camera:
      '<rect x="3" y="7.8" width="18" height="12.2" rx="2.4"/><circle cx="12" cy="13.9" r="3.4"/><path d="M8.6 7.8 9.8 5.6h4.4l1.2 2.2"/>',
    wallet:
      '<path d="M4 7.6h13.8a2.2 2.2 0 0 1 2.2 2.2v8a2.2 2.2 0 0 1-2.2 2.2H5.8A2.2 2.2 0 0 1 3.6 17.8V6.4a2 2 0 0 1 2-2h10.2"/><path d="M20.2 11.6h-3.6a2.1 2.1 0 0 0 0 4.2h3.6"/>',
    star:
      '<path d="M12 3.8l2.4 5.1 5.6.8-4.1 3.9 1 5.6L12 16.6l-4.9 2.6 1-5.6-4.1-3.9 5.6-.8z"/>',
    heart:
      '<path d="M12 20.2S3.8 15.4 3.8 9.8a4.3 4.3 0 0 1 8.2-2 4.3 4.3 0 0 1 8.2 2c0 5.6-8.2 10.4-8.2 10.4z"/>',
    ticket:
      '<path d="M3.8 8.4h16.4v2.2a1.6 1.6 0 0 0 0 3.2v2.2H3.8v-2.2a1.6 1.6 0 0 0 0-3.2z"/><path d="M9.2 8.4v7.6" stroke-dasharray="2 2.4"/>',
    award:
      '<circle cx="12" cy="14.6" r="4.4"/><path d="M9.2 10.8 7.6 3.6h8.8l-1.6 7.2"/><path d="M12 12.6v4"/>',
    plant:
      '<path d="M12 20.6v-6"/><path d="M12 14.6c0-3.6 2.6-6.2 6.2-6.2 0 3.6-2.6 6.2-6.2 6.2z"/><path d="M12 14.6C12 11 9.4 8.4 5.8 8.4c0 3.6 2.6 6.2 6.2 6.2z"/>',

    /* 收入分类 */
    salary:
      '<path d="M3.4 20.4h17.2"/><path d="M5.6 20.4V9.8M18.4 20.4V9.8"/><path d="M3.4 9.8h17.2L12 3.6z"/><path d="M9.4 20.4v-4.6h5.2v4.6"/>',
    bonus:
      '<circle cx="12" cy="15.2" r="5.2"/><path d="M12 12.6v5.2M9.6 15.2h4.8"/><path d="M8.8 10.6 7 3.4M15.2 10.6 17 3.4"/>',
    redpacket:
      '<rect x="3.4" y="5.8" width="17.2" height="13.4" rx="2.6"/><path d="M3.8 7.2 12 13.2l8.2-6"/><path d="M12 13.2v6"/>',
    finance:
      '<ellipse cx="12" cy="6.6" rx="7.2" ry="2.8"/><path d="M4.8 6.6v10.8c0 1.5 3.2 2.8 7.2 2.8s7.2-1.3 7.2-2.8V6.6"/><path d="M4.8 12c0 1.5 3.2 2.8 7.2 2.8s7.2-1.3 7.2-2.8"/>',
    parttime:
      '<rect x="3" y="7.4" width="18" height="12.4" rx="2.6"/><path d="M8.8 7.4V5.6a2 2 0 0 1 2-2h2.4a2 2 0 0 1 2 2v1.8"/><path d="M3 12.6h18"/>',
    refund:
      '<path d="M3.8 12a8 8 0 1 0 2.6-5.9"/><path d="M3.4 4.6v4.4h4.4"/><path d="M9.4 12.4l2.4 2.4 4-4.4"/>',
    reimburse:
      '<path d="M6.4 3.4h11.2v17.2l-2.2-1.6-2.2 1.6-2.2-1.6-2.3 1.6-2.3-1.6z"/><path d="M9.6 8.4h4.8M9.6 12.4h4.8"/>',
    otherIn:
      '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.6v8.8M8.4 12.6 12 16.2l3.6-3.6"/>'
  };

  /* 分类：id / 名称 / 主色 / 图标 */
  var EXPENSE = [
    { id: 'food', name: '餐饮', color: '#f2916b' },
    { id: 'shop', name: '购物', color: '#6fa8f5' },
    { id: 'traffic', name: '交通', color: '#7b8cf0' },
    { id: 'daily', name: '生活日用', color: '#9b8fe8' },
    { id: 'fun', name: '娱乐', color: '#e8967e' },
    { id: 'study', name: '学习', color: '#6e9ee8' },
    { id: 'medical', name: '医疗', color: '#6ec6c0' },
    { id: 'outfit', name: '穿搭', color: '#d19ab6' },
    { id: 'social', name: '人情社交', color: '#6fbf8f' },
    { id: 'beauty', name: '美容', color: '#f07e9b' },
    { id: 'family', name: '亲子', color: '#efa6c4' },
    { id: 'pet', name: '宠物', color: '#c99372' },
    { id: 'express', name: '快递', color: '#e8b36a' },
    { id: 'travel', name: '旅行', color: '#57c3c8' },
    { id: 'rent', name: '租房', color: '#8fa9c4' },
    { id: 'invest', name: '投资', color: '#6fc59a' },
    { id: 'transfer', name: '转账', color: '#67b8e8' },
    { id: 'lend', name: '借出', color: '#a992e8' },
    { id: 'repay', name: '还款', color: '#8e8aa6' },
    { id: 'other', name: '其他', color: '#a5a2b8' }
  ];

  var INCOME = [
    { id: 'salary', name: '工资', color: '#6fa8f5' },
    { id: 'bonus', name: '奖金', color: '#e8b36a' },
    { id: 'redpacket', name: '红包', color: '#f07e9b' },
    { id: 'finance', name: '理财', color: '#6fc59a' },
    { id: 'parttime', name: '兼职', color: '#a992e8' },
    { id: 'refund', name: '退款', color: '#67b8e8' },
    { id: 'reimburse', name: '报销', color: '#6ec6c0' },
    { id: 'otherIn', name: '其他', color: '#a5a2b8' }
  ];

  /* 自定义分类可选图标 */
  var PICKER = [
    'food',
    'coffee',
    'cake',
    'basket',
    'shop',
    'outfit',
    'beauty',
    'daily',
    'medical',
    'pill',
    'gym',
    'fun',
    'music',
    'study',
    'pet',
    'plant',
    'family',
    'traffic',
    'car',
    'travel',
    'rent',
    'express',
    'social',
    'gift',
    'phone',
    'camera',
    'wallet',
    'finance',
    'invest',
    'star',
    'heart',
    'ticket',
    'award',
    'other'
  ];

  /* 自定义分类自动取色（低饱和） */
  var CUSTOM_COLORS = [
    '#a99af3',
    '#8fcbf2',
    '#8fd6c2',
    '#f2bda6',
    '#ecabc2',
    '#b9d89e',
    '#eed7a0',
    '#c1aade',
    '#dcaaa4',
    '#9fc6cf'
  ];

  var CATS = { expense: EXPENSE.slice(), income: INCOME.slice() };
  var ALL = {};
  EXPENSE.concat(INCOME).forEach(function (c) {
    ALL[c.id] = c;
  });

  /** 内置 + 自定义，重建分类表（自定义的插在「其他」前面） */
  function refresh() {
    var custom = window.Store && Store.categories ? Store.categories() : [];
    var ex = EXPENSE.slice();
    var inc = INCOME.slice();
    ALL = {};
    EXPENSE.concat(INCOME).forEach(function (c) {
      ALL[c.id] = c;
    });
    custom.forEach(function (c) {
      var item = { id: c.id, name: c.name, color: c.color, icon: c.icon, custom: true };
      ALL[c.id] = item;
      var list = c.type === 'income' ? inc : ex;
      var idx = list.length - 1; // 放在「其他」前面
      list.splice(idx < 0 ? list.length : idx, 0, item);
    });
    CATS.expense = ex;
    CATS.income = inc;
    window.CATS = CATS;
  }

  function svg(name) {
    var body = P[name] || P.other;
    return '<svg viewBox="0 0 24 24">' + body + '</svg>';
  }

  /** 带柔和底色 + 主色的图标块 */
  function chip(catId, extraClass) {
    var c = ALL[catId] || ALL.other;
    return (
      '<span class="cat-ic ' +
      (extraClass || '') +
      '" style="background:' +
      c.color +
      '1f;color:' +
      c.color +
      '">' +
      svg(c.icon || c.id) +
      '</span>'
    );
  }

  function get(catId) {
    return ALL[catId] || ALL.other;
  }

  function list(type) {
    return (CATS[type] || []).slice();
  }

  function picker() {
    return PICKER.slice();
  }

  function colorFor(i) {
    return CUSTOM_COLORS[i % CUSTOM_COLORS.length];
  }

  window.Icons = {
    svg: svg,
    chip: chip,
    get: get,
    list: list,
    picker: picker,
    colorFor: colorFor,
    refresh: refresh
  };
  window.CATS = CATS;
})();
