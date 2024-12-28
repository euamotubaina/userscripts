// ==UserScript==
// @name            Data Crystal monospace
// @namespace       github.com/euamotubaina
// @version         2024-12-28
// @description     Upgrade monospace font
// @author          euamotubaina
// @match           https://*.tcrf.net/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=tcrf.net
// @grant           none
// @downloadURL     https://raw.githubusercontent.com/euamotubaina/userscripts/main/data-crystal.js
// @updateURL       https://raw.githubusercontent.com/euamotubaina/userscripts/main/data-crystal.js
// ==/UserScript==

(() => {
    'use strict';

    const customMonoEl = document.createElement('style');
    customMonoEl.textContent = `
textarea, pre, code, tt {
    font-family: 'Roboto Mono', 'DejaVu Sans Mono', 'Droid Sans Mono', 'Lucida Console', monospace;
}`;
    document.head.appendChild(customMonoEl);


})();
