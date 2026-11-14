/* =========================================================
   报表：周报 / 月报 / 年报 × 支出 / 收入
   - 折线图：周/月按天，年按月
   - 环形图：分类占比，点中心显示/恢复总额
   - 柱状图：近 5 期对比，可滑动，点击居中并看该期排行
   全部手绘 SVG，零依赖
   ========================================================= */
(function () {
  var DAY = 86400000;
  var EPOCH = new Date(1970, 0, 5); // 周一

  var state = {
    mode: 'month', // week | month | year
    type: 'expense',
    date: new Date(), // 当前查看的期（用其中的某一天代表）
    winEnd: null, // 柱状图窗口的右端 index
    selCat: null // 环形图选中的分类
  };

  var elMode = document.getElementById('repMode');
  var elType = document.getElementById('repType');
  var elLabel = document.getElementById('repLabel');
  var elSub = document.getElementById('reportSub');
  var elSummary = document.getElementById('repSummary');
  var elLineWrap = document.getElementById('lineWrap');
  var elLineTitle = document.getElementById('lineTitle');
  var elLineSide = document.getElementById('lineSide');
  var elLineHint = document.getElementById('lineHint');
  var elDonut = document.getElementById('donutWrap');
  var elLegend = document.getElementById('legend');
  var elBarScroll = document.getElementById('barScroll');
  var elBarTitle = document.getElementById('barTitle');
  var elBarSide = document.getElementById('barSide');
  var elRankHead = document.getElementById('rankHead');
  var elRankMeta = document.getElementById('rankMeta');
  var elRankList = document.getElementById('rankList');

  /* ---------------- 小工具 ---------------- */
  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function ymd(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function addDays(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  }

  function startOfWeek(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  }

  function sameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function sum(list) {
    return list.reduce(function (s, r) {
      return s + r.amount;
    }, 0);
  }

  function esc(s) {
    return UI.escapeHtml(s);
  }

  /* ---------------- 期间 ---------------- */
  function periodOf(mode, d) {
    d = d || new Date();
    var y = d.getFullYear();
    if (mode === 'week') {
      var s = startOfWeek(d);
      var e = addDays(s, 6);
      return {
        mode: 'week',
        start: s,
        end: e,
        idx: Math.round((s - EPOCH) / (DAY * 7)),
        label: s.getMonth() + 1 + '月' + s.getDate() + '日 - ' + (e.getMonth() + 1) + '月' + e.getDate() + '日',
        bar: s.getMonth() + 1 + '/' + s.getDate(),
        unit: '日'
      };
    }
    if (mode === 'month') {
      return {
        mode: 'month',
        start: new Date(y, d.getMonth(), 1),
        end: new Date(y, d.getMonth() + 1, 0),
        idx: y * 12 + d.getMonth(),
        label: y + '年' + (d.getMonth() + 1) + '月',
        bar: d.getMonth() + 1 + '月',
        unit: '日'
      };
    }
    return {
      mode: 'year',
      start: new Date(y, 0, 1),
      end: new Date(y, 11, 31),
      idx: y,
      label: y + '年',
      bar: String(y).slice(2) + '年',
      unit: '月'
    };
  }

  function periodFromIdx(mode, idx) {
    if (mode === 'week') return periodOf('week', addDays(EPOCH, idx * 7));
    if (mode === 'month') {
      var y = Math.floor(idx / 12);
      var m = ((idx % 12) + 12) % 12;
      return periodOf('month', new Date(y, m, 1));
    }
    return periodOf('year', new Date(idx, 0, 1));
  }

  function recordsOf(p) {
    var a = ymd(p.start);
    var b = ymd(p.end);
    return Store.all().filter(function (r) {
      return r.date >= a && r.date <= b;
    });
  }

  /* ---------------- 折线数据 ---------------- */
  function seriesOf(p, recs) {
    var map = {};
    recs.forEach(function (r) {
      map[r.date] = (map[r.date] || 0) + r.amount;
    });

    if (p.mode === 'year') {
      var months = new Array(12).fill(0);
      recs.forEach(function (r) {
        months[+r.date.slice(5, 7) - 1] += r.amount;
      });
      return {
        values: months,
        labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        keys: months.map(function (_, i) {
          return (p.start.getFullYear()) + '年' + (i + 1) + '月';
        }),
        step: 'month'
      };
    }

    var n = p.mode === 'week' ? 7 : p.end.getDate();
    var values = [];
    var labels = [];
    var keys = [];
    for (var i = 0; i < n; i++) {
      var d = addDays(p.start, i);
      var k = ymd(d);
      values.push(map[k] || 0);
      keys.push(d.getMonth() + 1 + '月' + d.getDate() + '日');
      if (p.mode === 'week') {
        labels.push(UI.WEEK[d.getDay()].replace('周', ''));
      } else {
        labels.push(i === 0 || (i + 1) % 5 === 0 || i === n - 1 ? String(i + 1) : '');
      }
    }
    return { values: values, labels: labels, keys: keys, step: 'day', startDate: p.start };
  }

  /* ---------------- 折线图 ---------------- */
  var lineMeta = null;
  var lineSel = -1;

  function lineChart(ser) {
    var values = ser.values;
    var n = values.length;
    var W = 340;
    var H = 168;
    var pl = 14;
    var pr = 14;
    var pt = 18;
    var pb = 26;
    var iw = W - pl - pr;
    var ih = H - pt - pb;
    var max = Math.max.apply(null, values.concat([1]));
    var top = max * 1.16;
    var stepX = n > 1 ? iw / (n - 1) : 0;

    var pts = values.map(function (v, i) {
      return {
        x: n > 1 ? pl + i * stepX : pl + iw / 2,
        y: pt + ih - (v / top) * ih,
        v: v
      };
    });

    var line = pts
      .map(function (p, i) {
        return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
      })
      .join(' ');

    var area =
      line +
      ' L' +
      pts[n - 1].x.toFixed(1) +
      ' ' +
      (pt + ih) +
      ' L' +
      pts[0].x.toFixed(1) +
      ' ' +
      (pt + ih) +
      ' Z';

    var grid = '';
    [0, 0.5, 1].forEach(function (f) {
      var y = pt + ih - f * ih;
      grid +=
        '<line x1="' + pl + '" y1="' + y.toFixed(1) + '" x2="' + (W - pr) + '" y2="' + y.toFixed(1) +
        '" stroke="#f2effb" stroke-width="1"' + (f === 0 ? '' : ' stroke-dasharray="3 5"') + '/>';
    });

    var dots = '';
    if (n <= 12) {
      pts.forEach(function (p, i) {
        dots +=
          '<circle class="ln-dot' + (i === lineSel ? ' on' : '') + '" data-i="' + i + '" cx="' + p.x.toFixed(1) +
          '" cy="' + p.y.toFixed(1) + '" r="' + (i === lineSel ? 4.2 : 2.9) + '" fill="#fff" stroke="#a99af3" stroke-width="2"/>';
      });
    }

    var todayLine = '';
    var today = new Date();
    if (ser.step === 'day' && ser.startDate) {
      for (var t = 0; t < n; t++) {
        if (sameDay(addDays(ser.startDate, t), today)) {
          var tx = pts[t].x;
          todayLine =
            '<line x1="' + tx.toFixed(1) + '" y1="' + pt + '" x2="' + tx.toFixed(1) + '" y2="' + (pt + ih) +
            '" stroke="#c9bffa" stroke-width="1.2" stroke-dasharray="3 4"/>';
        }
      }
    }

    var xLabels = pts
      .map(function (p, i) {
        if (!ser.labels[i]) return '';
        return (
          '<text x="' + p.x.toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="9.5" fill="#a9a4bd">' +
          ser.labels[i] +
          '</text>'
        );
      })
      .join('');

    var hits = pts
      .map(function (p, i) {
        var w = n > 1 ? iw / (n - 1) : iw;
        var x = Math.max(pl, p.x - w / 2);
        return (
          '<rect class="ln-hit" data-i="' + i + '" x="' + x.toFixed(1) + '" y="0" width="' + w.toFixed(1) +
          '" height="' + H + '" fill="transparent"/>'
        );
      })
      .join('');

    return {
      W: W,
      H: H,
      pts: pts,
      html:
        '<svg viewBox="0 0 ' + W + ' ' + H + '" class="line-svg" preserveAspectRatio="none">' +
        '<defs>' +
        '<linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#b3a6f6" stop-opacity="0.34"/>' +
        '<stop offset="100%" stop-color="#b3a6f6" stop-opacity="0"/>' +
        '</linearGradient>' +
        '<linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#a99af3"/>' +
        '<stop offset="100%" stop-color="#7cc0ee"/>' +
        '</linearGradient>' +
        '</defs>' +
        grid +
        todayLine +
        '<path class="area" d="' + area + '" fill="url(#areaGrad)" stroke="none"/>' +
        '<path d="' + line + '" fill="none" stroke="url(#lineGrad)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
        dots +
        xLabels +
        hits +
        '</svg>'
    };
  }

  function bindLine() {
    elLineWrap.addEventListener('click', function (e) {
      var hit = e.target.closest('.ln-hit');
      if (!hit || !lineMeta) return;
      var i = +hit.getAttribute('data-i');
      lineSel = lineSel === i ? -1 : i;
      paintLineTip();
    });
  }

  function paintLineTip() {
    if (!lineMeta) return;
    var tip = document.getElementById('lineTip');
    var pts = lineMeta.pts;
    var sel = lineSel;
    elLineWrap.querySelectorAll('.ln-hit').forEach(function (h) {
      var on = +h.getAttribute('data-i') === sel;
      h.setAttribute('fill', on ? 'rgba(169,154,243,0.06)' : 'transparent');
    });
    var dots = elLineWrap.querySelectorAll('.ln-dot');
    dots.forEach(function (c) {
      var on = +c.getAttribute('data-i') === sel;
      c.setAttribute('r', on ? 4.2 : 2.9);
      c.setAttribute('fill', on ? '#a99af3' : '#fff');
    });
    if (sel < 0) {
      if (tip) tip.classList.remove('show');
      return;
    }
    var p = pts[sel];
    if (!tip) return;
    var v = p.v;
    tip.innerHTML =
      '<b>' + esc(ser0.keys[sel]) + '</b><span>' + UI.money(v) + '</span>';
    tip.style.left = (p.x / lineMeta.W) * 100 + '%';
    tip.style.top = (p.y / lineMeta.H) * 100 + '%';
    tip.classList.add('show');
  }

  var ser0 = null;

  /* ---------------- 环形图 ---------------- */
  /* 低饱和马卡龙色，冷暖交替排列：相邻两块永远差 60° 以上，不会撞色 */
  var SLICE = [
    '#ab9ef2', // 淡紫（主色）
    '#8fd6c2', // 薄荷
    '#f2bda6', // 蜜桃
    '#93c9ef', // 天蓝
    '#ecabc2', // 玫瑰
    '#b9d89e', // 鼠尾草
    '#9fc6cf', // 灰青
    '#eed7a0', // 奶油
    '#c1aade', // 紫藤
    '#dcaaa4' // 陶土
  ];

  function sliceColor(i) {
    return SLICE[i % SLICE.length];
  }

  var DB = { W: 320, H: 220, cx: 160, cy: 110, r: 82, sw: 20 };

  function paintDonut(items, total, count) {
    var typeName = state.type === 'income' ? '收入' : '支出';
    var sel = null;
    if (state.selCat) {
      items.forEach(function (it) {
        if (it.cat === state.selCat) sel = it;
      });
    }

    if (!items.length) {
      elDonut.innerHTML = '<div class="chart-empty">本期还没有' + typeName + '记录</div>';
      elLegend.innerHTML = '';
      return;
    }

    var C = 2 * Math.PI * DB.r;
    var gap = 3;
    var single = items.length === 1;
    var cum = 0;
    var segs = items
      .map(function (it, i) {
        var len = single ? C : Math.max(it.pct * C - gap, 1.4);
        var off = -cum * C;
        it.cum = cum;
        it.color = sliceColor(i);
        cum += it.pct;
        var isSel = state.selCat === it.cat;
        var dim = state.selCat && !isSel ? ' opacity="0.28"' : '';
        return (
          '<circle class="seg" data-cat="' + it.cat + '" cx="' + DB.cx + '" cy="' + DB.cy + '" r="' + DB.r +
          '" fill="none" stroke="' + it.color + '" stroke-width="' + (isSel ? DB.sw + 5 : DB.sw) +
          '" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) +
          '" stroke-dashoffset="' + off.toFixed(2) + '" transform="rotate(-90 ' + DB.cx + ' ' + DB.cy + ')"' + dim + '/>'
        );
      })
      .join('');

    /* 外侧标签：分类名 + 百分比（≥4.5% 才标注，左右分列 + 简单防重叠） */
    var labs = [];
    items.forEach(function (it) {
      if (it.pct < 0.045) return;
      var mid = -Math.PI / 2 + (it.cum + it.pct / 2) * Math.PI * 2;
      labs.push({
        it: it,
        mid: mid,
        side: Math.cos(mid) >= 0 ? 1 : -1,
        y: DB.cy + Math.sin(mid) * 99
      });
    });
    [1, -1].forEach(function (side) {
      var arr = labs.filter(function (l) {
        return l.side === side;
      }).sort(function (a, b) {
        return a.y - b.y;
      });
      var minY = 20, maxY = DB.H - 20;
      for (var i = 1; i < arr.length; i++) {
        if (arr[i].y - arr[i - 1].y < 33) arr[i].y = arr[i - 1].y + 33;
      }
      if (arr.length) {
        var over = arr[arr.length - 1].y - maxY;
        if (over > 0) arr.forEach(function (l) { l.y -= over; });
        if (arr[0].y < minY) arr.forEach(function (l) { l.y += minY - arr[0].y; });
      }
    });

    var labels = labs
      .map(function (l) {
        var it = l.it;
        var isSel = state.selCat === it.cat;
        var p1x = DB.cx + Math.cos(l.mid) * (DB.r + DB.sw / 2 + 2);
        var p1y = DB.cy + Math.sin(l.mid) * (DB.r + DB.sw / 2 + 2);
        var ex = DB.cx + l.side * 101;
        var tx = DB.cx + l.side * 107;
        var anchor = l.side > 0 ? 'start' : 'end';
        var fade = state.selCat && !isSel ? ' opacity="0.4"' : '';
        return (
          '<g class="dn-label" data-cat="' + it.cat + '"' + fade + '>' +
          '<polyline points="' + p1x.toFixed(1) + ',' + p1y.toFixed(1) + ' ' + ex + ',' + l.y.toFixed(1) + ' ' +
          (ex + l.side * 7) + ',' + l.y.toFixed(1) + '" fill="none" stroke="' +
          (isSel ? it.color : '#e2def2') + '" stroke-width="' + (isSel ? 1.4 : 1) + '" stroke-linecap="round"/>' +
          '<text x="' + tx + '" y="' + (l.y - 4.5).toFixed(1) + '" text-anchor="' + anchor +
          '" font-size="10.2" font-weight="' + (isSel ? '700' : '600') + '" fill="' +
          (isSel ? '#4a4566' : '#7d7893') + '">' + esc(it.name) + '</text>' +
          '<text x="' + tx + '" y="' + (l.y + 8).toFixed(1) + '" text-anchor="' + anchor +
          '" font-size="9.8" fill="' + (isSel ? '#6f6a8a' : '#a9a4bd') + '">' +
          (it.pct * 100).toFixed(1) + '%</text>' +
          '</g>'
        );
      })
      .join('');

    var centerLabel = sel ? esc(sel.name) : '总' + typeName;
    var centerValue = sel ? sel.amount : total;
    var centerSub = sel ? (sel.pct * 100).toFixed(1) + '%' : count + ' 笔';

    elDonut.innerHTML =
      '<div class="donut-inner">' +
      '<svg viewBox="0 0 ' + DB.W + ' ' + DB.H + '" class="donut-svg">' +
      '<circle cx="' + DB.cx + '" cy="' + DB.cy + '" r="' + DB.r + '" fill="none" stroke="#f7f5fd" stroke-width="' +
      DB.sw + '"/>' +
      segs +
      labels +
      '</svg>' +
      '<button class="donut-center' + (sel ? ' sel' : '') + '" id="donutCenter">' +
      '<span class="dc-k">' + centerLabel + '</span>' +
      '<strong class="dc-v">¥' + UI.num(centerValue) + '</strong>' +
      '<span class="dc-s">' + centerSub + '</span>' +
      '</button>' +
      '</div>';

    elLegend.innerHTML = items
      .map(function (it) {
        return (
          '<button class="lg-row' + (state.selCat === it.cat ? ' on' : '') + '" data-cat="' + it.cat + '">' +
          '<span class="lg-dot" style="background:' + it.color + '"></span>' +
          Icons.chip(it.cat) +
          '<span class="lg-name">' + esc(it.name) + '</span>' +
          '<span class="lg-pct">' + (it.pct * 100).toFixed(1) + '%</span>' +
          '<span class="lg-amt">' + UI.num(it.amount) + '</span>' +
          '</button>'
        );
      })
      .join('');
  }

  /* ---------------- 排行（单笔账单） ---------------- */
  function paintRank(recs) {
    elRankMeta.textContent = recs.length ? '共 ' + recs.length + ' 笔' : '';
    if (!recs.length) {
      elRankList.innerHTML = '<div class="chart-empty small">暂无数据</div>';
      return;
    }
    var top = recs
      .slice()
      .sort(function (a, b) {
        return b.amount - a.amount || (b.date + b.time).localeCompare(a.date + a.time);
      })
      .slice(0, 10);

    elRankList.innerHTML = top
      .map(function (r, i) {
        var c = Icons.get(r.cat);
        var note = (r.note || '').trim();
        var title = note || c.name;
        var sub = UI.dateLabel(r.date) + (note ? ' · ' + c.name : '');
        return (
          '<div class="rank-row">' +
          '<span class="rank-idx">' + (i + 1) + '</span>' +
          Icons.chip(r.cat) +
          '<span class="rank-mid">' +
          '<span class="rank-name">' + esc(title) + '</span>' +
          '<span class="rank-sub">' + esc(sub) + '</span>' +
          '</span>' +
          '<span class="rank-amt">' + UI.num(r.amount) + '</span>' +
          '</div>'
        );
      })
      .join('');
  }

  /* ---------------- 主渲染 ---------------- */
  function render() {
    var p = periodOf(state.mode, state.date);
    var all = recordsOf(p);
    var recs = all.filter(function (r) {
      return r.type === state.type;
    });
    var total = sum(recs);
    var typeName = state.type === 'income' ? '收入' : '支出';

    /* 头部状态 */
    elLabel.textContent = p.label;
    elMode.querySelectorAll('.rep-tab').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-mode') === state.mode);
    });
    elType.querySelectorAll('.rep-seg-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-type') === state.type);
    });
    elSub.textContent =
      p.label + ' · ' + recs.length + ' 笔' + typeName;

    /* 概览 */
    var days = p.mode === 'year' ? 12 : p.mode === 'week' ? 7 : p.end.getDate();
    var avg = total / days;
    elSummary.innerHTML =
      '<div class="rs-main">' +
      '<span class="rs-k">本期' + typeName + '</span>' +
      '<strong class="rs-v' + (state.type === 'income' ? ' inc' : '') + '">' + UI.money(total) + '</strong>' +
      '</div>' +
      '<div class="rs-item"><span class="rs-k">笔数</span><b class="rs-s">' + recs.length + '</b></div>' +
      '<div class="rs-item"><span class="rs-k">' + (p.mode === 'year' ? '月均' : '日均') + '</span><b class="rs-s">' + UI.money(avg) + '</b></div>';

    /* 折线 */
    var ser = seriesOf(p, recs);
    ser0 = ser;
    lineSel = -1;
    var chart = lineChart(ser);
    lineMeta = { pts: chart.pts, W: chart.W, H: chart.H };
    elLineTitle.textContent = p.mode === 'year' ? '每月' + typeName : '每日' + typeName;
    elLineWrap.innerHTML =
      chart.html +
      '<div class="chart-tip" id="lineTip"></div>';
    var peak = Math.max.apply(null, ser.values.concat([0]));
    elLineSide.textContent = peak > 0 ? '最高 ' + UI.money(peak) : '';
    if (peak <= 0) {
      elLineWrap.innerHTML =
        chart.html +
        '<div class="chart-empty over">本期还没有' + typeName + '记录</div><div class="chart-tip" id="lineTip"></div>';
    } else {
      elLineWrap.innerHTML = chart.html + '<div class="chart-tip" id="lineTip"></div>';
    }
    elLineHint.textContent =
      ser.step === 'year' ? '点月份看当月总额' : '点折线上的点，看具体金额';

    /* 环形图 */
    var items = byCategory(recs);
    if (state.selCat) {
      var still = items.some(function (it) {
        return it.cat === state.selCat;
      });
      if (!still) state.selCat = null;
    }
    paintDonut(items, total, recs.length);

    /* 柱状图 */
    if (state.winEnd == null) state.winEnd = p.idx;
    if (p.idx > state.winEnd) state.winEnd = p.idx;
    if (p.idx < state.winEnd - 4) state.winEnd = p.idx;

    var bars = [];
    for (var i = 4; i >= 0; i--) {
      var bp = periodFromIdx(state.mode, state.winEnd - i);
      var br = recordsOf(bp).filter(function (r) {
        return r.type === state.type;
      });
      bars.push({ p: bp, total: sum(br), idx: bp.idx });
    }
    paintBars(bars, p.idx);

    elBarTitle.textContent =
      '近 5 ' + (state.mode === 'week' ? '周' : state.mode === 'month' ? '个月' : '年') + typeName + '对比';
    elBarSide.textContent = '点柱子看单笔';

    /* 排行 */
    elRankHead.textContent = p.label + ' · 单笔排行';
    paintRank(recs);
  }

  function byCategory(recs) {
    var map = {};
    var total = 0;
    recs.forEach(function (r) {
      map[r.cat] = (map[r.cat] || 0) + r.amount;
      total += r.amount;
    });
    return Object.keys(map)
      .map(function (k) {
        var c = Icons.get(k);
        return {
          cat: k,
          name: c.name,
          amount: map[k],
          pct: total ? map[k] / total : 0
        };
      })
      .sort(function (a, b) {
        return b.amount - a.amount;
      })
      .map(function (it, i) {
        it.color = sliceColor(i);
        return it;
      });
  }

  function paintBars(bars, selIdx) {
    var max = Math.max.apply(null, bars.map(function (b) {
      return b.total;
    }).concat([1]));
    elBarScroll.innerHTML =
      '<div class="bar-track">' +
      bars
        .map(function (b) {
          var h = b.total > 0 ? Math.max((b.total / max) * 100, 6) : 0;
          return (
            '<button class="bar-item' + (b.idx === selIdx ? ' on' : '') + '" data-idx="' + b.idx + '">' +
            '<span class="bar-val">' + (b.total > 0 ? UI.shortMoney(b.total) : '—') + '</span>' +
            '<span class="bar-col"><i style="height:' + h.toFixed(1) + '%"></i></span>' +
            '<span class="bar-lb">' + b.p.bar + '</span>' +
            '</button>'
          );
        })
        .join('') +
      '</div>';
    centerBar(false);
  }

  function centerBar(smooth) {
    var on = elBarScroll.querySelector('.bar-item.on');
    if (!on) return;
    var r = on.getBoundingClientRect();
    var c = elBarScroll.getBoundingClientRect();
    var left = elBarScroll.scrollLeft + (r.left + r.width / 2) - (c.left + c.width / 2);
    var maxLeft = elBarScroll.scrollWidth - elBarScroll.clientWidth;
    left = Math.max(0, Math.min(left, maxLeft));
    if (elBarScroll.scrollTo) {
      elBarScroll.scrollTo({ left: left, behavior: smooth ? 'smooth' : 'auto' });
    } else {
      elBarScroll.scrollLeft = left;
    }
  }

  /* ---------------- 交互 ---------------- */
  elMode.addEventListener('click', function (e) {
    var b = e.target.closest('.rep-tab');
    if (!b) return;
    state.mode = b.getAttribute('data-mode');
    state.winEnd = null;
    state.selCat = null;
    render();
  });

  elType.addEventListener('click', function (e) {
    var b = e.target.closest('.rep-seg-btn');
    if (!b) return;
    state.type = b.getAttribute('data-type');
    state.selCat = null;
    render();
  });

  elLabel.addEventListener('click', function () {
    state.date = new Date();
    state.winEnd = null;
    state.selCat = null;
    render();
    UI.toast('已回到本期');
  });

  document.getElementById('repPrev').addEventListener('click', function () {
    move(-1);
  });
  document.getElementById('repNext').addEventListener('click', function () {
    move(1);
  });

  function move(dir) {
    var p = periodOf(state.mode, state.date);
    var target = periodFromIdx(state.mode, p.idx + dir);
    state.date = target.start;
    state.selCat = null;
    render();
  }

  elDonut.addEventListener('click', function (e) {
    var seg = e.target.closest('[data-cat]');
    if (seg) {
      var cat = seg.getAttribute('data-cat');
      state.selCat = state.selCat === cat ? null : cat;
      renderDonutOnly();
      return;
    }
    if (e.target.closest('#donutCenter')) {
      state.selCat = null;
      renderDonutOnly();
    }
  });

  elLegend.addEventListener('click', function (e) {
    var row = e.target.closest('.lg-row');
    if (!row) return;
    var cat = row.getAttribute('data-cat');
    state.selCat = state.selCat === cat ? null : cat;
    renderDonutOnly();
  });

  function renderDonutOnly() {
    var p = periodOf(state.mode, state.date);
    var recs = recordsOf(p).filter(function (r) {
      return r.type === state.type;
    });
    paintDonut(byCategory(recs), sum(recs), recs.length);
  }

  elBarScroll.addEventListener('click', function (e) {
    var b = e.target.closest('.bar-item');
    if (!b) return;
    var idx = +b.getAttribute('data-idx');
    var target = periodFromIdx(state.mode, idx);
    state.date = target.start;
    state.selCat = null;
    render();
    centerBar(true);
    UI.toast(target.label);
  });

  /* ---------------- 对外 ---------------- */
  bindLine();

  window.Report = {
    render: render,
    state: state
  };

  render();
})();
