/* =========================================================
   添加自定义分类：名称 + 图标
   存到 Store.categories，Icons.refresh() 后全局生效
   ========================================================= */
(function () {
  var sheet = document.getElementById('catSheet');
  var titleEl = document.getElementById('catSheetTitle');
  var nameInput = document.getElementById('catName');
  var countEl = document.getElementById('catCount');
  var grid = document.getElementById('catIconGrid');
  var okBtn = document.getElementById('catConfirm');

  var state = { type: 'expense', icon: '' };

  function buildGrid() {
    grid.innerHTML = Icons.picker()
      .map(function (key) {
        return (
          '<button class="cat-icon-item' +
          (key === state.icon ? ' on' : '') +
          '" data-icon="' +
          key +
          '" type="button">' +
          Icons.svg(key) +
          '</button>'
        );
      })
      .join('');
  }

  function paintGrid() {
    grid.querySelectorAll('.cat-icon-item').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-icon') === state.icon);
    });
  }

  function validate() {
    var name = nameInput.value.trim();
    countEl.textContent = name.length + '/4';
    var dup = name && Icons.list(state.type).some(function (c) {
      return c.name === name;
    });
    okBtn.disabled = !name || !state.icon || !!dup;
    nameInput.classList.toggle('dup', !!dup);
  }

  function open(type) {
    state.type = type === 'income' ? 'income' : 'expense';
    state.icon = '';
    titleEl.textContent = '添加主分类';
    nameInput.value = '';
    nameInput.classList.remove('dup');
    countEl.textContent = '0/4';
    buildGrid();
    validate();
    UI.openSheet('catSheet');
    var scroller = sheet.querySelector('.cat-icon-scroll');
    if (scroller) scroller.scrollTop = 0;
    setTimeout(function () {
      if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) nameInput.focus();
    }, 320);
  }

  function close() {
    UI.closeSheet('catSheet');
  }

  function confirm() {
    var name = nameInput.value.trim();
    if (!name) {
      UI.toast('先给分类起个名字');
      return;
    }
    if (!state.icon) {
      UI.toast('选一个图标吧');
      return;
    }
    if (
      Icons.list(state.type).some(function (c) {
        return c.name === name;
      })
    ) {
      UI.toast('已经有「' + name + '」了');
      return;
    }

    var cat = Store.addCategory({
      type: state.type,
      name: name,
      icon: state.icon,
      color: Icons.colorFor(Store.categories(state.type).length)
    });
    Icons.refresh();
    if (window.Entry) Entry.refreshCats(cat.id);
    close();
    UI.toast('已添加分类「' + cat.name + '」');
  }

  nameInput.addEventListener('input', validate);

  grid.addEventListener('click', function (e) {
    var b = e.target.closest('.cat-icon-item');
    if (!b) return;
    state.icon = b.getAttribute('data-icon');
    paintGrid();
    validate();
  });

  okBtn.addEventListener('click', confirm);

  nameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!okBtn.disabled) confirm();
    }
  });

  window.CatSheet = { open: open, close: close };
})();
