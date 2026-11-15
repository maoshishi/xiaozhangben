/* =========================================================
   数据层：localStorage 单机存储
   ========================================================= */
(function () {
  var LS_KEY = 'xiaozhangben.v1';
  var db = null;

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function ymd(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function hm(d) {
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function today() {
    return ymd(new Date());
  }

  function blank() {
    return {
      version: 1,
      records: [],
      categories: [],
      budget: { enabled: false, daily: 0, monthly: 0, updatedAt: 0 },
      pledges: [],
      settings: {
        ai: { endpoint: '', model: '', apiKey: '' },
        createdAt: Date.now()
      }
    };
  }

  function persist() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(db));
    } catch (e) {
      console.error(e);
      if (window.UI) UI.toast('保存失败：存储空间可能已满');
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) db = JSON.parse(raw);
    } catch (e) {
      console.warn('读取本地数据失败', e);
    }
    if (!db || !Array.isArray(db.records)) db = blank();
    if (!db.settings) db.settings = blank().settings;
    if (!db.settings.ai) db.settings.ai = blank().settings.ai;
    if (!Array.isArray(db.categories)) db.categories = [];
    db.categories.forEach(function (c) {
      if (!c.id) c.id = 'c' + uid();
      c.name = String(c.name || '').slice(0, 4);
      if (c.type !== 'income') c.type = 'expense';
      if (!c.icon) c.icon = 'other';
      if (!c.color) c.color = '#a99af3';
    });

    /* 预算 + 检讨书 */
    if (!db.budget || typeof db.budget !== 'object') {
      db.budget = { enabled: false, daily: 0, monthly: 0, updatedAt: 0 };
    }
    db.budget.enabled = !!db.budget.enabled;
    db.budget.daily = Math.max(0, Number(db.budget.daily) || 0);
    db.budget.monthly = Math.max(0, Number(db.budget.monthly) || 0);
    if (!Array.isArray(db.pledges)) db.pledges = [];
    db.pledges.forEach(function (p) {
      if (!p.id) p.id = 'p' + uid();
      if (!p.date) p.date = today();
      if (!p.time) p.time = '12:00';
      if (!Array.isArray(p.scope) || !p.scope.length) p.scope = ['day'];
    });
    db.records.forEach(function (r) {
      if (!r.id) r.id = uid();
      r.amount = Number(r.amount) || 0;
      if (!r.time) r.time = '12:00';
      if (r.type !== 'income') r.type = 'expense';
    });
    return db;
  }

  /* ---------- 查询辅助 ---------- */
  function monthOf(dateStr) {
    return String(dateStr || '').slice(0, 7);
  }

  function sortDesc(a, b) {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.time !== b.time) return a.time < b.time ? 1 : -1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  }

  var Store = {
    init: function () {
      load();
      return this;
    },

    uid: uid,
    ymd: ymd,
    hm: hm,
    today: today,

    all: function () {
      return db.records.slice();
    },

    get: function (id) {
      return db.records.filter(function (r) {
        return r.id === id;
      })[0];
    },

    add: function (rec) {
      var r = {
        id: uid(),
        type: rec.type === 'income' ? 'income' : 'expense',
        amount: Math.round((Number(rec.amount) || 0) * 100) / 100,
        cat: rec.cat || 'other',
        note: rec.note || '',
        date: rec.date || today(),
        time: rec.time || hm(new Date()),
        source: rec.source || 'manual',
        createdAt: Date.now()
      };
      db.records.push(r);
      persist();
      return r;
    },

    update: function (id, patch) {
      var r = this.get(id);
      if (!r) return null;
      Object.keys(patch).forEach(function (k) {
        if (k === 'amount') r.amount = Math.round((Number(patch.amount) || 0) * 100) / 100;
        else if (k !== 'id') r[k] = patch[k];
      });
      r.updatedAt = Date.now();
      persist();
      return r;
    },

    remove: function (id) {
      var i = db.records.findIndex(function (r) {
        return r.id === id;
      });
      if (i >= 0) {
        db.records.splice(i, 1);
        persist();
      }
    },

    /* ---------- 预算 ---------- */
    budget: function () {
      var b = db.budget || {};
      return {
        enabled: !!b.enabled,
        daily: Math.max(0, Number(b.daily) || 0),
        monthly: Math.max(0, Number(b.monthly) || 0)
      };
    },

    setBudget: function (b) {
      db.budget = {
        enabled: !!b.enabled,
        daily: Math.max(0, Math.round((Number(b.daily) || 0) * 100) / 100),
        monthly: Math.max(0, Math.round((Number(b.monthly) || 0) * 100) / 100),
        updatedAt: Date.now()
      };
      persist();
      return db.budget;
    },

    /* ---------- 检讨书 ---------- */
    pledges: function (date) {
      var list = db.pledges || [];
      return (date
        ? list.filter(function (p) {
            return p.date === date;
          })
        : list.slice()
      ).sort(function (a, b) {
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    },

    addPledge: function (p) {
      db.pledges = db.pledges || [];
      var item = {
        id: 'p' + uid(),
        date: p.date || today(),
        time: p.time || hm(new Date()),
        image: p.image || '',
        w: p.w || 0,
        h: p.h || 0,
        note: String(p.note || '').slice(0, 60),
        scope: Array.isArray(p.scope) && p.scope.length ? p.scope : ['day'],
        overDay: Math.round((Number(p.overDay) || 0) * 100) / 100,
        overMonth: Math.round((Number(p.overMonth) || 0) * 100) / 100,
        createdAt: Date.now()
      };
      db.pledges.push(item);
      persist();
      return item;
    },

    removePledge: function (id) {
      var i = (db.pledges || []).findIndex(function (p) {
        return p.id === id;
      });
      if (i >= 0) {
        db.pledges.splice(i, 1);
        persist();
      }
    },

    getPledge: function (id) {
      return (db.pledges || []).filter(function (p) {
        return p.id === id;
      })[0] || null;
    },

    /* 某月（y 为 4 位年份，m 为 0-11） */
    byMonth: function (y, m) {
      var key = y + '-' + pad(m + 1);
      return db.records.filter(function (r) {
        return monthOf(r.date) === key;
      }).sort(sortDesc);
    },

    byDate: function (dateStr) {
      return db.records.filter(function (r) {
        return r.date === dateStr;
      }).sort(sortDesc);
    },

    byMonthKey: function (key) {
      return db.records.filter(function (r) {
        return monthOf(r.date) === key;
      }).sort(sortDesc);
    },

    /* 汇总 */
    total: function (list, type) {
      return list.reduce(function (s, r) {
        return r.type === type ? s + r.amount : s;
      }, 0);
    },

    search: function (kw) {
      kw = String(kw || '').trim().toLowerCase();
      if (!kw) return [];
      return db.records
        .filter(function (r) {
          var cat = (window.Icons && Icons.get(r.cat).name) || '';
          return (
            (r.note || '').toLowerCase().indexOf(kw) >= 0 ||
            cat.indexOf(kw) >= 0 ||
            r.date.indexOf(kw) >= 0 ||
            String(r.amount).indexOf(kw) >= 0
          );
        })
        .sort(sortDesc)
        .slice(0, 80);
    },

    /* 月份键列表（有记录的月份，倒序） */
    months: function () {
      var s = {};
      db.records.forEach(function (r) {
        s[monthOf(r.date)] = 1;
      });
      return Object.keys(s).sort().reverse();
    },

    /* 设置 */
    settings: function () {
      return db.settings;
    },

    saveSettings: function (patch) {
      Object.keys(patch || {}).forEach(function (k) {
        db.settings[k] = patch[k];
      });
      persist();
    },

    count: function () {
      return db.records.length;
    },

    /* ---------- 自定义分类 ---------- */
    categories: function (type) {
      var list = db.categories || [];
      return type
        ? list.filter(function (c) {
            return c.type === type;
          })
        : list.slice();
    },

    addCategory: function (cat) {
      db.categories = db.categories || [];
      var c = {
        id: 'c' + uid(),
        type: cat.type === 'income' ? 'income' : 'expense',
        name: String(cat.name || '').trim().slice(0, 4),
        icon: cat.icon || 'other',
        color: cat.color || '#a99af3',
        createdAt: Date.now()
      };
      db.categories.push(c);
      persist();
      return c;
    },

    removeCategory: function (id) {
      var i = (db.categories || []).findIndex(function (c) {
        return c.id === id;
      });
      if (i >= 0) {
        db.categories.splice(i, 1);
        persist();
      }
    },

    /* 备份 */
    exportJSON: function () {
      return JSON.stringify(db, null, 2);
    },

    importJSON: function (text) {
      var incoming = JSON.parse(text);
      var list = Array.isArray(incoming) ? incoming : incoming.records;
      if (!Array.isArray(list)) throw new Error('文件格式不正确');
      var added = 0;

      // 顺带恢复自定义分类
      var cats = Array.isArray(incoming.categories) ? incoming.categories : [];
      db.categories = db.categories || [];
      cats.forEach(function (c) {
        if (!c || !c.name) return;
        var dup = db.categories.some(function (x) {
          return x.id === c.id || (x.name === c.name && x.type === c.type);
        });
        if (dup) return;
        db.categories.push({
          id: c.id || 'c' + uid(),
          type: c.type === 'income' ? 'income' : 'expense',
          name: String(c.name).slice(0, 4),
          icon: c.icon || 'other',
          color: c.color || '#a99af3',
          createdAt: c.createdAt || Date.now()
        });
      });

      // 顺带恢复预算设置（本机没开通过才采用备份里的）
      if (incoming.budget && typeof incoming.budget === 'object' && !(db.budget && db.budget.enabled)) {
        db.budget = {
          enabled: !!incoming.budget.enabled,
          daily: Math.max(0, Number(incoming.budget.daily) || 0),
          monthly: Math.max(0, Number(incoming.budget.monthly) || 0),
          updatedAt: Date.now()
        };
      }

      // 检讨书按 id 去重合并
      var plist = Array.isArray(incoming.pledges) ? incoming.pledges : [];
      db.pledges = db.pledges || [];
      plist.forEach(function (p) {
        if (!p || !p.date || !p.image) return;
        if (db.pledges.some(function (x) { return x.id === p.id; })) return;
        db.pledges.push({
          id: p.id || 'p' + uid(),
          date: p.date,
          time: p.time || '12:00',
          image: p.image,
          w: p.w || 0,
          h: p.h || 0,
          note: String(p.note || '').slice(0, 60),
          scope: Array.isArray(p.scope) && p.scope.length ? p.scope : ['day'],
          overDay: Number(p.overDay) || 0,
          overMonth: Number(p.overMonth) || 0,
          createdAt: p.createdAt || Date.now()
        });
      });

      var exists = {};
      db.records.forEach(function (r) {
        exists[r.id] = 1;
      });
      list.forEach(function (r) {
        if (!r || !r.date || !r.amount) return;
        var id = r.id || uid();
        var key = id + '|' + r.date + '|' + r.amount + '|' + (r.note || '');
        var dup = db.records.some(function (x) {
          return (
            (x.id && x.id === id) ||
            (x.date === r.date &&
              Number(x.amount) === Number(r.amount) &&
              (x.note || '') === (r.note || '') &&
              x.type === r.type &&
              x.cat === r.cat)
          );
        });
        if (dup) return;
        db.records.push({
          id: id,
          type: r.type === 'income' ? 'income' : 'expense',
          amount: Math.round((Number(r.amount) || 0) * 100) / 100,
          cat: r.cat || 'other',
          note: r.note || '',
          date: r.date,
          time: r.time || '12:00',
          source: r.source || 'import',
          createdAt: r.createdAt || Date.now()
        });
        added++;
      });
      persist();
      return added;
    },

    clearAll: function () {
      db.records = [];
      persist();
    },

    /* 示例数据 */
    loadSample: function () {
      var now = new Date();
      var y = now.getFullYear();
      var m = now.getMonth();
      var base = [
        ['food', '食堂午饭', 12.5],
        ['food', '奶茶', 16],
        ['food', '和室友吃火锅', 68.8],
        ['shop', '淘宝日用品', 45.9],
        ['traffic', '地铁', 4],
        ['traffic', '打车回学校', 23.6],
        ['daily', '洗发水', 39.9],
        ['fun', '电影票', 35],
        ['study', '专业课教材', 56],
        ['social', '同学生日红包', 66],
        ['express', '快递费', 12],
        ['medical', '感冒药', 28.5]
      ];
      var income = [
        ['salary', '兼职工资', 1200],
        ['redpacket', '家里给的生活费', 1500],
        ['finance', '余额宝收益', 12.36]
      ];
      var added = 0;
      for (var d = 0; d < 8; d++) {
        var day = new Date(y, m, Math.max(1, now.getDate() - d));
        if (day.getMonth() !== m) continue;
        var ds = ymd(day);
        var n = d === 0 ? 3 : 1 + (d % 2);
        for (var i = 0; i < n; i++) {
          var item = base[(d * 2 + i) % base.length];
          Store.add({
            type: 'expense',
            cat: item[0],
            note: item[1],
            amount: item[2] + (d % 3) * 1.5,
            date: ds,
            time: pad(9 + i * 3) + ':' + pad(10 + ((d * 7) % 45)),
            source: 'sample'
          });
          added++;
        }
      }
      income.forEach(function (item, i) {
        Store.add({
          type: 'income',
          cat: item[0],
          note: item[1],
          amount: item[2],
          date: ymd(new Date(y, m, Math.max(1, now.getDate() - i * 3))),
          time: '10:' + pad(20 + i * 5),
          source: 'sample'
        });
        added++;
      });
      return added;
    }
  };

  window.Store = Store.init();

  // 分类表依赖 Store 里的自定义分类，这里重建一次
  if (window.Icons && Icons.refresh) Icons.refresh();
})();
