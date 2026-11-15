/* =========================================================
   记账页：按月 / 按天分组
   ========================================================= */
(function () {
  var now = new Date();
  var view = { y: now.getFullYear(), m: now.getMonth() };

  var elLabel = document.getElementById('monthLabel');
  var elLabelText = document.getElementById('monthLabelText');
  var elSub = document.getElementById('pageSub');
  var elList = document.getElementById('dayList');
  var elToday = document.getElementById('sumToday');
  var elExp = document.getElementById('sumMonthExp');
  var elInc = document.getElementById('sumMonthInc');
  var elTodayBudget = document.getElementById('sumTodayBudget');
  var elMonthBudget = document.getElementById('sumMonthBudget');

  function groupByDate(list) {
    var map = {};
    var order = [];
    list.forEach(function (r) {
      if (!map[r.date]) {
        map[r.date] = [];
        order.push(r.date);
      }
      map[r.date].push(r);
    });
    order.sort().reverse();
    return order.map(function (d) {
      return { date: d, items: map[d] };
    });
  }

  /* 检讨书行（排在当天所有记录前面） */
  function pledgeRow(p) {
    var sub = p.time || '';
    var over = [];
    if (p.overDay > 0) over.push('今日超 ' + UI.money(p.overDay));
    if (p.overMonth > 0) over.push('本月超 ' + UI.money(p.overMonth));
    sub += (sub ? ' | ' : '') + (over.join(' · ') || '超支检讨');
    if (p.note) sub += ' · ' + p.note;

    return (
      '<div class="rec pledge" data-pledge="' +
      p.id +
      '">' +
      '<span class="pledge-thumb"><img src="' +
      p.image +
      '" alt="检讨书" loading="lazy"/></span>' +
      '<div class="rec-main">' +
      '<div class="rec-top"><span class="rec-cat">检讨书</span>' +
      '<span class="rec-badge warn">超支</span></div>' +
      '<div class="rec-sub">' +
      UI.escapeHtml(sub) +
      '</div>' +
      '</div>' +
      '<span class="pledge-more">查看</span>' +
      '</div>'
    );
  }

  /* 汇总下面的预算小字 */
  function paintBudget(todayExp, monthExp) {
    var b = Store.budget();

    function put(el, spent, limit) {
      if (!el) return;
      if (!b.enabled || !(limit > 0) || !window.Budget) {
        el.textContent = '';
        el.className = 'sum-budget';
        return;
      }
      var l = Budget.label(spent, limit);
      el.textContent = l ? l.text : '';
      el.className = 'sum-budget' + (l && l.cls ? ' ' + l.cls : '');
    }

    put(elTodayBudget, todayExp, b.daily);
    put(elMonthBudget, monthExp, b.monthly);
  }

  function rowHtml(r) {
    var isIncome = r.type === 'income';
    var cat = Icons.get(r.cat);
    var badge = '';
    if (r.source === 'smart') badge = '<span class="rec-badge">智能记账</span>';
    else if (r.source === 'sample') badge = '<span class="rec-badge">示例</span>';
    else if (r.source === 'import') badge = '<span class="rec-badge">导入</span>';

    var sub = r.time || '';
    if (r.note) sub += (sub ? ' | ' : '') + r.note;

    return (
      '<div class="rec" data-id="' +
      r.id +
      '">' +
      Icons.chip(r.cat) +
      '<div class="rec-main">' +
      '<div class="rec-top"><span class="rec-cat">' +
      UI.escapeHtml(cat.name) +
      '</span>' +
      badge +
      '</div>' +
      '<div class="rec-sub">' +
      UI.escapeHtml(sub) +
      '</div>' +
      '</div>' +
      '<div class="rec-amt' +
      (isIncome ? ' inc' : '') +
      '">' +
      (isIncome ? '+' : '-') +
      UI.num(r.amount) +
      '</div>' +
      '</div>'
    );
  }

  function render() {
    var list = Store.byMonth(view.y, view.m);

    elLabelText.textContent = view.y + '年' + (view.m + 1) + '月';

    var expSum = Store.total(list, 'expense');
    var incSum = Store.total(list, 'income');

    elSub.textContent = list.length
      ? '本月收 ' + UI.money(incSum) + ' · 支 ' + UI.money(expSum)
      : '本月还没有记录，点下面 ＋ 记一笔';

    var todayStr = Store.today();
    var todayExp = Store.total(Store.byDate(todayStr), 'expense');
    elToday.textContent = UI.money(todayExp);
    elExp.textContent = UI.money(expSum);
    elInc.textContent = UI.money(incSum);
    paintBudget(todayExp, expSum);

    if (!list.length) {
      elList.innerHTML =
        '<div class="empty">' +
        '<div class="empty-art">' +
        '<svg viewBox="0 0 120 100" fill="none">' +
        '<ellipse cx="60" cy="84" rx="34" ry="6" fill="#F1EFFB"/>' +
        '<rect x="34" y="24" width="52" height="52" rx="14" fill="#F3F0FF"/>' +
        '<rect x="44" y="40" width="18" height="4" rx="2" fill="#D9D1FA"/>' +
        '<rect x="44" y="50" width="30" height="4" rx="2" fill="#E4DFF9"/>' +
        '<rect x="44" y="60" width="24" height="4" rx="2" fill="#E4DFF9"/>' +
        '<circle cx="86" cy="30" r="11" fill="#E8F5FD"/>' +
        '<path d="M86 25v10M81 30h10" stroke="#9DD2F4" stroke-width="2.4" stroke-linecap="round"/>' +
        '</svg>' +
        '</div>' +
        '<h3>这个月还是空白的</h3>' +
        '<p>点底部的「记一笔」，或者试试右下角的<br/>智能记账，说一句话就好</p>' +
        '</div>';
      return;
    }

    var groups = groupByDate(list);
    var html = '';
    groups.forEach(function (g, gi) {
      var exp = Store.total(g.items, 'expense');
      var inc = Store.total(g.items, 'income');
      var tag = UI.dateTag(g.date);

      html +=
        '<div class="day-card" style="animation-delay:' +
        Math.min(gi * 22, 160) +
        'ms">' +
        '<div class="day-head">' +
        '<div class="day-date">' +
        UI.dateLabel(g.date) +
        '<span class="day-tag' +
        (tag.today ? ' today' : '') +
        '">' +
        tag.text +
        '</span>' +
        '</div>' +
        '<div class="day-totals">' +
        '<span>支 <b>' +
        UI.num(exp) +
        '</b></span>' +
        '<span class="inc">收 <b>' +
        UI.num(inc) +
        '</b></span>' +
        '</div>' +
        '</div>' +
        '<div class="day-head-divider"></div>' +
        Store.pledges(g.date).map(pledgeRow).join('') +
        g.items.map(rowHtml).join('') +
        '</div>';
    });

    elList.innerHTML = html;
  }

  function goMonth(delta) {
    view.m += delta;
    if (view.m < 0) {
      view.m = 11;
      view.y--;
    } else if (view.m > 11) {
      view.m = 0;
      view.y++;
    }
    render();
  }

  function setMonth(y, m) {
    view.y = y;
    view.m = m;
    render();
  }

  document.getElementById('prevMonth').addEventListener('click', function () {
    goMonth(-1);
  });
  document.getElementById('nextMonth').addEventListener('click', function () {
    goMonth(1);
  });

  /* 点击记录 */
  elList.addEventListener('click', function (e) {
    var pl = e.target.closest('.pledge');
    if (pl) {
      if (window.Budget) Budget.openViewer(pl.getAttribute('data-pledge'));
      return;
    }
    var row = e.target.closest('.rec');
    if (!row) return;
    App.openRecordActions(row.getAttribute('data-id'));
  });

  /* ---------- 月份选择器 ---------- */
  var pickerEl = document.getElementById('monthPicker');
  var pickerYearEl = document.getElementById('pickerYear');
  var pickerMonths = document.getElementById('pickerMonths');
  var pickerYear = view.y;

  function two(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function paintPicker() {
    var now = new Date();
    var nowY = now.getFullYear();
    var nowM = now.getMonth();
    var withData = {};
    Store.months().forEach(function (k) {
      withData[k] = 1;
    });

    pickerYearEl.textContent = pickerYear + '年';

    var html = '';
    for (var i = 0; i < 12; i++) {
      var key = pickerYear + '-' + two(i + 1);
      var cls = 'picker-month';
      if (pickerYear === view.y && i === view.m) cls += ' on';
      if (pickerYear === nowY && i === nowM) cls += ' today';
      if (withData[key]) cls += ' has-data';
      html +=
        '<button class="' +
        cls +
        '" data-m="' +
        i +
        '" aria-label="' +
        (i + 1) +
        '月"><span>' +
        (i + 1) +
        '月</span><i class="pm-dot"></i></button>';
    }
    pickerMonths.innerHTML = html;
  }

  function openPicker() {
    pickerYear = view.y;
    paintPicker();
    pickerEl.classList.add('open');
    pickerEl.setAttribute('aria-hidden', 'false');
  }

  function closePicker() {
    pickerEl.classList.remove('open');
    pickerEl.setAttribute('aria-hidden', 'true');
  }

  elLabel.addEventListener('click', openPicker);

  document.getElementById('pickerBackdrop').addEventListener('click', closePicker);

  document.getElementById('pickerPrevYear').addEventListener('click', function () {
    pickerYear--;
    paintPicker();
  });

  document.getElementById('pickerNextYear').addEventListener('click', function () {
    pickerYear++;
    paintPicker();
  });

  pickerMonths.addEventListener('click', function (e) {
    var b = e.target.closest('.picker-month');
    if (!b) return;
    setMonth(pickerYear, +b.getAttribute('data-m'));
    closePicker();
  });

  document.getElementById('pickerThisMonth').addEventListener('click', function () {
    var d = new Date();
    pickerYear = d.getFullYear();
    setMonth(d.getFullYear(), d.getMonth());
    closePicker();
  });

  window.Ledger = {
    render: render,
    goMonth: goMonth,
    setMonth: setMonth,
    view: view
  };

  Ledger.render();
})();
