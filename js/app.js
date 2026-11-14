/* =========================================================
   应用入口：导航 / 记录操作 / 数据管理 / 配置
   ========================================================= */
(function () {
  var pagesEl = document.getElementById('pages');

  /* ---------------- 导航 ---------------- */
  function switchTab(name) {
    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-page') === name);
    });
    document.querySelectorAll('.tab-item').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === name);
    });
    pagesEl.scrollTop = 0;
    document.body.dataset.tab = name;
    if (name === 'settings') fillSettings();
    if (name === 'report' && window.Report) Report.render();
  }

  document.querySelectorAll('.tab-item').forEach(function (b) {
    b.addEventListener('click', function () {
      switchTab(b.getAttribute('data-tab'));
    });
  });

  document.getElementById('btnGoSettings').addEventListener('click', function () {
    switchTab('settings');
  });

  /* ---------------- 打开记一笔 / 智能记账 ---------------- */
  document.getElementById('btnAdd').addEventListener('click', function () {
    Entry.open();
  });
  document.getElementById('btnAi').addEventListener('click', function () {
    Ai.open();
  });

  /* ---------------- 刷新 ---------------- */
  function refreshAll() {
    Ledger.render();
    document.getElementById('settingsSub').textContent = '共 ' + Store.count() + ' 笔记录';
    if (window.Report) Report.render();
  }

  /* ---------------- 记录操作 ---------------- */
  var actionId = null;

  function openRecordActions(id) {
    var r = Store.get(id);
    if (!r) return;
    actionId = id;
    var cat = Icons.get(r.cat);
    document.getElementById('actionInfo').innerHTML =
      (r.type === 'income' ? '+' : '-') +
      '<b>' +
      UI.money(r.amount) +
      '</b> · ' +
      UI.escapeHtml(cat.name) +
      ' · ' +
      UI.dateLabel(r.date) +
      ' ' +
      r.time +
      (r.note ? '<br/>' + UI.escapeHtml(r.note) : '');
    UI.openSheet('actionSheet');
  }

  document.getElementById('btnEditRecord').addEventListener('click', function () {
    var r = Store.get(actionId);
    if (!r) return;
    UI.closeSheet('actionSheet');
    setTimeout(function () {
      Entry.open(r);
    }, 120);
  });

  document.getElementById('btnDeleteRecord').addEventListener('click', function () {
    var r = Store.get(actionId);
    if (!r) return;
    UI.closeSheet('actionSheet');
    setTimeout(function () {
      UI.confirm({
        title: '删除这笔记录？',
        text: UI.dateLabel(r.date) + ' ' + UI.money(r.amount) + ' · ' + Icons.get(r.cat).name,
        okText: '删除'
      }).then(function (ok) {
        if (!ok) return;
        Store.remove(r.id);
        refreshAll();
        UI.toast('已删除', 'ok');
      });
    }, 140);
  });

  /* ---------------- 搜索 ---------------- */
  var searchInput = document.getElementById('searchInput');
  var searchResults = document.getElementById('searchResults');

  function rowHtml(r) {
    var isInc = r.type === 'income';
    var sub = r.time + (r.note ? ' | ' + r.note : '');
    return (
      '<div class="rec" data-id="' +
      r.id +
      '">' +
      Icons.chip(r.cat) +
      '<div class="rec-main"><div class="rec-top"><span class="rec-cat">' +
      UI.escapeHtml(Icons.get(r.cat).name) +
      '</span></div><div class="rec-sub">' +
      UI.escapeHtml(UI.dateLabel(r.date) + ' ' + sub) +
      '</div></div><div class="rec-amt' +
      (isInc ? ' inc' : '') +
      '">' +
      (isInc ? '+' : '-') +
      UI.num(r.amount) +
      '</div></div>'
    );
  }

  function doSearch() {
    var kw = searchInput.value.trim();
    if (!kw) {
      searchResults.innerHTML = '<div class="search-empty">输入分类、备注、日期或金额试试</div>';
      return;
    }
    var list = Store.search(kw);
    if (!list.length) {
      searchResults.innerHTML = '<div class="search-empty">没有找到相关记录</div>';
      return;
    }
    searchResults.innerHTML = list.map(rowHtml).join('');
  }

  document.getElementById('btnSearch').addEventListener('click', function () {
    searchInput.value = '';
    doSearch();
    UI.openSheet('searchSheet');
    setTimeout(function () {
      searchInput.focus();
    }, 220);
  });

  searchInput.addEventListener('input', doSearch);

  searchResults.addEventListener('click', function (e) {
    var row = e.target.closest('.rec');
    if (!row) return;
    UI.closeSheet('searchSheet');
    setTimeout(function () {
      openRecordActions(row.getAttribute('data-id'));
    }, 160);
  });

  /* ---------------- 数据管理 ---------------- */
  document.getElementById('btnExport').addEventListener('click', function () {
    var text = Store.exportJSON();
    var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var d = new Date();
    var name =
      '小账本备份-' +
      d.getFullYear() +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0') +
      '.json';
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 3000);
    UI.toast('已导出备份文件', 'ok');
  });

  var fileInput = document.getElementById('fileInput');
  document.getElementById('btnImport').addEventListener('click', function () {
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    var f = fileInput.files && fileInput.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var n = Store.importJSON(String(reader.result));
        if (window.Icons && Icons.refresh) Icons.refresh();
        refreshAll();
        UI.toast(n ? '已导入 ' + n + ' 笔' : '没有新记录', 'ok');
      } catch (err) {
        UI.toast('导入失败：' + err.message);
      }
    };
    reader.readAsText(f, 'utf-8');
  });

  document.getElementById('btnSample').addEventListener('click', function () {
    UI.confirm({
      title: '载入示例数据？',
      text: '会往当前月份添加一批示例账单，用来体验效果。之后可以在「清空全部账单」里删掉。',
      okText: '载入'
    }).then(function (ok) {
      if (!ok) return;
      var n = Store.loadSample();
      refreshAll();
      Ledger.setMonth(new Date().getFullYear(), new Date().getMonth());
      switchTab('ledger');
      UI.toast('已载入 ' + n + ' 笔示例', 'ok');
    });
  });

  document.getElementById('btnClear').addEventListener('click', function () {
    UI.confirm({
      title: '清空全部账单？',
      text: '所有记录都会被删除，且无法恢复。\n建议先导出备份。',
      okText: '确认清空'
    }).then(function (ok) {
      if (!ok) return;
      Store.clearAll();
      refreshAll();
      UI.toast('已清空', 'ok');
    });
  });

  /* ---------------- 设置 ---------------- */
  var aiEndpoint = document.getElementById('aiEndpoint');
  var aiModel = document.getElementById('aiModel');
  var aiKey = document.getElementById('aiKey');

  function fillSettings() {
    var ai = Store.settings().ai || {};
    aiEndpoint.value = ai.endpoint || '';
    aiModel.value = ai.model || '';
    aiKey.value = ai.apiKey || '';
    document.getElementById('settingsSub').textContent = '共 ' + Store.count() + ' 笔记录';
  }

  document.getElementById('btnSaveAi').addEventListener('click', function () {
    var endpoint = aiEndpoint.value.trim();
    if (endpoint && !/^https?:\/\//i.test(endpoint)) {
      UI.toast('接口地址需要以 http(s):// 开头');
      return;
    }
    Store.saveSettings({
      ai: {
        endpoint: endpoint,
        model: aiModel.value.trim(),
        apiKey: aiKey.value.trim()
      }
    });
    UI.toast('配置已保存', 'ok');
  });

  /* ---------------- PWA ---------------- */
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  window.App = {
    switchTab: switchTab,
    refreshAll: refreshAll,
    openRecordActions: openRecordActions
  };

  refreshAll();
})();
