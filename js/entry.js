/* =========================================================
   记一笔：分类九宫格 + 自绘数字键盘
   ========================================================= */
(function () {
  var sheet = document.getElementById('entrySheet');
  var typeSeg = document.getElementById('typeSeg');
  var catGrid = document.getElementById('catGrid');
  var amountText = document.getElementById('amountText');
  var exprText = document.getElementById('exprText');
  var noteInput = document.getElementById('noteInput');
  var datePillText = document.getElementById('datePillText');
  var timePillText = document.getElementById('timePillText');
  var dateInput = document.getElementById('dateInput');
  var timeInput = document.getElementById('timeInput');

  var pad2 = function (n) {
    return n < 10 ? '0' + n : '' + n;
  };

  function nowHM() {
    var d = new Date();
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  var state = {
    type: 'expense',
    cat: 'food',
    raw: '0',
    acc: 0,
    pending: null,
    date: Store.today(),
    time: nowHM(),
    editingId: null
  };

  function val() {
    var v = parseFloat(state.raw);
    return isNaN(v) ? 0 : v;
  }

  function total() {
    var v = val();
    if (state.pending === '+') return state.acc + v;
    if (state.pending === '-') return state.acc - v;
    if (state.acc !== 0) return state.acc;
    return v;
  }

  function fmtInput(raw) {
    // 只保留两位小数
    if (raw.indexOf('.') >= 0) {
      var p = raw.split('.');
      p[1] = (p[1] || '').slice(0, 2);
      return p[0] + '.' + p[1];
    }
    return raw;
  }

  function paintAmount() {
    var raw = state.raw === '' ? '0' : state.raw;
    amountText.textContent = raw.replace(/\.$/, '.');
    if (state.pending) {
      exprText.textContent = UI.num(state.acc) + ' ' + (state.pending === '+' ? '+' : '−');
    } else {
      exprText.textContent = '';
    }
  }

  function paintCats() {
    var list = CATS[state.type];
    var html = list
      .map(function (c) {
        return (
          '<button class="cat-item' +
          (c.id === state.cat ? ' selected' : '') +
          '" data-cat="' +
          c.id +
          '">' +
          Icons.chip(c.id) +
          '<span class="cat-name">' +
          c.name +
          '</span>' +
          '</button>'
        );
      })
      .join('');
    html +=
      '<button class="cat-item add" data-cat="__add">' +
      '<span class="cat-ic">' +
      Icons.svg('add') +
      '</span><span class="cat-name">添加</span></button>';
    catGrid.innerHTML = html;
  }

  function paintSeg() {
    typeSeg.querySelectorAll('.seg-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-type') === state.type);
    });
  }

  function paintDate() {
    var tag = UI.dateTag(state.date);
    var label = tag.text === '今日' || tag.text === '昨日' ? tag.text : UI.dateLabel(state.date);
    datePillText.textContent = label;
    timePillText.textContent = state.time;
    dateInput.value = state.date;
    timeInput.value = state.time;
  }

  function paintAll() {
    paintSeg();
    paintCats();
    paintDate();
    paintAmount();
  }

  function resetCalc() {
    state.raw = '0';
    state.acc = 0;
    state.pending = null;
  }

  function open(record) {
    if (record) {
      state.editingId = record.id;
      state.type = record.type;
      state.cat = record.cat;
      state.date = record.date;
      state.time = record.time;
      state.raw = String(record.amount);
      state.acc = 0;
      state.pending = null;
      noteInput.value = record.note || '';
    } else {
      state.editingId = null;
      state.type = 'expense';
      state.cat = 'food';
      state.date = Store.today();
      state.time = nowHM();
      resetCalc();
      noteInput.value = '';
    }
    paintAll();
    UI.openSheet('entrySheet');
    var scroller = sheet.querySelector('.cat-scroll');
    if (scroller) scroller.scrollTop = 0;
    if (record) {
      // 等弹层动画结束再滚动，否则量到的可视高度不准
      setTimeout(function () {
        if (!scroller) return;
        var sel = scroller.querySelector('.cat-item.selected');
        if (!sel) return;
        var sr = scroller.getBoundingClientRect();
        var ir = sel.getBoundingClientRect();
        var delta = ir.top + ir.height / 2 - (sr.top + sr.height / 2);
        scroller.scrollTop = Math.max(0, scroller.scrollTop + delta);
      }, 340);
    }
  }

  function close() {
    UI.closeSheet('entrySheet');
    if (!document.querySelector('.sheet.open')) {
      document.activeElement && document.activeElement.blur();
    }
  }

  /* ---------- 键盘 ---------- */
  function pushKey(k) {
    if (k === 'back') {
      state.raw = state.raw.length > 1 ? state.raw.slice(0, -1) : '0';
    } else if (k === 'add' || k === 'sub') {
      if (state.pending) {
        var v0 = val();
        state.acc = state.pending === '+' ? state.acc + v0 : state.acc - v0;
      } else {
        state.acc = val();
      }
      state.pending = k === 'add' ? '+' : '-';
      state.raw = '0';
    } else if (k === 'save') {
      save(false);
      return;
    } else if (k === 'again') {
      save(true);
      return;
    } else if (k === '.') {
      if (state.raw.indexOf('.') < 0) state.raw = (state.raw === '0' ? '0' : state.raw) + '.';
    } else {
      // 数字
      if (state.raw === '0') state.raw = k;
      else if (state.raw.replace('-', '').replace('.', '').length < 9) state.raw += k;
    }
    state.raw = fmtInput(state.raw);
    paintAmount();
  }

  document.getElementById('keypad').addEventListener('click', function (e) {
    var btn = e.target.closest('.key');
    if (!btn) return;
    pushKey(btn.getAttribute('data-k'));
  });

  document.addEventListener('keydown', function (e) {
    if (!sheet.classList.contains('open')) return;
    if (document.activeElement === noteInput) return;
    if (/^[0-9]$/.test(e.key)) pushKey(e.key);
    else if (e.key === '.') pushKey('.');
    else if (e.key === 'Backspace') pushKey('back');
    else if (e.key === 'Enter') pushKey('save');
    else if (e.key === '+' || e.key === '-') pushKey(e.key === '+' ? 'add' : 'sub');
  });

  /* ---------- 交互 ---------- */
  typeSeg.addEventListener('click', function (e) {
    var b = e.target.closest('.seg-btn');
    if (!b) return;
    state.type = b.getAttribute('data-type');
    var list = CATS[state.type];
    var exists = list.some(function (c) {
      return c.id === state.cat;
    });
    if (!exists) state.cat = list[0].id;
    paintSeg();
    paintCats();
  });

  catGrid.addEventListener('click', function (e) {
    var b = e.target.closest('.cat-item');
    if (!b) return;
    var id = b.getAttribute('data-cat');
    if (id === '__add') {
      if (window.CatSheet) CatSheet.open(state.type);
      return;
    }
    state.cat = id;
    paintCats();
  });

  document.getElementById('datePill').addEventListener('click', function () {
    dateInput.value = state.date;
    if (dateInput.showPicker) {
      try {
        dateInput.showPicker();
        return;
      } catch (err) {}
    }
    dateInput.click();
  });

  document.getElementById('timePill').addEventListener('click', function () {
    timeInput.value = state.time;
    if (timeInput.showPicker) {
      try {
        timeInput.showPicker();
        return;
      } catch (err) {}
    }
    timeInput.click();
  });

  dateInput.addEventListener('change', function () {
    if (dateInput.value) {
      state.date = dateInput.value;
      paintDate();
    }
  });

  timeInput.addEventListener('change', function () {
    if (timeInput.value) {
      state.time = timeInput.value;
      paintDate();
    }
  });

  document.getElementById('noteCam').addEventListener('click', function () {
    noteInput.focus();
    UI.toast('备注里可以写地点，例如「一食堂」');
  });

  /* ---------- 保存 ---------- */
  function save(again) {
    var amount = Math.round(total() * 100) / 100;
    if (!(amount > 0)) {
      UI.toast('请输入金额');
      return;
    }
    var note = noteInput.value.trim();

    if (state.editingId) {
      Store.update(state.editingId, {
        type: state.type,
        cat: state.cat,
        amount: amount,
        note: note,
        date: state.date,
        time: state.time
      });
      UI.toast('已修改', 'ok');
      App.refreshAll();
      close();
      return;
    }

    Store.add({
      type: state.type,
      cat: state.cat,
      amount: amount,
      note: note,
      date: state.date,
      time: state.time,
      source: 'manual'
    });

    App.refreshAll();

    if (again) {
      resetCalc();
      noteInput.value = '';
      state.time = nowHM();
      paintDate();
      paintAmount();
      UI.toast('已记一笔，继续', 'ok');
      var amtEl = document.getElementById('amountText');
      if (amtEl) amtEl.scrollIntoView({ block: 'nearest' });
    } else {
      UI.toast('已保存', 'ok');
      close();
    }
  }

  window.Entry = {
    open: open,
    close: close,
    state: state,
    /* 新增分类后刷新九宫格并选中它 */
    refreshCats: function (selectId) {
      if (selectId) state.cat = selectId;
      paintCats();
      var scroller = sheet.querySelector('.cat-scroll');
      var sel = catGrid.querySelector('.cat-item.selected');
      if (scroller && sel) {
        setTimeout(function () {
          var sr = scroller.getBoundingClientRect();
          var ir = sel.getBoundingClientRect();
          var delta = ir.top + ir.height / 2 - (sr.top + sr.height / 2);
          scroller.scrollTop = Math.max(0, scroller.scrollTop + delta);
        }, 60);
      }
    }
  };
})();
