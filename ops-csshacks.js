// ==UserScript==
// @name            OPS: CSS Hacks
// @description     Collages below torrents, adds .tl_notice
// @author          euamotubaina
// @namespace       github.com/euamotubaina
// @version         2024-12-20_01
// @grant           none
// @match           https://orpheus.network/torrents.php*
// @match           https://orpheus.network/artist.php?id=*
// @match           https://orpheus.network/collages.php?id=*
// @downloadURL     https://raw.githubusercontent.com/euamotubaina/userscripts/main/ops-csshacks.js
// @updateURL       https://raw.githubusercontent.com/euamotubaina/userscripts/main/ops-csshacks.js
// @icon            https://orpheus.network/favicon.ico
// ==/UserScript==


(function() {
    'use strict';

    // collages below torrents
    const torrents = document.querySelector('#torrent_details, #discog_table');
    if (torrents) {
        Array.from(document.querySelectorAll('.collage_table')).reverse().forEach((collages) => {
            collages.remove();
            torrents.parentNode.insertBefore(collages, torrents.nextSibling);
        });
    }

    // css hacks
    // add .tl_notice class to fix the add_releases script
    // darken torrent group headers background-color
    const tlNot = document.createElement('style');
    tlNot.textContent =
`.tl_notice {
    color: #d47744 !important;
    font-weight: 400;
}
.main_column .td_info a[href^="http"]:hover,
.main_column .td_info a[href^="https"]:hover {
    background: none !important;
}
.torrent_table tr.edition {
    background-color: transparent;
}`;
    document.head.appendChild(tlNot);

})();