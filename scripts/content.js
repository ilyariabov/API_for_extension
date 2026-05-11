window.copyTableToClipboard = async function () {
    const ignoredColumns = [];
    const headerElements = Array.from(document.querySelectorAll('.particle-table-header-cell[essfield]'));
    const columns = headerElements
        .map(h => {
            let label = (h.getAttribute('aria-label') || h.innerText).replace(/expand_more|help_outline/g, '').trim();
            return { id: h.getAttribute('essfield'), label };
        })
        .filter(col => col.label && !ignoredColumns.includes(col.label));

    const rows = Array.from(document.querySelectorAll('.particle-table-row'))
        .filter(row => {
            const isJoined = row.classList.contains('particle-joined-row');
            const isSummary = row.classList.contains('summary') || row.innerText.includes('Всего');
            const hasData = row.querySelector('segmentation-cell') || row.querySelector('mat-checkbox');
            return hasData && !isSummary && !isJoined;
        });

    const tableData = [
        columns.map(c => c.label).join('\t'), ...rows.map(row =>
            columns.map(col => {
                const cell = row.querySelector(`[essfield="${col.id}"]`);
                if (!cell) return '';
                let val = cell.innerText.replace(/expand_more|help_outline/g, '').replace(/\n/g, ' ').trim();
                if (/\d/.test(val)) { val = val.replace(/\s/g, '').replace(/\u00A0/g, ''); }
                return val;
            }).join('\t')
        )
    ];
    if (tableData.length <= 1) return null;
    return tableData.join('\n');
}

window.calculateConversions = async function (range) {
    const activeColumns = await window.modules.storage.get('average_metricks', 'active');
    const noDivideMetrics = [
        "stats.click_through_rate",
        "stats.cost_per_click",
        "stats.conversion_rate",
        "stats.cost_per_conversion"
    ];

    const columnLabels = {
        "stats.clicks": "click",
        "stats.click_through_rate": "CTR",
        "stats.cost_per_click": "CPC",
        "stats.cost": "cost",
        "stats.conversions": "conv",
        "stats.cost_per_conversion": "CPA",
        "stats.conversion_rate": "CR"
    };

    function getFirstColumnField() {
        const ignoredColumns = ['Статус', 'Status'];
        const headerElements = Array.from(document.querySelectorAll('.particle-table-header-cell[essfield]'));
        const columns = headerElements
            .map(h => {
                let label = (h.getAttribute('aria-label') || h.innerText).replace(/expand_more|help_outline/g, '').trim();
                return { id: h.getAttribute('essfield'), label };
            })
            .filter(col => col.label && !ignoredColumns.includes(col.label));
        return columns[0]?.id || null;
    }

    const dateRange = document.querySelector('.dropdown-and-comparison .button-text')?.innerText;
    if (!dateRange || !dateRange.includes('–')) return 'one_day';

    const numDay = getDaysRange(dateRange) + 1; if (!numDay) return 'no_range';
    const divisor = Math.round(numDay / Number(range)); if (!divisor) return 'no_range';

    const formatter = new Intl.NumberFormat(navigator.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    function getDaysRange(rangeStr) {
        const [startStrRaw, endStrRaw] = rangeStr.split('–').map(s => s.trim());
        const end = parseRuDate(endStrRaw);
        const start = parseRuDate(startStrRaw, end);
        if (!start || !end) return null;
        return Math.round((end - start) / (1000 * 60 * 60 * 24));
    }

    function parseRuDate(str, fallbackDate = null) {
        const months = {
            'янв': 0, 'февр': 1, 'март': 2, 'апр': 3, 'май': 4, 'июнь': 5,
            'июль': 6, 'авг': 7, 'сент': 8, 'окт': 9, 'нояб': 10, 'дек': 11
        };
        const clean = str.replace(/\u202f|\u00a0/g, ' ').replace(/г\./g, '').trim();
        const parts = clean.match(/(\d{1,2})(?:\s+([а-яё]{3,})\.?\s*(\d{4})?)?/i); if (!parts) return null;
        const day = +parts[1];
        let month, year;

        if (parts[2]) {
            month = months[parts[2].slice(0, 3).toLowerCase()];
            year = parts[3] ? +parts[3] : new Date().getFullYear();
        } else if (fallbackDate) {
            month = fallbackDate.getMonth();
            year = fallbackDate.getFullYear();
        } else return null;

        return new Date(year, month, day);
    }
    const nameField = getFirstColumnField();
    if (!nameField) return 'no_name_column';
    const rows = Array.from(document.querySelectorAll('.particle-table-row'))
        .filter(row => {
            if (
                row.classList.contains('particle-joined-row') ||
                [...row.classList].some(c => c.includes('summary'))
            ) return false;
            const hasName = row.querySelector(`[essfield="${nameField}"]`);
            const hasCost = row.querySelector('[essfield="stats.cost"]');

            return hasName && hasCost;
        });
    if (!rows.length) return 'no_elements';

    let rowsHtml = "";
    for (const row of rows) {
        const nameEl = row.querySelector(`[essfield="${nameField}"]`);
        if (!nameEl) continue;
        const name = nameEl.textContent.trim().split('\n')[0];

        const costEl = row.querySelector('[essfield="stats.cost"]');
        const cost = parseFloat(costEl.textContent.replace(/\s|\u00A0/g, '').replace(/[^0-9.,-]/g, '').replace(',', '.'));

        if (!cost) continue;

        const values = {};

        for (const col of activeColumns) {
            const el = row.querySelector(`[essfield="${col}"]`);if (!el) continue;
            let raw = el.textContent.replace(/\s|\u00A0/g, '').replace(',', '.');
            raw = raw.replace('%', '');
            const num = parseFloat(raw);
            if (isNaN(num)) continue;
            if (noDivideMetrics.includes(col)) values[col] = num; else values[col] = num / divisor;
        }
        if (!Object.keys(values).length) continue;
        rowsHtml += `<tr>
        <td>${name}</td>
        ${activeColumns.map(col => {
            let val = values[col];
            if (val === undefined) return `<td>-</td>`;
            if (col.includes("rate")) { return `<td>${formatter.format(val)}%</td>`;}
            return `<td>${formatter.format(val)}</td>`;
        }).join('')}
    </tr>`;
    }
    
    if (!rowsHtml) return 'no_elements';

    const calcBtnRange = await window.modules.storage.get('calcBtn', 'range')
    

    return `
    <div class='wrap-calcBtnRange'>
        <div class='data-btn' data-id='calcBtnResult'><div class='action-btn'>copy</div></div>
        <div class='info-calcBtn'>${numDay}-day data broken down into ${calcBtnRange}-day intervals</div>
    </div>
    <table class="result-table">
        <thead>
            <tr>
                <th>campaign</th>${activeColumns.map(col => `<th>${columnLabels[col] || col}</th>`).join('')}
            </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
    </table>`;
};

window.minusWordPage = async function () {
    if (!document.querySelector('#my-minus-styles')) {
        const style = document.createElement('style');
        style.id = 'my-minus-styles';
        style.textContent = `
            .my-word {  cursor: pointer; padding: 2px; display: inline-block; }
            .my-word:hover { background: #e0e0e0;}
            .my-word.active { background: #ff8c8c; color: white; }

            .my-phrase-hover .my-word:hover { background: transparent; }
            .my-phrase-active .my-word:not(.active):hover { background: transparent; }

            .my-phrase-hover { background: #ffc1c1; cursor:pointer; }
            .my-phrase-active { background: #1976d2; color: white; cursor:pointer;}

            body.phrase-mode .my-word:hover { background: none !important; }
            body.phrase-mode [essfield="query"] text-field:hover { background: #e0e0e0;; cursor: pointer; }

            body.phrase-mode [essfield="query"] text-field:hover .my-word {background: none !important; color: black;}
            body.phrase-mode [essfield="query"] text-field.my-phrase-active:hover .my-word {color: white;}

            .my-phrase-active { background: #ff3737 !important; color: white; }

            body { display: flex}

            #my-minus-wrapper {
                min-width: 300px; background-color: #F2F3F4; font-size: 16px;
                display: flex; flex-direction: column; justify-content: space-between;
            }
            
            .wrap-table { padding-top: 20px; overflow-y: auto;}
            .wrap-table table { border-collapse: collapse; max-height: 100%; width: 100%}

            .wrap-table thead th:first-child { text-align:start; padding-left:20px; width: 100%}
            .wrap-table thead th:last-child { padding-right: 20px; cursor: pointer;}

            #tbody-minusWords { width: max-content; white-space: nowrap;}
            #tbody-minusWords tr { position: relative; transition: all 0.3s ease; cursor: pointer; }

            #tbody-minusWords tr[data-group="group1"] {background-color: #ffe1e1;}
            #tbody-minusWords tr[data-group="group2"] {background-color: #F9FFE1;}
            #tbody-minusWords tr[data-group="group3"] {background-color: #F1E1FF;}
            #tbody-minusWords tr[data-group="group4"] {background-color: #E1F3FF;}
            #tbody-minusWords tr[data-group="group5"] {background-color: #E1FFE6;}
            
            #tbody-minusWords tr:hover::after { width: 100%; }

            #tbody-minusWords td { padding-bottom: 5px;  }
            #tbody-minusWords td:first-child { width: 100%; padding-left: 20px }
            #tbody-minusWords td:last-child { cursor:pointer; padding-right: 20px; text-align: center;}
            #tbody-minusWords td:nth-child(2) { padding: 0px 10px; }

            .wrap-btns {display: flex; justify-content: space-around; border-top: 1px solid rgb(191 203 212);}
            .footerBtn {cursor: pointer; width: 100%; text-align: center; box-sizing: border-box; padding: 10px 0px}
            .footerBtn:first-child { border-right: 1px solid rgb(191 203 212);}
            #copyBtn.copied { background: #daeedf; }

            .my-popup {
                position: absolute; 
                min-width: 180px; background: #fff; border: 1px solid #ddd;
                box-shadow: 0 4px 10px rgba(0,0,0,0.1); padding: 10px; border-radius: 6px; z-index: 1000;
            }
            .hidden { display: none; }

            .groupFiltBtn { 
                width: 100%; padding: 3px 10px; box-sizing: border-box; margin: 5px 0px; cursor: pointer;
            }
            .groupFiltBtn[data-group="group1"] {background-color: #ffe1e1;}
            .groupFiltBtn[data-group="group2"] {background-color: #F9FFE1;}
            .groupFiltBtn[data-group="group3"] {background-color: #F1E1FF;}
            .groupFiltBtn[data-group="group4"] {background-color: #E1F3FF;}
            .groupFiltBtn[data-group="group5"] {background-color: #E1FFE6;}
        `;
        document.head.appendChild(style);
    }

    if (!document.querySelector('#my-minus-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.id = 'my-minus-wrapper';
        wrapper.innerHTML = `
            <div class='wrap-table'>
                <table>
                    <thead><tr><th>минус слова</th><th></th><th id='setGrBtn'>⚙️</th></tr></thead>
                    <tbody id="tbody-minusWords"></tbody>
                </table>
            </div>
            <div class='wrap-btns'>
                <div class='footerBtn' id='copyBtn'>copy</div>
                <div class='footerBtn' id='allWordBtn'>delete all</div>
            </div>
            <div id="settingsPopup" class="my-popup hidden">
                <div class='groupFiltBtn' data-group='all'>all group</div>
                <div class='groupFiltBtn' data-group='group1'>group 1</div>
                <div class='groupFiltBtn' data-group='group2'>group 2</div>
                <div class='groupFiltBtn' data-group='group3'>group 3</div>
                <div class='groupFiltBtn' data-group='group4'>group 4</div>
                <div class='groupFiltBtn' data-group='group5'>group 5</div>
                <div class='groupFiltBtn' data-group='group0'>not color</div>
            </div>
        `;
        document.body.style.flexDirection = 'row';
        document.body.appendChild(wrapper);
    }

    const rows = document.querySelectorAll('.particle-table-row');

    function processChunk() {
        for (const row of rows) {
            if (row.classList.contains('particle-joined-row') || row.classList.contains('summary') ||
                row.textContent.includes('Всего') || !row.querySelector('segmentation-cell, mat-checkbox')
            ) continue;
            const textField = row.querySelector('[essfield="query"] text-field'); if (!textField) continue;
            const text = textField.textContent.trim(); if (!text || text.includes('Всего')) continue;
            textField.dataset.value = `[${text}]`
            const words = text.split(/\s+/);

            const fragment = document.createDocumentFragment();

            for (let i = 0; i < words.length; i++) {
                const span = document.createElement('span');
                span.textContent = words[i];
                span.dataset.value = words[i];
                span.className = 'my-word';

                fragment.appendChild(span);

                if (i < words.length - 1) {
                    fragment.appendChild(document.createTextNode(' '));
                }
            }

            textField.innerHTML = '';
            textField.appendChild(fragment);
        }
    }
    processChunk();

    const minusContainer = document.querySelector('tbody#tbody-minusWords');

    async function renderMinusWords({ applyClasses = false } = {}) {
        const data = Object.entries(await window.modules.storage.getMK('minus_word') || {});
        const activeGroup = await window.modules.storage.get('filter_group', 'active');

        minusContainer.innerHTML = '';
        const filtered = activeGroup === 'all' ? data : data.filter(([_, value]) => value[0] === activeGroup);
        const fragment = document.createDocumentFragment();
        for (const [key, value] of filtered) {
            const tr = document.createElement('tr'); tr.dataset.group = value[0];
            tr.innerHTML = `<td>${key}</td><td>${value[1]}</td><td class="del_sel">x</td>`;
            fragment.appendChild(tr);
            if (applyClasses) {
                if (key.includes('[')) {
                    document
                        .querySelectorAll(`[essfield="query"] text-field[data-value="${key}"]`)
                        .forEach(el => el.classList.add('my-phrase-active'));
                } else {
                    document
                        .querySelectorAll(`.my-word[data-value="${key}"]`)
                        .forEach(el => el.classList.add('active'));
                }
            }
        }
        minusContainer.appendChild(fragment);
    }
    await renderMinusWords({ applyClasses: true });

    async function delSelEl(text) {
        if (text.includes('[')) {
            const selEl = document.querySelectorAll(`[essfield="query"] text-field[data-value='${text}']`)
            selEl.forEach(el => el.classList.remove('my-phrase-active'))
        }
        else {
            const selEl = document.querySelectorAll(`.my-word[data-value='${text}']`);
            selEl.forEach(el => el.classList.remove('active'));
        }
        await window.modules.storage.remove('minus_word', text);
    }

    if (!window.myMinusHandlerAdded) {
        window.myMinusHandlerAdded = true;
        document.addEventListener('keydown', (e) => { if (e.shiftKey) { document.body.classList.add('phrase-mode'); } });
        document.addEventListener('keyup', (e) => { if (!e.shiftKey) { document.body.classList.remove('phrase-mode'); } });

        let groupMode = null;
        document.addEventListener('keydown', (e) => {
            if (!e.repeat && e.code.startsWith('Digit')) {
                const n = e.code.slice(5); if (n >= '1' && n <= '5') { groupMode = 'group' + n; }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code.startsWith('Digit')) {
                const n = e.code.slice(5); if (n >= '1' && n <= '5') { groupMode = null; }
            }
        });

        document.addEventListener('pointerdown', async (e) => {
            const wordEl = e.target.closest('.my-word');
            if (e.target.closest('text-field') && (e.shiftKey || e.ctrlKey)) {
                e.preventDefault(); e.stopPropagation();
                const textField = e.target.closest('text-field'); if (!textField) return;
                const text = textField.textContent.trim(); if (!text) return;
                const allFields = Array.from(
                    document.querySelectorAll(`[essfield="query"] text-field[data-value='[${text}]']`)
                )
                const isActive = textField.classList.contains('my-phrase-active');
                allFields.forEach(el => { el.classList.toggle('my-phrase-active', !isActive); });
                const key = `[${text}]`;
                if (isActive) {
                    await window.modules.storage.remove('minus_word', key);
                } else {
                    if (!groupMode) groupMode = 'group0';
                    await window.modules.storage.set('minus_word', key, [groupMode, allFields.length]);
                }
                await renderMinusWords();
                return;
            }
            if (wordEl) {
                e.preventDefault(); e.stopPropagation();
                const word = wordEl.textContent.trim(); if (!word) return;
                const selEl = document.querySelectorAll(`.my-word[data-value='${word}']`);
                const isActive = wordEl.classList.contains('active');
                selEl.forEach(el => el.classList.toggle('active', !isActive));
                if (isActive) {
                    await window.modules.storage.remove('minus_word', word);
                } else {
                    if (!groupMode) groupMode = 'group0';
                    await window.modules.storage.set('minus_word', word, [groupMode, selEl.length]);
                }
                await renderMinusWords();
                return
            }
        }, true);

        document.addEventListener('click', async (e) => {
            const del_sel = e.target.closest('.del_sel');
            if (del_sel) {
                const tr = del_sel.closest('tr'); const text = tr.children[0].textContent;
                await delSelEl(text);
                await renderMinusWords();
                return
            }

            const copyBtn = e.target.closest('#copyBtn')
            if (copyBtn) {
                const data = [...minusContainer.querySelectorAll("tr td:first-child")].map(td => td.textContent.trim());
                const text = data.join('\n');
                await navigator.clipboard.writeText(text);
                clearTimeout(copyBtn._timer);
                copyBtn.classList.add('copied');
                copyBtn._timer = setTimeout(() => {
                    copyBtn.classList.remove('copied');
                }, 1000);

                return;
            }

            const delAll = e.target.closest('#allWordBtn')
            if (delAll) {
                const data = Object.entries(await window.modules.storage.getMK('minus_word') || {});
                const activeGroup = await window.modules.storage.get('filter_group', 'active');
                const filtered = activeGroup === 'all' ? data : data.filter(([_, value]) => value[0] === activeGroup);

                for (const [key, _] of filtered) {
                    await delSelEl(key);
                }

                // await window.modules.storage.remove('minus_word');
                await renderMinusWords();
            }



            const stngGrBtn = e.target.closest('#setGrBtn');
            const popup = document.getElementById('settingsPopup');
            if (stngGrBtn) {
                e.stopPropagation();
                popup.classList.toggle('hidden');
                const rect = stngGrBtn.getBoundingClientRect();
                popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
                popup.style.left = `${rect.left + window.scrollX - 200}px`;

                const activ_group = await window.modules.storage.get('filter_group', 'active');

                document.querySelectorAll('.groupFiltBtn').forEach(el => { el.style.fontWeight = 'normal'; });
                const el = document.querySelector(`.groupFiltBtn[data-group='${activ_group}']`);
                el.style.fontWeight = 'bold';
                return
            }
            if (!popup.classList.contains('hidden') && !popup.contains(e.target)) {
                popup.classList.add('hidden');
                return;
            }

            const btnGroupFilter = e.target.closest('.groupFiltBtn')
            if (btnGroupFilter) {
                await window.modules.storage.set('filter_group', 'active', btnGroupFilter.dataset.group);
                popup.classList.add('hidden');
                await renderMinusWords();
                return;
            }
        });
    }
    return 'done';
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'minusWords') {
        (async () => {
            const lazyLoader = window.modules?.lazyLoader;
            if (!lazyLoader) { sendResponse('no_lazy'); return; }

            const res = await lazyLoader.scrollAll();
            if (res !== 'ok') { sendResponse('scroll_failed'); return; }
            const result = await window.minusWordPage();
            sendResponse(result);
        })();
        return true;
    }
    if (msg.action === 'copyWithScroll') {
        (async () => {
            const lazyLoader = window.modules?.lazyLoader;
            if (!lazyLoader) { sendResponse('no_lazy'); return; }

            const res = await lazyLoader.scrollAll();
            if (res !== 'ok') { sendResponse('scroll_failed'); return; }

            if (!window.copyTableToClipboard) { sendResponse('no_copy_fn'); return; }
            const result = await window.copyTableToClipboard();
            sendResponse(result);
        })();
        return true;
    }
    if (msg.action === 'calc') {
        (async () => {
            const lazyLoader = window.modules?.lazyLoader;
            if (!lazyLoader) { sendResponse('no_lazy'); return; }
            const res = await lazyLoader.scrollAll();
            if (res !== 'ok') { sendResponse('scroll_failed'); return; }
            if (!window.calculateConversions) { sendResponse('no_calc_fn'); return; }
            const result = await window.calculateConversions(msg.range);
            sendResponse(result);
        })();
        return true;
    }
});