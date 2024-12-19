// ==UserScript==
// @name            RED: Fix Gazelle Snatched
// @namespace       github.com/euamotubaina
// @version         2024-12-19_01
// @description     Fix Gazelle Snatched
// @author          euamotubaina
// @grant           none
// @match           https://redacted.sh/torrents.php*
// @match           https://redacted.sh/artist.php?id=*
// @match           https://redacted.sh/collages.php*
// @icon            https://redacted.sh/favicon.ico
// @downloadURL     https://raw.githubusercontent.com/euamotubaina/userscripts/main/red-fix-gazelle-snatched.js
// @updateURL       https://raw.githubusercontent.com/euamotubaina/userscripts/main/red-fix-gazelle-snatched.js
// ==/UserScript==

(() => {
    'use strict';

    const sSheet = [...document.styleSheets].find(s => s.title === 'red_dark')
    if (sSheet) {
        // remove !important from rule
        const gtLinks = [...sSheet.cssRules].find(rule => rule.selectorText == '.group_torrent a');
        gtLinks.style.color = gtLinks.style.color;
        // make link separators in torrent_actions_buttons visible
        const taSep = [...sSheet.cssRules].find(rule => rule.selectorText == '.group_torrent td:first-of-type span');
        taSep?.style.visibility = '';
    }
})();