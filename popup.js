document.addEventListener('DOMContentLoaded', async () => {
    await renderButtons();
});
const BUTTONS_CONFIG = [
    { id: 'copiedLinks', name: 'expand copied links', setting: true },
    { id: 'kwMatchType', name: 'keyword match type', setting: true },
    { id: 'parserWebSite', name: 'parser from search results', setting: true },
    { id: 'n-gramAnalis', name: 'n-gram analis', setting: true },
    { id: 'lemmatization', name: 'lemmatization', setting: false },
    { id: 'auditPage', name: 'audit page', setting: false },

    { id: 'grabBtn', name: 'collect budgets', setting: false },
    { id: 'copyBtn', name: 'copy active columns', setting: false },
    { id: 'calcBtn', name: 'average by segment', setting: true },
    { id: 'minusWrdBtn', name: 'minus word mode', setting: false }
];

async function renderButtons() {
    const container = document.querySelector('.containerBtn'); if (!container) return;
    const active = await window.modules.storage.get('ui', 'visibleButtons') || [];
    container.innerHTML = '';

    if (active.length === 0) {
        const div = document.createElement('div');
        div.innerHTML = `no buttons selected`
        container.appendChild(div);
        return
    }

    BUTTONS_CONFIG.forEach(btn => {
        if (!active.includes(btn.id)) return;
        const div = document.createElement('div'); div.className = 'wrap-btn data-btn';
        div.dataset.id = btn.id;
        div.innerHTML = `
            <span class="action-btn">${btn.name}</span><span class="icon-btn"></span>
            ${btn.setting ? '<span class="setting"></span>' : '<span class="zaglushka"></span>'}
        `;
        container.appendChild(div);
    });
}



const storage = window.modules.storage;
const btnTimeoutMap = new WeakMap();
function showBtnToast(action, text, type = 'success') {
    const btn = document.querySelector(`.wrap-btn[data-id="${action}"]`);
    if (btnTimeoutMap.has(btn)) clearTimeout(btnTimeoutMap.get(btn));
    const originalText = btn.innerHTML;
    btn.innerText = text; btn.disabled = true; btn.classList.remove('success', 'error', 'revert');
    requestAnimationFrame(() => { btn.classList.add(type); btn.style.padding = '8px 16px';});
    const timeout = setTimeout(() => {
        btn.classList.add('revert');
        setTimeout(() => {
            btn.innerHTML = originalText; btn.disabled = false; btn.classList.remove('success', 'error', 'revert');
            btn.style.padding = '0px 10px 0px 0px';
        }, 200);
    }, 1500);

    btnTimeoutMap.set(btn, timeout);
}
const paramWrap = document.querySelector('#param');
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.setting');
    if (btn) {
        // СДЕЛАТЬ КНОПКУ С БЫСТРЫМ СОЗДАНИЕМ UTM МЕТКИ
        paramWrap.style.display = 'block';
        const wrap = btn.closest('.wrap-btn'); const action = wrap.dataset.id;
        document.querySelectorAll('.wrap-btn').forEach(val => { val.classList.remove('activ-btn') })
        wrap.classList.add('activ-btn')
        paramWrap.querySelector('.wrapContentParam').innerHTML = '';

        if (action === 'calcBtn') {
            paramWrap.querySelector('.wrapContentParam').innerHTML = `
                <div class="range-group">
                    <span style='flex:1'>in range</span>
                    <label><input type="radio" name='range' value="1">day</label>
                    <label><input type="radio" name='range' value="7">week</label>
                    <label><input type="radio" name='range' value="30">month</label>
                </div>
                <div class="divider"></div>
                <div class="settingTrueFalse">
                    <label class="truefalseEl"><input type="checkbox" name="average" value="stats.clicks">click</label>
                    <label class="truefalseEl"><input type="checkbox" name="average" value="stats.click_through_rate">CTR</label>
                    <label class="truefalseEl"><input type="checkbox" name="average" value="stats.cost_per_click">CPC</label>
                    <label class="truefalseEl"><input type="checkbox" name="average" value="stats.cost">cost</label>
                    <label class="truefalseEl"><input type="checkbox" name="average" value="stats.conversions">conv</label>
                    <label class="truefalseEl"><input type="checkbox" name="average" value="stats.cost_per_conversion">CPA</label>
                    <label class="truefalseEl"><input type="checkbox" name="average" value="stats.conversion_rate">CR</label>
                </div>
            `;
            const saved = await storage.get(action, 'range') || '1';
            const input = paramWrap.querySelector(`input[name="range"][value="${saved}"]`);
            if (input) input.checked = true;

            const savedFields = await window.modules.storage.get('average_metricks', 'active') || [];
            paramWrap.querySelectorAll('input[name="average"]').forEach(el => {
                el.checked = savedFields.includes(el.value);
            });
        }
        if (action === 'kwMatchType') {
            paramWrap.querySelector('.wrapContentParam').innerHTML = `
                <div class="wrap-select">
                    <div>match type</div>
                    <select name="kwMatchType" id="selKwMatchType" class='sel_set'>
                        <option value="broad">broad</option>
                        <option value="phrase">phrase</option>
                        <option value="exact">exact</option>
                    </select>
                </div>
            `
            const select = paramWrap.querySelector('select[name="kwMatchType"]');
            const saved = await window.modules.storage.get('kw_match_type', 'match_type') ?? 'broad';
            select.value = saved;
        }
        if (action === 'parserWebSite') {
            paramWrap.querySelector('.wrapContentParam').innerHTML = `
                <div class="wrap-select">
                    <div>sites from search</div>
                    <select name="selSitePars" id="selSitePars" class='sel_set'>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                    </select>
                </div>
                <div class="divider"></div>
                <div class="settingTrueFalse">
                    <label class="truefalseEl"><input type="checkbox" name="snippet" value="query"> query</label>
                    <label class="truefalseEl"><input type="checkbox" name="snippet" value="domain"> domain</label>
                    <label class="truefalseEl"><input type="checkbox" name="snippet" value="url"> url</label>
                    <label class="truefalseEl"><input type="checkbox" name="snippet" value="title"> title</label>
                </div>
            `
            const select = paramWrap.querySelector('#selSitePars');
            const savedSum = await storage.get('parse_search_result', 'number_of_sites') ?? '10';
            select.value = savedSum;

            const savedFields = await storage.get('parse_search_result', 'snippet_fields') || [];
            paramWrap.querySelectorAll('input[name="snippet"]').forEach(el => {
                el.checked = savedFields.includes(el.value);
            });
        }
        if (action === 'copiedLinks') {
            paramWrap.querySelector('.wrapContentParam').innerHTML = `
                <div class="wrap-select">
                    <div>match type</div>
                    <select name="kwAndUrls" id="kwAndUrls" class='sel_set'>
                        <option value="kw">keyword</option>
                        <option value="url">urls</option>
                    </select>
                </div>
            `
            const select = paramWrap.querySelector('select[name="kwAndUrls"]');
            const saved = await window.modules.storage.get('kw_and_urls', 'type') ?? 'url';
            select.value = saved;
        }
        if (action === 'n-gramAnalis') {
            paramWrap.querySelector('.wrapContentParam').innerHTML = `
                <div class="wrap-select">
                    <div>type of unloading</div>
                    <select name="columnComma" id="columnComma" class='sel_set'>
                        <option value="columns">columns</option>
                        <option value="commas">separated by commas</option>
                    </select>
                </div>
                <div class="divider"></div>
                <div class="wrap-select">
                    <div>process from</div>
                    <select name="pageAndCopy" id="pageAndCopy" class='sel_set'>
                        <option value="page">active page</option>
                        <option value="pages_buffer">pages from the buffer</option>
                        <option value="buffer">text from the buffer</option>
                    </select>
                </div>
                <div class="divider"></div>
                <div class="settingTrueFalse">
                    <label class="truefalseEl"><input type="checkbox" name="gramUnion" value="gramUnion">combining grams from all sites</label>
                </div>
                <div class="divider"></div>
                <div class="settingTrueFalse">
                    <label class="truefalseEl"><input type="checkbox" name="usHead" value="usHead">using headings</label>
                </div>
                <div class="divider"></div>
                <div class="settingTrueFalseFlex nGramChecked">
                    n-gram
                    <label class="truefalseEl"><input type="checkbox" name="n-gram" value="1">1</label>
                    <label class="truefalseEl"><input type="checkbox" name="n-gram" value="2">2</label>
                    <label class="truefalseEl"><input type="checkbox" name="n-gram" value="3">3</label>
                    <label class="truefalseEl"><input type="checkbox" name="n-gram" value="4">4</label>
                </div>
                <div class="divider"></div>
                <div class="settingTrueFalse">
                    <label class="truefalseEl"><input type="checkbox" name="lemGram" value="lemGram">lemmatization</label>
                </div>
                <div class="divider"></div>
                <div class="settingTrueFalse">
                    columns
                    <label class="truefalseEl"><input type="checkbox" name="colGram" value="gram.col.domain">domain</label>
                    <label class="truefalseEl"><input type="checkbox" name="colGram" value="gram.col.gram">n-gram</label>
                    <label class="truefalseEl"><input type="checkbox" name="colGram" value="gram.col.numberOfRepetitions">number of repetitions</label>
                </div>
            `

            paramWrap.querySelector('select[name="columnComma"]').value = await storage.get('n-gram', 'type_of_unloading') ?? 'columns';
            paramWrap.querySelector('select[name="pageAndCopy"]').value = await storage.get('n-gram', 'process_from') ?? 'page';

            const gramUnion = paramWrap.querySelector('input[name="gramUnion"]');
            if (gramUnion) gramUnion.checked = await storage.get('n-gram', 'gram_union') || false;;

            const usHead = paramWrap.querySelector('input[name="usHead"]');
            if (usHead) usHead.checked = await storage.get('n-gram', 'using_headings') || false;;

            const n_gram_checked = await storage.get('n-gram', 'n-gram_checked') || [1];
            paramWrap.querySelectorAll('input[name="n-gram"]').forEach(el => { el.checked = n_gram_checked.includes(el.value);});

            const lem_gram_set = await storage.get('n-gram', 'lem_gram_set') || [];
            paramWrap.querySelectorAll('input[name="lemGram"]').forEach(el => { el.checked = lem_gram_set.includes(el.value);});

            const sel_col_gram = await storage.get('n-gram', 'sel_col_gram') || [];
            paramWrap.querySelectorAll('input[name="colGram"]').forEach(el => { el.checked = sel_col_gram.includes(el.value);});

            nGramCheckDisabled('all')
        }
        return
    }
    const closeParam = e.target.closest('.close-icon')
    if (closeParam) { 
        paramWrap.style.display = 'none';
        document.querySelector('.activ-btn')?.classList.remove('activ-btn');
        return; 
    }
    if (e.target.closest('[data-id="settingBtnHead"]')) {
        document.querySelector('#param-btn').style.display = 'block';
        document.querySelector('#result').style.display = 'none';
        document.querySelector('.containerBtn').style.display = 'none';
        document.querySelector('#param-btn .wrapContentParam').innerHTML = '';
        document.querySelector('body').style.removeProperty('width')
        const active = await window.modules.storage.get('ui', 'visibleButtons') || [];
        document.querySelector('#param-btn .wrapContentParam').innerHTML = `
            <div class="settingTrueFalse">
                ${BUTTONS_CONFIG.map(btn_config => `
                    <label class="truefalseEl">
                        <input type="checkbox" name="uiVisibility" value="${btn_config.id}"
                            ${active.includes(btn_config.id) ? 'checked' : ''}>
                            ${btn_config.name}
                            ${btn_config.setting ? '<span class="has-setting">⚙️</span>' : ''}
                        </label>
                `).join('')}
            </div>
        `;
        paramWrap.style.display = 'none';
        return
    }
    const closeheadParam = e.target.closest('.close-icon-btn')
    if (closeheadParam) {
        document.querySelector('#param-btn').style.display = 'none'
        document.querySelector('.containerBtn').style.display = 'block'
        return; 
    }
    const closeResult = e.target.closest('.close-icon-result')
    if (closeResult) {
        document.querySelector('#result').style.display = 'none'
        document.querySelector('.containerBtn').style.display = 'block';
        document.body.style.width = '300px';
        return; 
    }

    if (e.target.closest('.h1h6head')) {
        document.querySelector('.elH1H6wrap').classList.toggle('hidden')
    }
    if (e.target.closest('.imgHead')) {
        document.querySelector('.elAllImgWrap').classList.toggle('hidden')
    }
});

async function lemmatization(text) {
    const response = await fetch(
        "https://api-for-extension.onrender.com/lemmatize",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ words: text })
        }
    );
    const data = await response.json();
    return data.result
}

document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.action-btn'); if (!btn) return;

    const wrap = btn.closest('.data-btn');
    const action = wrap.dataset.id;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    document.getElementById('loader').classList.add('show');
    await new Promise(resolve => setTimeout(resolve, 0));
    try {
        if (action === 'n-gramAnalis') {
            const all_gram = await storage.get('n-gram');
            const date_gram = new Object();
            if (all_gram['process_from'] === 'page') {
                let text = await getTextFromUrl(tab.url);
                if (all_gram['lem_gram_set']?.length > 0) text = await lemmatization(text)
                date_gram[tab.url] = generateNGrams(text, all_gram['n-gram_checked']);
            }
            else if (all_gram['process_from'] === 'pages_buffer') {
                let domain = null; let finalDate = null;
                domain = await navigator.clipboard.readText(); domain = domain.split('\n');

                let alltext = [];
                if (all_gram['gram_union']) {
                    for (const el of domain) {
                        try {
                            new URL(el);
                            const text = await getTextFromUrl(el)
                            alltext.push(...text);
                        } catch (e) { }
                    }
                    if (all_gram['lem_gram_set']?.length > 0) alltext = await lemmatization(alltext);
                    date_gram['all site'] = generateNGrams(alltext, all_gram['n-gram_checked'])
                }
                else {
                    for (const el of domain) {
                        try {
                            new URL(el);
                            let text = await getTextFromUrl(el);
                            if (all_gram['lem_gram_set']?.length > 0) text = await lemmatization(text);
                            date_gram[el] = generateNGrams(text, all_gram['n-gram_checked'])
                        } catch (e) { }
                    }
                }
            }
            else if (all_gram['process_from'] === 'buffer') {
                let blocksWords = [];
                date_gram['key'] = {}

                let copyText = await navigator.clipboard.readText(); copyText = copyText.split('\n')
                copyText.forEach(el => blocksWords.push(el.split(' ')));
                if (all_gram['lem_gram_set']?.length > 0) blocksWords = await lemmatization(blocksWords);
                date_gram['key'] = generateNGrams(blocksWords, all_gram['n-gram_checked'])
            }
            async function getTextFromUrl(url) {
                let html = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage({ action: 'fetchHtml', url },
                        (response) => {
                            if (response?.success) resolve(response.html); else reject(response?.error || 'fetch error');
                        }
                    );
                });
                
                html = html
                    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
                    .replace(/<!--[\s\S]*?-->/g, '');

                let segmentedText = html.replace(/<\/([^>]+)>/g, '|').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ');
                const blocks = segmentedText.split('|');
                const blocksWords = [];

                blocks.forEach(block => {
                    let cleanBlock = block.replace(/[^\w\sа-яА-ЯёЁ]/gi, ' ').replace(/\s+/g, ' ').toLowerCase().trim();
                    const words = cleanBlock.split(' ').filter(w => w.length >= 1);
                    if (words.length > 0) blocksWords.push(words);
                });
                return blocksWords;
            }
            function generateNGrams(blocksWords, nList = [1, 2]) {
                const result = {};
                nList.forEach(nRaw => {
                    const n = Number(nRaw);
                    const grams = {};
                    blocksWords.forEach(words => {
                        for (let i = 0; i <= words.length - n; i++) {
                            const gram = words.slice(i, i + n).join(' ');
                            if (!grams[gram]) grams[gram] = 0;
                            grams[gram]++;
                        }
                    });
                    result[`${n}-gram`] = grams;
                });
                return result;
            }

            if (all_gram['type_of_unloading'].includes('columns')) {
                const rows = [];
                if (all_gram['using_headings']) {
                    const headers = [];
                    if (all_gram['sel_col_gram'].includes('gram.col.domain')) headers.push('domain');
                    if (all_gram['sel_col_gram'].includes('gram.col.gram')) headers.push('n-gram');
                    headers.push('words');
                    if (all_gram['sel_col_gram'].includes('gram.col.numberOfRepetitions')) headers.push('repeat');
                    rows.push(headers);
                }

                for (const [domain, gramsByN] of Object.entries(date_gram)) {
                    for (const [nGram, words] of Object.entries(gramsByN)) {
                        for (const [word, count] of Object.entries(words)) {
                            const row = [];
                            if (all_gram['sel_col_gram'].includes('gram.col.domain')) row.push(domain);
                            if (all_gram['sel_col_gram'].includes('gram.col.gram')) row.push(nGram);
                            row.push(word);
                            if (all_gram['sel_col_gram'].includes('gram.col.numberOfRepetitions')) row.push(count);
                            rows.push(row);
                        }
                    }
                }

                const tsv = rows.map(row => row.join('\t')).join('\n');
                await navigator.clipboard.writeText(tsv);
            } else {
                const rows = [];
                const showDomain = all_gram['sel_col_gram']?.includes('gram.col.domain') ?? false;
                if (all_gram['using_headings']) {
                    const headers = [];
                    if (showDomain) headers.push('domain');
                    all_gram['n-gram_checked'].map(n => `${n}-gram`).forEach(col => headers.push(col));
                    rows.push(headers);
                }

                for (const [domain, gramsByN] of Object.entries(date_gram)) {
                    const row = [];
                    if (showDomain) row.push(domain);
                    all_gram['n-gram_checked'].forEach(n => {
                        const gramKey = `${n}-gram`;
                        if (gramsByN[gramKey]) {
                            const grams = Object.keys(gramsByN[gramKey]); row.push(grams.join(', '));
                        } else { row.push(''); }
                    });
                    rows.push(row);
                }
                const tsv = rows.map(row => row.join('\t')).join('\n');
                await navigator.clipboard.writeText(tsv);
            }
            showBtnToast(action, 'n-gram copy', 'success');
            return
        }

        if (action === 'auditPage') {
            const url = tab.url;
            // const url = 'https://mkg.agency/';

            // try {
                const html = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage(
                        { action: 'fetchHtml', url }, (response) => {
                            if (response?.success) { resolve(response.html);
                            } else { reject(response?.error || 'fetch error');
                            }
                        }
                    );
                });

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const title = doc.querySelector('title')?.innerText?.trim() || '';
                const description =doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';

                const headingElements = [...doc.querySelectorAll('h1, h2, h3, h4, h5, h6')];
                const headingsTree = [];
                const stack = [];
                headingElements.forEach(el => {
                    const level = Number(el.tagName[1]);
                    const node = {tag: el.tagName.toLowerCase(), level, text: el.innerText.trim(), children: []};
                    while ( stack.length && stack[stack.length - 1].level >= level ) { stack.pop(); }
                    if (stack.length === 0) headingsTree.push(node);
                    else stack[stack.length - 1].children.push(node); 
                    stack.push(node);
                });

                const allLinks = [...doc.querySelectorAll('a[href]')];
                const internalLinks = [];
                const externalLinks = [];

                allLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (!href) return;
                    try {
                        const absoluteUrl = new URL(href, url);
                        if (absoluteUrl.hostname === new URL(url).hostname) internalLinks.push(absoluteUrl.href);
                        else externalLinks.push(absoluteUrl.href);
                    } catch (e) { }
                });

                const images = [...doc.querySelectorAll('img')].map(img => ({
                    src: img.getAttribute('src') || '',
                    alt: img.getAttribute('alt') || '',
                    hasAlt: !!img.getAttribute('alt')
                }));

                const bodyText = doc.body?.innerText?.replace(/\s+/g, ' ')?.trim() || '';
                const wordCount = bodyText.length > 0 ? bodyText.split(' ').length : 0;

                const imagesWithoutAlt = images.filter(img => !img.hasAlt).length;

                const auditData = {
                    url, title, description, headingsTree,
                    links: {
                        total: allLinks.length, 
                        internal: internalLinks.length, 
                        external: externalLinks.length, 
                        internalLinks, externalLinks
                    },

                    images: { total: images.length, withoutAlt: imagesWithoutAlt, items: images },
                    wordCount
                };
                console.log(auditData);
                
                function renderHeadings(headings, level = 0) {
                    let html = '';
                    headings.forEach(item => {
                        html += `
                            <div style="padding-left:${level * 25}px; margin: 5px 0px">
                                <b>&lt;${item.tag.toUpperCase()}&gt;</b><span>${item.text}</span>
                            </div>
                        `;
                        if (item.children?.length) html += renderHeadings(item.children, level + 1);
                    });
                    return html;
                }


                // ПРОДОЛЖИТЬ ДЕЛАТЬ ТУТ. СРАЗУ АНАЛОГИЧНО ДЕЛАТЬ ПРОСТО ССЫЛКИ
                function rendedImgs() {
                    let html = ``
                    for (const el of auditData['images']['items']) {
                        html += `<div class='imgPrev'><a href='${el['src']}'>${el['src']}</a></div>`
                        // console.log(`el. src: ${el['src']} || alt: ${el['alt']}`);
                    }
                    return html
                }
                // rendedImgs()

                const resultEl = document.getElementById('result');
                resultEl.style.display = 'block';
                resultEl.innerHTML = `
                    <div class='headAuditPage'>
                        <span>audit page</span>
                        <span class='close-icon-result'></span>
                    </div>
                    <div class='auditPageWrap'>
                        <div class='auditEl'><b>url</b> ${auditData['url']}</div>
                        <div class='auditEl'><b>title</b> ${auditData['title']}</div>
                        <div class='auditEl'><b>description</b> ${auditData['description']}</div>
                        <div class='auditEl'><b>word count</b> ${auditData['wordCount']}</div>

                        <div class='auditEl auditSummer'>
                            <div class='auditSummerH'>h1</div>
                            <div class='auditSummerH'>h2</div>
                            <div class='auditSummerH'>h3</div>
                            <div class='auditSummerH'>h4</div>
                            <div class='auditSummerH'>h5</div>
                            <div class='auditSummerH'>h6</div>
                            <div class='auditSummerH'>imgs</div>
                            <div class='auditSummerH'>links</div>
                            
                            <div class='auditSummerV'>${doc.querySelectorAll('h1').length}</div>
                            <div class='auditSummerV'>${doc.querySelectorAll('h2').length}</div>
                            <div class='auditSummerV'>${doc.querySelectorAll('h3').length}</div>
                            <div class='auditSummerV'>${doc.querySelectorAll('h4').length}</div>
                            <div class='auditSummerV'>${doc.querySelectorAll('h5').length}</div>
                            <div class='auditSummerV'>${doc.querySelectorAll('h6').length}</div>
                            <div class='auditSummerV'>${auditData.images.total}</div>
                            <div class='auditSummerV'>${auditData.links.total}</div>
                        </div>

                        <div class='auditEl H1H6wrap'>
                            <b class='h1h6head'>headings</b>
                            <div class='elH1H6wrap hidden'>${renderHeadings(auditData.headingsTree)}</div>
                        </div>
                        <div class='auditEl imgWrap'>
                            <b class='imgHead'>images</b>
                            <div class='elAllImgWrap hidden'>${rendedImgs()}</div>
                        </div>
                    </div>
                `;;

                document.querySelector('.containerBtn').style.display = 'none';
                document.querySelector('#param').style.display = 'none';
                document.querySelector('#param-btn').style.display = 'none';

                document.body.style.width = '600px';
                showBtnToast(action, "audit close", 'success');

            // } catch (error) {
            //     console.error(error);
            // }
        }

        if (action === 'copiedLinks') {
            const activType = await window.modules.storage.get('kw_and_urls', 'type') ?? 'url';
            if (activType === 'url') {
                const text = await navigator.clipboard.readText();
                if (!text) { showBtnToast(action, 'not date', 'error'); return }
                const urls = text.split('\n').map(s => s.trim()).filter(s => {
                    try {
                        const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:';
                    } catch { return false; }
                });
                if (urls.length === 0) { showBtnToast(action, 'not urls', 'error'); return }
                const tabIds = [];
                for (const url of urls) {
                    await new Promise(res => setTimeout(res, 120));
                    const tab = await chrome.tabs.create({ url, active: false });
                    tabIds.push(tab.id);
                }
                await chrome.tabs.group({ tabIds });
            }
            if (activType === 'kw') {
                const text = await navigator.clipboard.readText();
                if (!text) { showBtnToast(action, 'no data', 'error'); return }
                const keywords = text.split('\n').map(s => s.trim()).filter(Boolean);
                if (keywords.length === 0) { showBtnToast(action, 'no keywords', 'error'); return; }
                const tabIds = [];
                for (const kw of keywords) {
                    await new Promise(res => setTimeout(res, 120));
                    const url = `https://www.google.com/search?q=${encodeURIComponent(kw)}`;
                    const tab = await chrome.tabs.create({ url, active: false });
                    tabIds.push(tab.id);
                }
                await chrome.tabs.group({ tabIds });
            }
            return
        }
        if (action === 'kwMatchType') {
            let text = await navigator.clipboard.readText();

            if (!text) { showBtnToast(action, 'no data', 'error'); return; }
            const match_type = await window.modules.storage.get('kw_match_type', 'match_type') ?? 'broad';
            const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
            const cleaned = lines.map(cleanKeyword);
            const result = cleaned.map(k => applyMatchType(k, match_type)).join('\n');

            await navigator.clipboard.writeText(result);
            showBtnToast(action, `converted to ${match_type} keywords`, 'success');

            function cleanKeyword(str) { return str.replace(/^\[|\]$/g, '').replace(/^"|"$/g, '').trim(); }
            function applyMatchType(keyword, type) {
                if (!keyword) return '';
                switch (type) {
                    case 'phrase': return `\"${keyword}\"`;
                    case 'exact': return `[${keyword}]`;
                    default: return keyword;
                }
            }
            return
        }
        if (action === 'parserWebSite') {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.url?.includes("google.")) { showBtnToast(action, 'open Google search', 'error'); return; }
            const fields = await storage.get('parse_search_result', 'snippet_fields') || [];
            if (!fields.length) { showBtnToast(action, 'select fields', 'error'); return; }
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id }, function: scrapeGoogleSerp, args: [fields]
            });
            const text = results?.[0]?.result; if (!text) { showBtnToast(action, 'no data', 'error'); return; }

            await navigator.clipboard.writeText(text);
            showBtnToast(action, 'copy completed', 'success');

            async function scrapeGoogleSerp(fields) {
                const query = document.querySelector('textarea[name="q"], input[name="q"]')?.value || "—";
                const allLinks = Array.from(document.querySelectorAll('a h3'));
                const data = [];
                let count = 0;

                const sumPos = await window.modules.storage.get('parse_search_result', 'number_of_sites')
                for (const titleEl of allLinks) {
                    if (count >= sumPos) break;
                    const linkEl = titleEl.closest('a'); if (!linkEl) continue; const url = linkEl.href;
                    if (!url.startsWith('http') || url.includes('google.com/search')) continue;
                    const title = titleEl.innerText.replace(/\s+/g, ' ').trim();
                    let domain = "";
                    try { domain = new URL(url).hostname; } catch { domain = url; }

                    const parent = titleEl.closest('div.g') || titleEl.parentElement.parentElement;

                    const snippetEl = parent?.querySelector('.VwiC3b, .yXK7lf');
                    const snippet = snippetEl ? snippetEl.innerText.replace(/\s+/g, ' ').trim() : "—";

                    const row = [];

                    if (fields.includes('query')) row.push(query);
                    if (fields.includes('domain')) row.push(domain);
                    if (fields.includes('url')) row.push(url);
                    if (fields.includes('title')) row.push(title);
                    if (fields.includes('snippet')) row.push(snippet);
                    if (row.length) { data.push(row.join('\t')); count++; }
                }

                return data.join('\n');
            }
            return
        }
        if (action === 'grabBtn') {
            const MY_ORDER = [
                "ICNT-M-S-mkgagency", "WGC-M-S-resurscontrol", "BY_AKTVST_BLL", "WGC-M-S-zee", "WGC-M-S-supersto", "--", "ICNT-M-S-ventprof"
            ];

            chrome.scripting.executeScript({
                target: { tabId: tab.id }, function: grabAndSortBudgets, args: [MY_ORDER]
            }, (results) => {
                if (chrome.runtime.lastError || !results || !results[0]) {
                    openRequiredTabs(); showBtnToast(action, 'pages open', 'success'); return;
                }

                const result = results[0].result;

                if (result !== 'no') {
                    navigator.clipboard.writeText(result).then(() => { showBtnToast(action, 'copy completed', 'success'); });
                } else { openRequiredTabs(); showBtnToast(action, 'pages open', 'success'); }
            });

            async function openRequiredTabs() {
                const tabIds = [];
                const urls = [
                    "https://ads.google.com/aw/budgets?ocid=7438238352&workspaceId=0&ascid=7438238352&euid=1351146416&__u=4572187184&uscid=7438238352&__c=8585720848&authuser=0&sf=manager&subid=by-ru-awhp-g-aw-c-t-man-signin%21o2",
                    "https://direct.yandex.by/dna/grid/campaigns/?ulogin=porg-ufvi6c33&dim-filter=CPC_AND_CPM&status-filter=ALL_EXCEPT_ARCHIVED&stat-preset=last30Days&sort-key=STAT_CTR&sort-direction=asc",
                    "https://direct.yandex.by/dna/grid/campaigns/?ulogin=AKTVST&dim-filter=CPC_AND_CPM&status-filter=ALL_EXCEPT_ARCHIVED&stat-preset=last30Days&sort-key=STAT_CTR&sort-direction=asc",
                    "https://direct.yandex.by/dna/grid/campaigns/?ulogin=zeekrminsk-2024&stat-preset=last30Days&dim-filter=CPC_AND_CPM&status-filter=ALL_EXCEPT_ARCHIVED&sort-key=STAT_CTR&sort-direction=asc",
                    "https://direct.yandex.by/dna/grid/campaigns/?ulogin=supersto-2025&stat-preset=last30Days&dim-filter=CPC_AND_CPM&status-filter=ALL_EXCEPT_ARCHIVED&sort-key=start_date&sort-direction=asc"
                ]
                for (const url of urls) {
                    const tab = await chrome.tabs.create({ url, active: false }); tabIds.push(tab.id);
                }
                if (tabIds.length) { await chrome.tabs.group({ tabIds }); }
            }

            function grabAndSortBudgets(orderedList) {
                if (!window.location.href.includes("ads.google.com/aw/budgets")) return "no";

                const accountMap = {};
                const rows = document.querySelectorAll('.particle-table-row');

                rows.forEach(row => {
                    const nameCell = row.querySelector('ess-cell[essfield="customer_info.descriptive_name"]');
                    const budgetCell = row.querySelector('ess-cell[essfield="customer_budget.remaining_account_budget"]');

                    if (nameCell && budgetCell) {
                        const nameEl = nameCell.querySelector('.descriptive-name') || nameCell.querySelector('a');
                        const name = nameEl ? nameEl.innerText.trim() : nameCell.innerText.trim();

                        let budgetRaw = budgetCell.innerText.trim();
                        let budgetClean = budgetRaw.replace(/[^\d.,]/g, '').replace(/\s/g, '');

                        if (/\d/.test(budgetClean)) accountMap[name] = budgetClean;
                    }
                });

                return orderedList.map(targetName => {
                    if (targetName === "--") return "-";
                    const foundKey = Object.keys(accountMap).find(key =>
                        key.toLowerCase().includes(targetName.toLowerCase().trim())
                    );
                    return foundKey ? accountMap[foundKey] : "-";
                }).join('\n');
            }
            return
        }
        if (action === 'calcBtn') {
            const currentUrl = tab.url || '';
            if (!currentUrl.includes('ads.google.com')) { showBtnToast(action, 'wrong page', 'error'); return; }

            const saved = await storage.get('calcBtn', 'range') || '1';
            chrome.tabs.sendMessage(tab.id, { action: 'calc', range: saved }, (value) => {
                if (!value) { showBtnToast(action, 'no elements', 'error'); return; }
                if (value === 'one_day') { showBtnToast(action, 'one day is indicated', 'error'); return; }
                if (value === 'no_range') { showBtnToast(action, 'no calculated range', 'error'); return; }
                if (value === 'no_elements') { showBtnToast(action, 'no data', 'error'); return; }

                const resultEl = document.getElementById('result');
                resultEl.style.display = 'block';
                resultEl.innerHTML = value;

                document.querySelector('.containerBtn').style.display = 'none';
                document.querySelector('#param').style.display = 'none';
                document.querySelector('#param-btn').style.display = 'none';




                const table = resultEl.querySelector('.result-table');
                if (table) {
                    const tableWidth = table.scrollWidth + 32;
                    const newWidth = Math.min(tableWidth, 800);
                    document.body.style.width = newWidth + 'px';
                }
                showBtnToast(action, "table open", 'success');
            });
            return
        }
        if (action === 'copyBtn') {
            const currentUrl = tab.url || '';
            if (!currentUrl.includes('ads.google.com')) { showBtnToast(action, 'wrong page', 'error'); return; }
            chrome.tabs.sendMessage(tab.id, { action: 'copyWithScroll' }, async (result) => {
                if (!result || result === 'no_data') { showBtnToast(action, 'no elements', 'error'); return; }
                await navigator.clipboard.writeText(result);
                showBtnToast(action, 'copy completed', 'success');
            });
            return
        }
        if (action === 'minusWrdBtn') {
            const currentUrl = tab.url || '';
            if (!currentUrl.includes('ads.google.com')) { showBtnToast(action, 'wrong page', 'error'); return; }
            chrome.tabs.sendMessage(tab.id, { action: 'minusWords' }, (result) => {
                if (result === 'done') {
                    showBtnToast(action, "table open", 'success');
                } else { showBtnToast(action, result, 'error'); }
            });
            return
        }
        if (action === 'calcBtnResult') {
            const table = document.querySelector('#result .result-table')
            let result = [];

            for (let row of table.rows) {
                let rowData = [];
                for (let cell of row.cells) { rowData.push(cell.innerText.trim()); }
                result.push(rowData.join('\t'));
            }
            const text = result.join('\n');
            await navigator.clipboard.writeText(text);
            btn.style.background = '#daeedf';
            btn._timer = setTimeout(() => { btn.style.removeProperty('background'); }, 1000);
            return
        }
        if (action === 'lemmatization') {
            let text = await navigator.clipboard.readText();
            const blockArray = [];
            text.split(`\n`).forEach(el => blockArray.push(el.split(' ')))

            const finalDate = await lemmatization(blockArray)
            const resultText = finalDate.map(d => d.join(' ')).join('\n');
            await navigator.clipboard.writeText(resultText);
            showBtnToast(action, 'lemmatization was successful', 'success')
            return
        }
    } catch { }
    finally { document.getElementById('loader').classList.remove('show'); }
});


document.addEventListener('change', async (e) => {
    if (e.target.name === 'range') {
        const value = e.target.value;
        await storage.set('calcBtn', 'range', value)
    }
    if (e.target.name === 'kwMatchType') {
        const value = e.target.value;
        await storage.set('kw_match_type', 'match_type', value)
    }

    if (e.target.name === 'selSitePars') {
        const value = e.target.value;
        await storage.set('parse_search_result', 'number_of_sites', value)
    }
    if (e.target.name === 'snippet') {
        const allChecked = Array.from(document.querySelectorAll('input[name="snippet"]:checked')).map(el => el.value);
        await storage.set('parse_search_result', 'snippet_fields', allChecked);
    }

    if (e.target.name === 'kwAndUrls') {
        const value = e.target.value;
        await storage.set('kw_and_urls', 'type', value)
    }
    if (e.target.name === 'average') {
        const allChecked = Array.from(document.querySelectorAll('input[name="average"]:checked')).map(el => el.value);
        await storage.set('average_metricks', 'active', allChecked);
    }
    if (e.target.name === 'uiVisibility') {
        const checked = Array.from(document.querySelectorAll('input[name="uiVisibility"]:checked')).map(el => el.value);
        await modules.storage.set('ui', 'visibleButtons', checked);
        await renderButtons();
    }

    if (e.target.name === 'columnComma') {
        const value = e.target.value; await storage.set('n-gram', 'type_of_unloading', value);
        await nGramCheckDisabled('columnComma')
    }
    if (e.target.name === 'pageAndCopy') {
        const value = e.target.value; await storage.set('n-gram', 'process_from', value);
        await nGramCheckDisabled('pageAndCopy', e.target);
    }
    if (e.target.name === 'gramUnion') {
        const checkbox = document.querySelector('input[name="gramUnion"]');
        const isChecked = checkbox.checked;
        await storage.set('n-gram', 'gram_union', isChecked);
    }
    if (e.target.name === 'usHead') {
        const checkbox = document.querySelector('input[name="usHead"]');
        const isChecked = checkbox.checked;
        await storage.set('n-gram', 'using_headings', isChecked);
    }
    if (e.target.name === 'n-gram') {
        const allChecked = Array.from(document.querySelectorAll('input[name="n-gram"]:checked')).map(el => el.value);
        await storage.set('n-gram', 'n-gram_checked', allChecked);
        await nGramCheckDisabled('ngramChecked', e.target);
    }
    if (e.target.name === 'lemGram') {
        const allChecked = Array.from(document.querySelectorAll('input[name="lemGram"]:checked')).map(el => el.value);
        await storage.set('n-gram', 'lem_gram_set', allChecked);
        await nGramCheckDisabled('lemGram', e.target);
    }
    if (e.target.name === 'colGram') {
        const allChecked = Array.from(document.querySelectorAll('input[name="colGram"]:checked')).map(el => el.value);
        await storage.set('n-gram', 'sel_col_gram', allChecked);
    }
});

async function nGramCheckDisabled(action) {
    if (['columnComma', 'all'].includes(action)) {
        if (document.querySelector('select[name="columnComma"').value === 'columns') {
            document.querySelector('input[value="gram.col.numberOfRepetitions"]').disabled = false;
        }
        else {
            document.querySelector('input[value="gram.col.numberOfRepetitions"]').disabled = true;
            document.querySelector('input[value="gram.col.numberOfRepetitions"]').checked = false;
            await storage.removeByValue('n-gram', 'sel_col_gram', 'gram.col.numberOfRepetitions');
        }
    }
    if (['pageAndCopy', 'all'].includes(action)) {
        if (document.querySelector('select[name="pageAndCopy"').value === 'buffer') {
            document.querySelector('input[value="gram.col.domain"]').disabled = true;
            document.querySelector('input[value="gram.col.domain"]').checked = false;
            await storage.removeByValue('n-gram', 'sel_col_gram', 'gram.col.domain')
        }
        else {
            document.querySelector('input[value="gram.col.domain"]').disabled = false;
        }
        if (document.querySelector('select[name="pageAndCopy"]').value === 'pages_buffer') {
            document.querySelector('input[value="gramUnion"]').disabled = false;
        }
        else {
            document.querySelector('input[value="gramUnion"]').disabled = true;
            document.querySelector('input[value="gramUnion"]').checked = false;
            await storage.remove('n-gram', 'gram_union')
        }
    }
    if (['ngramChecked', 'all'].includes(action)) {
        const allCheckboxes = document.querySelectorAll('input[name="n-gram"]');
        const checked = Array.from(allCheckboxes).filter(el => el.checked);
        if (checked.length === 1) { checked[0].disabled = true;
        } else { allCheckboxes.forEach(el => el.disabled = false);}
    }
}