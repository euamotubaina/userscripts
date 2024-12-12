// ==UserScript==
// @name            Data Crystal monospace
// @namespace       https://github.com/euamotubaina
// @version         2024-12-12
// @description     Upgrade monospace font
// @author          euamotubaina
// @match           https://datacrystal.tcrf.net/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=tcrf.net
// @grant           none
// @downloadURL     https://raw.githubusercontent.com/euamotubaina/userscripts/main/data-crystal.js
// @updateURL       https://raw.githubusercontent.com/euamotubaina/userscripts/main/data-crystal.js
// ==/UserScript==

(() => {
    'use strict';

    window.addEventListener("load", () => {
        // console.log(document.querySelectorAll("link[rel=stylesheet]"))
        const linkEls = document.querySelectorAll("link[rel=stylesheet]");
        if (linkEls) {
            const preStyle = [...linkEls[1].sheet.cssRules].find(rule => rule.selectorText == 'textarea, pre, code, tt');
            if (preStyle) {
                preStyle.style.fontFamily = `"Roboto Mono", ${preStyle.style.fontFamily}`;
            }
        }
    });

})();
