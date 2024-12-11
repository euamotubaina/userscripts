// ==UserScript==
// @name            Orpheus: CSS Hacks
// @description     Collages below torrents, adds .tl_notice
// @author          commoner@orpheus.network
// @namespace       https://github.com/euamotubaina
// @version         2024-12-11-03
// @grant           none
// @match           https://orpheus.network/torrents.php?id=*
// @match           https://orpheus.network/artist.php?id=*
// @downloadURL     https://raw.githubusercontent.com/euamotubaina/userscripts/main/ops-csshacks.js
// @updateURL       https://raw.githubusercontent.com/euamotubaina/userscripts/main/ops-csshacks.js
// @icon            https://orpheus.network/favicon.ico
// ==/UserScript==


(function() {
    'use strict';

    const torrents = document.querySelector('#torrent_details, #discog_table');
    if (torrents) {
        Array.from(document.querySelectorAll('.collage_table')).reverse().forEach((collages) => {
            collages.remove();
            torrents.parentNode.insertBefore(collages, torrents.nextSibling);
        });
    }

    // css hacks
    // add .tl_notice class to fix the add_releases script
    const tlNot = document.createElement('style');
    tlNot.textContent = `
        .tl_notice {
            color: #d47744 !important;
            font-weight: 400;
        }
        .main_column .td_info a[href^="http"]:hover,
        .main_column .td_info a[href^="https"]:hover {
            background: none !important;
        }
        `;
    document.head.appendChild(tlNot);

})();