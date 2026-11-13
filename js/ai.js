/* =========================================================
   智能记账：一句话 -> 一条账
   本地规则优先，配置了大模型接口则优先走接口
   ========================================================= */
(function () {
  var sheet = document.getElementById('aiSheet');
  var textarea = document.getElementById('aiText');
  var chips = document.getElementById('aiChips');
  var resultEl = document.getElementById('aiResult');
  var cur = null; // 当前解析结果

  function open() {
    resultEl.innerHTML = '';
    textarea.value = '';
    cur = null;
    UI.openSheet('aiSheet');
  }

  function render() {
    if (!cur) return;
    var isInc = cur.type === 'income';
    var cats = CATS[cur.type];
    var catList = cats
      .map(function (c) {
        return (
          '<button data-cat="' +
          c.id +
          '" class="' +
          (c.id === cur.cat ? 'on' : '') +
          '"><span class="mini-ic" style="background:' +
          c.color +
          '22;color:' +
          c.color +
          '">' +
          Icons.svg(c.id) +
          '</span>' +
          c.name +
          '</button>'
        );
      })
      .join('');

    var dateText =
      cur.isToday
        ? '今天'
        : cur.dateLabel +
          ' ' +
          (cur.week || '');
    var engine = cur.engine === 'llm' ? '大模型解析' : '本地规则解析';
    var hint = cur.catMatched ? '' : '未识别分类，先放在「其他」';

    resultEl.innerHTML =
      '<div class="ai-preview">' +
      '<div class="ai-preview-head">' +
      '<div>' +
      '<div class="ai-amount' +
      (isInc ? ' inc' : '') +
      '">' +
      (isInc ? '+' : '-') +
      '¥' +
      UI.num(cur.amount) +
      '</div>' +
      '<div class="ai-meta"><span class="ai-tag">' +
      engine +
      '</span>' +
      dateText +
      ' ' +
      cur.time +
      '</div>' +
      '</div>' +
      '<div class="ai-type-toggle">' +
      '<button data-type="expense" class="' +
      (!isInc ? 'on' : '') +
      '">支出</button>' +
      '<button data-type="income" class="' +
      (isInc ? 'on' : '') +
      '">收入</button>' +
      '</div>' +
      '</div>' +
      '<div class="ai-row"><span class="ai-row-label">分类</span><div class="ai-cats">' +
      catList +
      '</div></div>' +
      '<div class="ai-row"><span class="ai-row-label">备注</span><input class="ai-note-input" id="aiNote" maxlength="24" value="' +
      UI.escapeHtml(cur.note || '') +
      '" placeholder="补充一点备注" /></div>' +
      (hint ? '<div class="ai-meta"><span class="ai-tag">提示</span>' + hint + '</div>' : '') +
      '<div class="ai-actions">' +
      '<button class="btn-ghost" data-act="cancel">再看看</button>' +
      '<button class="btn-primary" data-act="confirm">确认录入</button>' +
      '</div>' +
      '</div>';
  }

  function doParse() {
    var text = textarea.value.trim();
    if (!text) {
      UI.toast('先说一句话吧');
      return;
    }
    var cfg = Store.settings().ai || {};

    function local() {
      var r = Parser.parse(text);
      if (!r.ok) {
        resultEl.innerHTML = '<div class="ai-hint">' + UI.escapeHtml(r.error) + '</div>';
        return;
      }
      cur = r;
      render();
    }

    if (cfg.endpoint && cfg.apiKey) {
      resultEl.innerHTML = '<div class="ai-hint">大模型解析中…</div>';
      Parser.parseWithLLM(text, cfg)
        .then(function (r) {
          cur = r;
          render();
        })
        .catch(function (err) {
          console.warn(err);
          UI.toast('接口失败，已用本地规则');
          local();
        });
    } else {
      local();
    }
  }

  document.getElementById('btnParse').addEventListener('click', doParse);

  chips.addEventListener('click', function (e) {
    var c = e.target.closest('.chip');
    if (!c) return;
    textarea.value = c.textContent.trim();
    doParse();
  });

  resultEl.addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t) return;

    if (t.hasAttribute('data-type')) {
      var type = t.getAttribute('data-type');
      if (type !== cur.type) {
        cur.type = type;
        var list = CATS[type];
        var ok = list.some(function (c) {
          return c.id === cur.cat;
        });
        if (!ok) cur.cat = list[list.length - 1].id;
        cur.catMatched = ok;
        render();
      }
      return;
    }

    if (t.hasAttribute('data-cat')) {
      cur.cat = t.getAttribute('data-cat');
      cur.catMatched = true;
      var noteEl = document.getElementById('aiNote');
      cur.note = noteEl ? noteEl.value : cur.note;
      render();
      return;
    }

    var act = t.getAttribute('data-act');
    if (act === 'cancel') {
      resultEl.innerHTML = '';
      cur = null;
      textarea.focus();
      return;
    }
    if (act === 'confirm') {
      var noteEl2 = document.getElementById('aiNote');
      var note = noteEl2 ? noteEl2.value.trim() : cur.note;
      Store.add({
        type: cur.type,
        cat: cur.cat,
        amount: cur.amount,
        note: note,
        date: cur.date,
        time: cur.time,
        source: 'smart'
      });
      App.refreshAll();
      UI.closeSheet('aiSheet');
      Ledger.setMonth(UI.parseYmd(cur.date).getFullYear(), UI.parseYmd(cur.date).getMonth());
      setTimeout(function () {
        UI.toast('已记上：' + (cur.type === 'income' ? '+' : '-') + UI.money(cur.amount), 'ok');
      }, 300);
      resultEl.innerHTML = '';
      cur = null;
    }
  });

  resultEl.addEventListener('input', function (e) {
    if (e.target.id === 'aiNote' && cur) cur.note = e.target.value;
  });

  window.Ai = { open: open };
})();
