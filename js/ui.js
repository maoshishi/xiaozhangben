/* =========================================================
   通用 UI：Toast / 弹层 / 确认框 / 数字格式化
   ========================================================= */
(function () {
  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  function toast(msg, type) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'toast show' + (type === 'ok' ? ' ok' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.className = 'toast';
    }, 1800);
  }

  function openSheet(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeSheet(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.sheet.open')) document.body.style.overflow = '';
  }

  function closeAllSheets() {
    document.querySelectorAll('.sheet.open').forEach(function (s) {
      s.classList.remove('open');
      s.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
  }

  /* 确认框 */
  var pendingResolve = null;
  function confirmBox(opts) {
    opts = opts || {};
    var modal = document.getElementById('confirmModal');
    document.getElementById('confirmTitle').textContent = opts.title || '提示';
    document.getElementById('confirmText').textContent = opts.text || '';
    document.getElementById('confirmOk').textContent = opts.okText || '确定';
    document.getElementById('confirmCancel').textContent = opts.cancelText || '取消';
    document.getElementById('confirmCancel').style.display = opts.hideCancel ? 'none' : '';
    modal.classList.add('open');
    return new Promise(function (resolve) {
      pendingResolve = resolve;
    });
  }

  document.getElementById('confirmOk').addEventListener('click', function () {
    document.getElementById('confirmModal').classList.remove('open');
    if (pendingResolve) pendingResolve(true);
    pendingResolve = null;
  });
  document.getElementById('confirmCancel').addEventListener('click', function () {
    document.getElementById('confirmModal').classList.remove('open');
    if (pendingResolve) pendingResolve(false);
    pendingResolve = null;
  });

  /* 点遮罩关闭 */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-close]');
    if (t) closeSheet(t.getAttribute('data-close'));
  });

  /* ---------- 格式化 ---------- */
  function num(n) {
    var v = Number(n) || 0;
    var parts = v.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  function money(n) {
    return '¥' + num(n);
  }

  function shortMoney(n) {
    var v = Number(n) || 0;
    if (v >= 10000) return (v / 10000).toFixed(v % 10000 === 0 ? 0 : 1) + '万';
    return num(v);
  }

  var WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  function parseYmd(s) {
    var p = String(s || '').split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function dateKey(d) {
    var pad = function (n) {
      return n < 10 ? '0' + n : '' + n;
    };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /** "11月13日" */
  function dateLabel(s) {
    var d = parseYmd(s);
    return d.getMonth() + 1 + '月' + d.getDate() + '日';
  }

  /** 今日 / 昨日 / 周三 */
  function dateTag(s) {
    var today = new Date();
    var t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var d = parseYmd(s);
    var diff = Math.round((t0 - d) / 864e5);
    if (diff === 0) return { text: '今日', today: true };
    if (diff === 1) return { text: '昨日', today: false };
    if (diff === 2) return { text: '前天', today: false };
    return { text: WEEK[d.getDay()], today: false };
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  window.UI = {
    toast: toast,
    openSheet: openSheet,
    closeSheet: closeSheet,
    closeAllSheets: closeAllSheets,
    confirm: confirmBox,
    num: num,
    money: money,
    shortMoney: shortMoney,
    dateLabel: dateLabel,
    dateTag: dateTag,
    parseYmd: parseYmd,
    dateKey: dateKey,
    escapeHtml: escapeHtml,
    WEEK: WEEK
  };
})();
