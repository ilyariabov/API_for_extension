window.modules = {};

// ===== lazyLoader =====
window.modules.lazyLoader = {
    async scrollAll() {
        const scrollContainer = document.querySelector('[acxscrollhost]');
        if (!scrollContainer) return 'no';
        const startScrollTop = scrollContainer.scrollTop;
        const step = 300, delay = 50;
        return new Promise((resolve) => {
            let lastScrollTop = -1;
            function scrollDown() {
                scrollContainer.scrollTop += step;
                if (scrollContainer.scrollTop === lastScrollTop) { setTimeout(scrollUp, 800); return; }
                lastScrollTop = scrollContainer.scrollTop;
                setTimeout(scrollDown, delay);
            }
            function scrollUp() {
                scrollContainer.scrollTo({ top: startScrollTop });
                setTimeout(() => resolve('ok'), 500);
            }
            scrollDown();
        });
    }
};

// ===== storage =====
window.modules.storage = {
    async getAll() {
        if (!chrome?.storage?.local) { return JSON.parse(localStorage.getItem('settings') || '{}'); }
        return new Promise(resolve => {
            chrome.storage.local.get(['settings'], res => { resolve(res.settings || {}); });
        });
    },

    async setAll(settings) {
        if (!chrome?.storage?.local) { localStorage.setItem('settings', JSON.stringify(settings)); return; }
        return new Promise(resolve => { chrome.storage.local.set({ settings }, resolve); });
    },

    async get(mainKey, key) {
        const settings = await this.getAll();
        if (!settings[mainKey]) return undefined; if (!key) return settings[mainKey];
        return settings[mainKey][key];
    },

    async getMK(mainKey) {
        const settings = await this.getAll();
        return settings[mainKey];
    },

    async set(mainKey, key, value) {
        const settings = await this.getAll();
        if (!settings[mainKey]) settings[mainKey] = {};
        settings[mainKey][key] = value;
        await this.setAll(settings);
    },

    async remove(mainKey, key) {
        const settings = await this.getAll();
        if (!settings[mainKey]) return;
        if (key) {
            delete settings[mainKey][key];
            if (Object.keys(settings[mainKey]).length === 0) delete settings[mainKey];
        } else { delete settings[mainKey]; }
        await this.setAll(settings);
    },

    async removeByValue(mainKey, key, value) {
        const settings = await this.getAll();
        const target = settings[mainKey];
        if (!target) return;
        if (Array.isArray(target[key])) { 
            target[key] = target[key].filter(item => item !== value);
            if (target[key].length === 0) delete target[key];
        }
        else if (target[key] === value) delete target[key];
        if (Object.keys(target).length === 0) delete settings[mainKey];
        await this.setAll(settings);
    },

    async clear() {
        if (!chrome?.storage?.local) { localStorage.removeItem('settings'); return; }
        return new Promise(resolve => { chrome.storage.local.remove(['settings'], resolve); });
    }
};