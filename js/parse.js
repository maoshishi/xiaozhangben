/* =========================================================
   智能解析：把一句中文变成一条账
   例：
     "午饭花了12块5"      -> 支出 / 餐饮 / 12.5 / 今天
     "昨天打车23"          -> 支出 / 交通 / 23 / 昨天
     "发工资8000"          -> 收入 / 工资 / 8000 / 今天
     "买了双鞋 199 用支付宝" -> 支出 / 购物 / 199 / 今天
   完全离线；也提供大模型接口（可选）
   ========================================================= */
(function () {
  var CN = {
    零: 0, 〇: 0, 一: 1, 壹: 1, 二: 2, 两: 2, 贰: 2, 三: 3, 叁: 3,
    四: 4, 肆: 4, 五: 5, 伍: 5, 六: 6, 陆: 6, 七: 7, 柒: 7,
    八: 8, 捌: 8, 九: 9, 玖: 9, 十: 10, 拾: 10, 百: 100, 佰: 100,
    千: 1000, 仟: 1000, 万: 10000, 亿: 100000000
  };
  var DIGIT = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };

  function cnToNum(str) {
    if (!str) return NaN;
    if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str);
    var total = 0, section = 0, num = 0, hit = false;
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (DIGIT[ch] !== undefined) {
        num = DIGIT[ch];
        hit = true;
      } else if (ch === '十' || ch === '百' || ch === '千' || ch === '拾' || ch === '佰' || ch === '仟') {
        var u = CN[ch];
        if (num === 0) num = 1;
        section += num * u;
        num = 0;
        hit = true;
      } else if (ch === '万' || ch === '亿') {
        section = (section + num) * CN[ch];
        total += section;
        section = 0;
        num = 0;
        hit = true;
      } else {
        return NaN;
      }
    }
    if (!hit) return NaN;
    return total + section + num;
  }

  /* ---------------- 关键词表 ---------------- */
  var CAT_WORDS = {
    expense: {
      food: '早餐 早饭 午饭 中饭 晚饭 夜宵 加餐 外卖 食堂 火锅 烧烤 奶茶 咖啡 饮料 零食 水果 买菜 菜市场 面包 蛋糕 米线 面条 麻辣烫 鸡排 汉堡 披萨 快餐 餐 吃 喝 饭 汤 粥 酒 串',
      shop: '购物 淘宝 京东 拼多多 网购 下单 买 手机 电脑 耳机 数码 家具 电器 床品 被套 化妆品 包包 包 眼镜',
      traffic: '地铁 公交 打车 滴滴 出租 网约车 高铁 火车 机票 飞机 加油 停车 单车 车费 过路费 船票 油费 路费 交通',
      daily: '日用 日用品 卫生纸 纸巾 洗发水 沐浴露 牙膏 牙刷 洗衣液 垃圾袋 水电 电费 水费 燃气 话费 手机费 流量 网费 宽带 物业 生活用品 超市',
      fun: '电影 游戏 唱歌 娱乐 剧本杀 桌游 演唱会 展览 网吧 会员 视频会员 音乐会员 KTV 门票',
      study: '书 教材 课本 培训 课程 网课 考试 报名费 学费 文具 笔 笔记本 打印 资料 学习 四六级 考证',
      medical: '药 医院 看病 体检 挂号 口罩 诊所 牙医 医疗 门诊 打针 医保',
      outfit: '穿搭 衣服 外套 卫衣 毛衣 衬衫 T恤 裤子 牛仔裤 裙子 裙 鞋 球鞋 靴子 帽子 袜子 围巾 内衣 首饰 项链 戒指 手表 墨镜 换季 新衣',
      social: '请客 礼物 送礼 随礼 份子钱 婚礼 生日 聚会 人情 红包 请吃饭',
      beauty: '化妆 口红 面膜 护肤 美容 理发 美发 剪头 美甲 香水 洗面奶 面霜',
      family: '孩子 宝宝 奶粉 尿不湿 亲子 玩具 幼儿园 儿童 小孩',
      pet: '猫 狗 宠物 猫粮 狗粮 猫砂 宠物医院 铲屎 猫砂盆',
      express: '快递 邮费 寄件 运费 顺丰 寄快递',
      travel: '旅行 旅游 酒店 民宿 景区 度假 出差 机票 住宿',
      rent: '房租 租房 租金 押金 中介费 合租 公寓 月租 房东 交房租 续租',
      invest: '基金 股票 理财 投资 定投 保险 存钱 黄金 债券',
      transfer: '转账 转给 汇款 转钱',
      lend: '借出 借给 借钱给',
      repay: '还款 还钱 还信用卡 还花呗 信用卡 花呗 白条 贷款 分期'
    },
    income: {
      salary: '工资 薪水 薪资 月薪 发工资 发薪',
      bonus: '奖金 年终奖 提成 绩效 补贴 津贴 奖励',
      redpacket: '红包 压岁钱 礼金 份子钱 收礼',
      finance: '收益 利息 分红 理财 基金 股票 余额宝 投资',
      parttime: '兼职 外快 家教 稿费 副业 私活 接单',
      refund: '退款 退钱 退货 退回 返现',
      reimburse: '报销 报账'
    }
  };

  /* 强信号词，用于判断收入 */
  var INCOME_HINTS = [
    '发工资', '工资', '薪水', '薪资', '月薪', '奖金', '年终奖', '提成', '绩效',
    '补贴', '津贴', '收到', '收了', '收入', '进账', '赚了', '赚到', '赚',
    '退款', '退钱', '报销', '利息', '分红', '收益', '红包', '压岁钱',
    '生活费', '稿费', '外快', '兼职', '私活', '卖出', '卖', '中奖'
  ];
  var EXPENSE_HINTS = [
    '花了', '花', '买了', '买', '付了', '付', '支付', '充值', '充', '交', '缴',
    '吃', '喝', '打车', '请客', '订', '还', '借出', '报名', '下单', '消费'
  ];

  /* 太通用的动词：命中时降权，让「书」「房租」这类具体词胜出 */
  var GENERIC = '买 吃 喝 付 交 还 花 充 订 转 送 请 收 用 玩';

  function scoreWords(text, words) {
    var best = null;
    var arr = words.split(' ');
    for (var i = 0; i < arr.length; i++) {
      var w = arr[i];
      if (!w) continue;
      var idx = text.indexOf(w);
      if (idx < 0) continue;
      // 词越长越具体，权重越高
      var score = Math.pow(w.length, 2.2) * 10 - idx * 0.2;
      if (GENERIC.split(' ').indexOf(w) >= 0) score *= 0.55;
      if (!best || score > best.score) best = { word: w, score: score, index: idx };
    }
    return best;
  }

  function detectType(text) {
    var inc = 0, exp = 0;
    INCOME_HINTS.forEach(function (w) {
      var i = text.indexOf(w);
      if (i >= 0) inc += w.length * 10 + (text.length - i);
    });
    EXPENSE_HINTS.forEach(function (w) {
      var i = text.indexOf(w);
      if (i >= 0) exp += w.length * 10 + (text.length - i);
    });
    // "收到退款" 这类双关键词，收入词通常更具体，给一点加权
    if (inc > 0) inc += 12;
    if (/^发工资|工资到账|收到/.test(text) && inc > 0) return 'income';
    if (inc > exp) return 'income';
    return 'expense';
  }

  function detectCat(text, type) {
    // 自定义分类：名字直接出现在句子里，优先级最高（取最长的那个）
    var custom =
      window.Store && Store.categories
        ? Store.categories(type === 'income' ? 'income' : 'expense')
        : [];
    var hit = null;
    custom.forEach(function (c) {
      if (c.name && text.indexOf(c.name) >= 0) {
        if (!hit || c.name.length > hit.name.length) hit = c;
      }
    });
    if (hit) return { cat: hit.id, matched: true, word: hit.name };

    var words = CAT_WORDS[type === 'income' ? 'income' : 'expense'];
    var best = null, bestId = '';
    Object.keys(words).forEach(function (id) {
      var m = scoreWords(text, words[id]);
      if (m && (!best || m.score > best.score)) {
        best = m;
        bestId = id;
      }
    });
    return { cat: bestId, matched: !!bestId, word: best ? best.word : '' };
  }

  /* ---------------- 日期 ---------------- */
  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function ymd(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  var WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  function detectDate(text, ref) {
    var now = ref ? new Date(ref) : new Date();
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var label = '今天';
    var m;

    if (/大前天/.test(text)) {
      d.setDate(d.getDate() - 3);
      label = '大前天';
    } else if (/前天/.test(text)) {
      d.setDate(d.getDate() - 2);
      label = '前天';
    } else if (/昨天|昨日|昨晚/.test(text)) {
      d.setDate(d.getDate() - 1);
      label = '昨天';
    } else if (/明天|明日/.test(text)) {
      d.setDate(d.getDate() + 1);
      label = '明天';
    } else if ((m = text.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]?/))) {
      var yy = now.getFullYear();
      var mm = +m[1] - 1;
      var dd = +m[2];
      var cand = new Date(yy, mm, dd);
      if (cand.getTime() > now.getTime() + 3 * 864e5) cand.setFullYear(yy - 1);
      d = cand;
      label = +m[1] + '月' + dd + '日';
    } else if ((m = text.match(/(^|[^\d:])(\d{1,2})\s*[日号](?!\d)/))) {
      var dd2 = +m[2];
      var cand2 = new Date(now.getFullYear(), now.getMonth(), dd2);
      if (dd2 > now.getDate() + 3) cand2.setMonth(cand2.getMonth() - 1);
      d = cand2;
      label = d.getMonth() + 1 + '月' + dd2 + '日';
    }

    return {
      date: ymd(d),
      label: label,
      week: WEEK[d.getDay()],
      isToday: ymd(d) === ymd(now)
    };
  }

  function detectTime(text, ref) {
    var now = ref ? new Date(ref) : new Date();
    var m;
    if ((m = text.match(/(\d{1,2})\s*[:：]\s*(\d{2})/))) {
      return pad(Math.min(23, +m[1])) + ':' + pad(Math.min(59, +m[2]));
    }
    if ((m = text.match(/([零一二三四五六七八九十两\d]{1,3})\s*点\s*(半|[零一二三四五六七八九十\d]{1,3}\s*分?)?/))) {
      var h = cnToNum(m[1]);
      if (!isNaN(h) && h >= 0 && h <= 24) {
        var mi = 0;
        if (m[2]) {
          var t = m[2].replace('分', '').trim();
          mi = t === '半' ? 30 : cnToNum(t);
          if (isNaN(mi)) mi = 0;
        }
        if (h <= 12 && /下午|晚上|傍晚|夜/.test(text)) h += 12;
        return pad(h % 24) + ':' + pad(mi);
      }
    }
    if (/早上|早晨|一早|上午/.test(text)) return '08:00';
    if (/中午/.test(text)) return '12:00';
    if (/下午/.test(text)) return '14:00';
    if (/傍晚|晚上|夜里|今晚|晚饭/.test(text)) return '19:30';
    if (/凌晨|半夜/.test(text)) return '03:00';
    return pad(now.getHours()) + ':' + pad(now.getMinutes());
  }

  /* ---------------- 金额 ---------------- */
  function stripDateTime(text) {
    return text
      .replace(/\d{1,2}\s*月\s*\d{1,2}\s*[日号]/g, ' ')
      .replace(/(^|[^\d:])\d{1,2}\s*[日号](?!\d)/g, ' ')
      .replace(/\d{1,2}\s*[:：]\s*\d{2}/g, ' ')
      .replace(/[零一二三四五六七八九十两\d]{1,3}\s*点\s*(半|[零一二三四五六七八九十\d]{1,3}\s*分?)?/g, ' ');
  }

  function detectAmount(text) {
    var t = text;
    var m;

    // 1. 货币符号
    if ((m = t.match(/[¥￥]\s*(\d+(?:\.\d{1,2})?)/))) {
      return { amount: parseFloat(m[1]), raw: m[0] };
    }
    // 2. 数字 + 单位（含 "12块5"）
    if ((m = t.match(/(\d+(?:\.\d{1,2})?)\s*(?:元|块钱|块|rmb|RMB|人民币)/))) {
      var v = parseFloat(m[1]);
      var after = t.slice(m.index + m[0].length).match(/^\s*([0-9一二三四五六七八九])(?!\d)/);
      if (after && m[1].indexOf('.') < 0) {
        var jiao = cnToNum(after[1]);
        if (!isNaN(jiao)) v += jiao / 10;
      }
      return { amount: Math.round(v * 100) / 100, raw: m[0] };
    }
    // 3. 中文数字 + 单位（"十二块五"）
    if ((m = t.match(/([零〇一二三四五六七八九十百千万两]+)\s*(?:元|块钱|块)/))) {
      var cn = cnToNum(m[1]);
      var after2 = t.slice(m.index + m[0].length).match(/^\s*([零一二三四五六七八九])(?!\d)/);
      if (!isNaN(cn) && after2) {
        var j2 = cnToNum(after2[1]);
        if (!isNaN(j2)) cn += j2 / 10;
      }
      if (!isNaN(cn)) return { amount: Math.round(cn * 100) / 100, raw: m[0] };
    }
    // 4. 纯数字（先去掉日期、时间）
    var t2 = stripDateTime(t);
    if ((m = t2.match(/(\d+(?:\.\d{1,2})?)/))) {
      return { amount: parseFloat(m[1]), raw: m[0] };
    }
    // 5. 纯中文数字
    if ((m = t2.match(/([零〇一二三四五六七八九十百千万两]+)/))) {
      var n = cnToNum(m[1]);
      if (!isNaN(n) && n > 0) return { amount: n, raw: m[0] };
    }
    return { amount: NaN, raw: '' };
  }

  function cleanNote(text) {
    var n = stripDateTime(String(text || ''));
    n = n
      .replace(/[¥￥]\s*[\d.]+/g, ' ')
      .replace(
        /(\d+(?:\.\d{1,2})?|[零〇一二三四五六七八九十百千万两]+)\s*(?:元|块钱|块|rmb|RMB)\s*[零〇一二三四五六七八九]?/g,
        ' '
      )
      .replace(/\d+(?:\.\d{1,2})?/g, ' ')
      .replace(/(一共|总共|大约|大概|差不多|花了|花费|付了|用了|再记|记一笔)/g, ' ')
      .replace(/(今天|昨天|昨日|前天|大前天|明天|早上|上午|中午|下午|傍晚|晚上|夜里|凌晨)/g, ' ')
      .replace(/[，,。.、]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return n.slice(0, 24);
  }

  /* ---------------- 主解析 ---------------- */
  function parse(text, ref) {
    var raw = String(text || '').trim();
    if (!raw) return { ok: false, error: '请输入内容' };

    var type = detectType(raw);
    var amt = detectAmount(raw);
    if (isNaN(amt.amount) || amt.amount <= 0) {
      return { ok: false, error: '没找到金额，试着写成「午饭 12」这样' };
    }

    var catInfo = detectCat(raw, type);
    var dt = detectDate(raw, ref);
    var time = detectTime(raw, ref);
    var note = cleanNote(raw);

    var confidence = 'low';
    if (catInfo.matched) confidence = 'mid';
    if (catInfo.matched && type !== 'expense') confidence = 'high';
    if (catInfo.matched && /花了|买了|付了|收了|收到|发工资/.test(raw)) confidence = 'high';

    return {
      ok: true,
      type: type,
      amount: Math.round(amt.amount * 100) / 100,
      cat: catInfo.cat || (type === 'income' ? 'otherIn' : 'other'),
      catMatched: catInfo.matched,
      catWord: catInfo.word,
      note: note || '',
      date: dt.date,
      dateLabel: dt.label,
      week: dt.week,
      isToday: dt.isToday,
      time: time,
      confidence: confidence,
      raw: raw,
      engine: 'local'
    };
  }

  /* ---------------- 大模型通道（可选） ---------------- */
  var SYSTEM_PROMPT =
    '你是一个中文记账助手。用户会用一句话描述一笔收支，请抽取字段并只输出 JSON，不要任何解释。\n' +
    '字段：type（expense 或 income）、amount（数字）、cat（分类 id）、note（简短备注，不超过 12 字）、date（YYYY-MM-DD，默认今天：{TODAY}）、time（HH:MM，默认 {NOW}）。\n' +
    '支出分类 id：food 餐饮、shop 购物、traffic 交通、daily 生活日用、fun 娱乐、study 学习、medical 医疗、social 人情社交、beauty 美容、family 亲子、pet 宠物、express 快递、travel 旅行、invest 投资、transfer 转账、lend 借出、repay 还款、other 其他。\n' +
    '收入分类 id：salary 工资、bonus 奖金、redpacket 红包、finance 理财、parttime 兼职、refund 退款、reimburse 报销、otherIn 其他。';

  function parseWithLLM(text, cfg) {
    if (!cfg || !cfg.endpoint || !cfg.apiKey) return Promise.reject(new Error('未配置大模型'));
    var url = cfg.endpoint.replace(/\/+$/, '');
    if (!/\/chat\/completions$/.test(url)) url += '/chat/completions';

    var now = new Date();
    var today = ymd(now);
    var nowHM = pad(now.getHours()) + ':' + pad(now.getMinutes());
    var sys = SYSTEM_PROMPT.replace('{TODAY}', today).replace('{NOW}', nowHM);

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + cfg.apiKey
      },
      body: JSON.stringify({
        model: cfg.model || 'gpt-4o-mini',
        temperature: 0,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: text }
        ]
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        var content =
          json.choices && json.choices[0] && json.choices[0].message
            ? json.choices[0].message.content
            : '';
        var jsonText = (content.match(/\{[\s\S]*\}/) || [''])[0];
        if (!jsonText) throw new Error('返回内容无法解析');
        var o = JSON.parse(jsonText);
        var type = o.type === 'income' ? 'income' : 'expense';
        var amount = Math.round((Number(o.amount) || 0) * 100) / 100;
        if (!amount || amount <= 0) throw new Error('金额无效');
        var dt = detectDate(o.date || '', now);
        return {
          ok: true,
          type: type,
          amount: amount,
          cat: o.cat || (type === 'income' ? 'otherIn' : 'other'),
          catMatched: !!o.cat,
          note: String(o.note || '').slice(0, 24),
          date: dt.date,
          dateLabel: dt.label,
          week: dt.week,
          isToday: dt.isToday,
          time: /^\d{1,2}:\d{2}$/.test(o.time || '') ? o.time : nowHM,
          confidence: 'high',
          raw: text,
          engine: 'llm'
        };
      });
  }

  window.Parser = {
    parse: parse,
    parseWithLLM: parseWithLLM,
    cnToNum: cnToNum,
    detectDate: detectDate,
    detectTime: detectTime,
    detectAmount: detectAmount
  };
})();
