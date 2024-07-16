// ==UserScript==
// @name        Orpheus: Collages below torrents
// @description Put collages below torrents
// @author      commoner@orpheus.network
// @namespace   https://github.com/euamotubaina
// @version     2024-07-16
// @grant       none
// @match       https://orpheus.network/torrents.php?id=*
// @match       https://orpheus.network/artist.php?id=*
// @icon        https://orpheus.network/favicon.ico
// @downloadURL https://raw.githubusercontent.com/euamotubaina/userscripts/main/ops_collages.js
// @updateURL   https://raw.githubusercontent.com/euamotubaina/userscripts/main/ops_collages.js
// ==/UserScript==


(() => {
    'use strict'

    const torrents = document.querySelector('#torrent_details, #discog_table');
    if (torrents) {
        Array.from(document.querySelectorAll('.collage_table')).reverse().forEach((collages) => {
            collages.remove();
            torrents.parentNode.insertBefore(collages, torrents.nextSibling);
        });
    }
});
