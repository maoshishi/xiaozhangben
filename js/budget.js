/* =========================================================
   预算 + 超支拦截 + 检讨书
   超支后全屏锁定，上传手写检讨书才解锁
   ========================================================= */
(function () {
  /* ---------- 元素 ---------- */
  var btn = document.getElementById('btnBudget');

  var sheet = document.getElementById('budgetSheet');
  var sheetTitle = document.getElementById('budgetTitle');
  var dailyInput = document.getElementById('budgetDaily');
  var monthlyInput = document.getElementById('budgetMonthly');
  var dailyNow = document.getElementById('budgetDailyNow');
  var monthlyNow = document.getElementById('budgetMonthlyNow');
  var toggle = document.getElementById('budgetToggle');
  var saveBtn = document.getElementById('budgetSave');

  var gate = document.getElementById('pledgeGate');
  var pgSub = document.getElementById('pgSub');
  var pgAmounts = document.getElementById('pgAmounts');
  var pgFile = document.getElementById('pledgeFile');
  var pgEmpty = document.getElementById('pgUploadEmpty');
  var pgPreview = document.getElementById('pgPreview');
  var pgImg = document.getElementById('pgPreviewImg');
  var pgReselect = document.getElementById('pgReselect');
  var pgNote = document.getElementById('pgNote');
  var pgSubmit = document.getElementById('pgSubmit');
  var pgUndo = document.getElementById('pgUndo');

  var viewer = document.getElementById('imageViewer');
  var ivImg = document.getElementById('ivImg');
  var ivFoot = document.getElementById('ivFoot');

  var pending = { image: '', w: 0, h: 0 };
  var formEnabled = false;

  /* ---------- 小工具 ---------- */
  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function nowHM() {
    var d = new Date();
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  function monthKey(dateStr) {
    return String(dateStr || '').slice(0, 7);
  }

  /* 100 -> ¥100，12.5 -> ¥12.50 */
  function moneyShort(n) {
    n = Number(n) || 0;
    if (n % 1 === 0) return '¥' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return '¥' + UI.num(n);
  }

  /* ---------- 状态 ---------- */
  function status() {
    var b = Store.budget();
    var t = todayStr();
    var mk = monthKey(t);
    var todayExp = Store.total(Store.byDate(t), 'expense');
    var monthExp = Store.total(Store.byMonthKey(mk), 'expense');

    var dayOver = b.daily > 0 && todayExp > b.daily;
    var monthOver = b.monthly > 0 && monthExp > b.monthly;

    var list = Store.pledges();
    var dayPledged = list.some(function (p) {
      return p.date === t && p.scope.indexOf('day') >= 0;
    });
    var monthPledged = list.some(function (p) {
      return monthKey(p.date) === mk && p.scope.indexOf('month') >= 0;
    });

    return {
      enabled: b.enabled,
      daily: b.daily,
      monthly: b.monthly,
      todayExp: todayExp,
      monthExp: monthExp,
      dayOver: dayOver,
      monthOver: monthOver,
      dayNeed: b.enabled && dayOver && !dayPledged,
      monthNeed: b.enabled && monthOver && !monthPledged,
      dayOverAmt: dayOver ? todayExp - b.daily : 0,
      monthOverAmt: monthOver ? monthExp - b.monthly : 0
    };
  }

  function locked() {
    var s = status();
    return s.dayNeed || s.monthNeed;
  }

  /* 记账页汇总下面的小字 */
  function label(spent, limit) {
    if (!(limit > 0)) return null;
    if (spent > limit) {
      return { text: '超 ' + moneyShort(spent - limit), cls: 'over' };
    }
    var pct = spent / limit;
    return {
      text: '预算 ' + moneyShort(limit) + ' · 剩 ' + moneyShort(limit - spent),
      cls: pct >= 0.8 ? 'warn' : ''
    };
  }

  /* ---------- 顶部按钮 ---------- */
  function paintBtn() {
    if (!btn) return;
    btn.classList.toggle('on', Store.budget().enabled);
  }

  /* ---------- 预算设置弹层 ---------- */
  function openSheet() {
    var b = Store.budget();
    formEnabled = b.enabled;
    sheetTitle.textContent = b.enabled ? '预算提醒' : '开通预算提醒';
    dailyInput.value = b.daily > 0 ? String(b.daily) : '';
    monthlyInput.value = b.monthly > 0 ? String(b.monthly) : '';
    toggle.setAttribute('aria-checked', formEnabled ? 'true' : 'false');
    var s = status();
    dailyNow.textContent = '今天已花 ' + UI.money(s.todayExp);
    monthlyNow.textContent = '本月已花 ' + UI.money(s.monthExp);
    UI.openSheet('budgetSheet');
  }

  function save() {
    var d = Math.max(0, Number(dailyInput.value) || 0);
    var m = Math.max(0, Number(monthlyInput.value) || 0);
    if (formEnabled && d <= 0 && m <= 0) {
      UI.toast('至少给今日或本月设一个上限');
      return;
    }
    Store.setBudget({ enabled: formEnabled, daily: d, monthly: m });
    UI.closeSheet('budgetSheet');
    if (window.App) App.refreshAll();
    else check();
    UI.toast(formEnabled ? '预算已开启' : '预算提醒已关闭', 'ok');
  }

  /* ---------- 拦截层 ---------- */
  function barRow(name, spent, limit, over) {
    var pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
    return (
      '<div class="pg-line">' +
      '<div class="pg-line-top">' +
      '<span>' + name + '已花</span>' +
      '<b class="' + (over ? 'over' : '') + '">' + UI.money(spent) + '</b>' +
      '<em>预算 ' + moneyShort(limit) + '</em>' +
      '</div>' +
      '<div class="pg-bar"><i class="' + (over ? 'over' : '') + '" style="width:' + pct.toFixed(1) + '%"></i></div>' +
      '</div>'
    );
  }

  function renderGate() {
    var s = status();
    var parts = [];
    if (s.dayNeed) parts.push('今日超支 ' + UI.money(s.dayOverAmt));
    if (s.monthNeed) parts.push('本月超支 ' + UI.money(s.monthOverAmt));
    pgSub.textContent = parts.join(' · ');

    var html = '';
    if (s.daily > 0) html += barRow('今日', s.todayExp, s.daily, s.dayOver);
    if (s.monthly > 0) html += barRow('本月', s.monthExp, s.monthly, s.monthOver);
    pgAmounts.innerHTML = html;

    renderUndo();
  }

  /* 超支是「刚才那笔」造成的，允许撤销，避免被锁死 */
  function renderUndo() {
    var s = status();
    var todayExpList = Store.byDate(todayStr())
      .filter(function (r) {
        return r.type === 'expense';
      })
      .sort(function (a, b) {
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    var last = todayExpList[0];
    var ok = false;
    if (last) {
      var t = s.todayExp - last.amount;
      var m = s.monthExp - (monthKey(last.date) === monthKey(todayStr()) ? last.amount : 0);
      ok = !(s.daily > 0 && t > s.daily) && !(s.monthly > 0 && m > s.monthly);
    }
    pgUndo.hidden = !ok;
    if (ok) {
      var name = (last.note || '').trim() || Icons.get(last.cat).name;
      pgUndo.textContent = '撤销刚才那笔「' + name + ' -¥' + UI.num(last.amount) + '」';
    }
  }

  function showGate() {
    if (gate.classList.contains('open')) {
      renderGate();
      return;
    }
    pending = { image: '', w: 0, h: 0 };
    pgNote.value = '';
    pgFile.value = '';
    pgImg.removeAttribute('src');
    pgPreview.hidden = true;
    pgEmpty.hidden = false;
    pgReselect.hidden = true;
    pgSubmit.disabled = true;
    renderGate();

    /* 拦截时把底下开着的弹层收掉，避免解锁后弹层又冒出来 */
    Array.prototype.forEach.call(document.querySelectorAll('.sheet.open'), function (s) {
      if (s.id) UI.closeSheet(s.id);
    });

    gate.classList.add('open');
    gate.setAttribute('aria-hidden', 'false');
    document.body.classList.add('pledge-locked');
    document.body.style.overflow = 'hidden';
  }

  function hideGate() {
    gate.classList.remove('open');
    gate.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('pledge-locked');
    if (!document.querySelector('.sheet.open')) document.body.style.overflow = '';
  }

  /* ---------- 图片：压缩后存 base64 ---------- */
  function handleFile(file) {
    if (!file) return;
    if (file.type && file.type.indexOf('image/') !== 0) {
      UI.toast('请选择一张图片');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      UI.toast('图片太大了，换一张');
      return;
    }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var max = 1000;
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      var scale = Math.min(1, max / Math.max(w, h));
      w = Math.max(1, Math.round(w * scale));
      h = Math.max(1, Math.round(h * scale));

      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      var data;
      try {
        data = canvas.toDataURL('image/jpeg', 0.68);
      } catch (e) {
        UI.toast('图片处理失败，换一张试试');
        URL.revokeObjectURL(url);
        return;
      }
      URL.revokeObjectURL(url);

      pending = { image: data, w: w, h: h };
      pgImg.src = data;
      pgPreview.hidden = false;
      pgEmpty.hidden = true;
      pgReselect.hidden = false;
      pgSubmit.disabled = false;
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      UI.toast('这张图读不了，换个格式再试');
    };
    img.src = url;
  }

  function submit() {
    if (!pending.image) {
      UI.toast('先上传检讨书照片');
      return;
    }
    var s = status();
    var scope = [];
    if (s.dayOver) scope.push('day');
    if (s.monthOver) scope.push('month');

    Store.addPledge({
      date: todayStr(),
      time: nowHM(),
      image: pending.image,
      w: pending.w,
      h: pending.h,
      note: pgNote.value.trim(),
      scope: scope,
      overDay: s.dayOverAmt,
      overMonth: s.monthOverAmt
    });

    hideGate();
    if (window.App) App.refreshAll();
    UI.toast('检讨书已提交，继续加油 💪', 'ok');
  }

  function undoLast() {
    var list = Store.byDate(todayStr())
      .filter(function (r) {
        return r.type === 'expense';
      })
      .sort(function (a, b) {
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    var last = list[0];
    if (!last) return;
    UI.confirm({
      title: '撤销这一笔？',
      text: '「' + ((last.note || '').trim() || Icons.get(last.cat).name) + ' -¥' + UI.num(last.amount) + '」删掉后就不会超支了。',
      okText: '撤销'
    }).then(function (ok) {
      if (!ok) return;
      Store.remove(last.id);
      if (window.App) App.refreshAll();
      else check();
      UI.toast('已撤销', 'ok');
    });
  }

  /* ---------- 看图 ---------- */
  function openViewer(id) {
    var p = Store.getPledge(id);
    if (!p) return;
    ivImg.src = p.image;
    var foot = UI.dateLabel(p.date) + ' ' + p.time;
    if (p.note) foot += ' · ' + p.note;
    ivFoot.textContent = foot;
    viewer.classList.add('open');
    viewer.setAttribute('aria-hidden', 'false');
  }

  function closeViewer() {
    viewer.classList.remove('open');
    viewer.setAttribute('aria-hidden', 'true');
    ivImg.removeAttribute('src');
  }

  /* ---------- 对外检查 ---------- */
  function check() {
    paintBtn();
    if (locked()) showGate();
    else if (gate.classList.contains('open')) hideGate();
  }

  /* ---------- 绑定 ---------- */
  if (btn) btn.addEventListener('click', openSheet);
  if (toggle) {
    toggle.addEventListener('click', function () {
      formEnabled = !formEnabled;
      toggle.setAttribute('aria-checked', formEnabled ? 'true' : 'false');
      if (formEnabled && !dailyInput.value && !monthlyInput.value) dailyInput.focus();
    });
  }
  if (saveBtn) saveBtn.addEventListener('click', save);

  if (pgFile) {
    pgFile.addEventListener('change', function () {
      handleFile(pgFile.files && pgFile.files[0]);
    });
  }
  if (pgReselect) {
    pgReselect.addEventListener('click', function () {
      pgFile.value = '';
      pgFile.click();
    });
  }
  if (pgSubmit) pgSubmit.addEventListener('click', submit);
  if (pgUndo) pgUndo.addEventListener('click', undoLast);

  if (viewer) {
    viewer.addEventListener('click', closeViewer);
  }

  window.Budget = {
    status: status,
    locked: locked,
    check: check,
    label: label,
    openSheet: openSheet,
    openViewer: openViewer
  };
})();
