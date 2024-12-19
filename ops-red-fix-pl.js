// ==UserScript==
// @name            OPS-RED: Fix PL
// @namespace       github.com/euamotubaina
// @version         2024-12-19
// @description     Fix PL links
// @author          euamotubaina
// @grant           none
// @match           https://orpheus.network/torrents.php?id=*
// @match           https://orpheus.network/artist.php?id=*
// @match           https://orpheus.network/collages.php?id=*
// @match           https://redacted.sh/torrents.php?id=*
// @match           https://redacted.sh/artist.php?id=*
// @match           https://redacted.sh/collages.php?id=*
// @downloadURL     https://raw.githubusercontent.com/euamotubaina/userscripts/main/ops-red-fix-pl.js
// @updateURL       https://raw.githubusercontent.com/euamotubaina/userscripts/main/ops-red-fix-pl.js
// ==/UserScript==

(() => {
    'use strict';

    Array.from(document.querySelectorAll('.torrent_row.group_torrent a[href^="torrents.php?id="]'))
        .forEach(pl => {
            if (pl.textContent === 'PL') pl.classList.remove("group_snatched", "gazelle_snatched", "gazelle_uploaded", "gazelle_leeching", "gazelle_seeding");
            const m = pl.href.match(/id=\d+&torrentid=(\d+)(?:(#torrent\d+|.*?))$/);
            if (m) {
                pl.href = `torrents.php?torrentid=${m[1]}`;
            }
        });
})();