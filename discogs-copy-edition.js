// ==UserScript==
// @name            Discogs Copy Edition
// @namespace       github.com/euamotubaina
// @version         2024-12-29
// @description     Enable user selection in editions table
// @author          euamotubaina
// @match           http*://*.discogs.com/master/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=discogs.com
// @grant           none
// @downloadURL     https://raw.githubusercontent.com/euamotubaina/userscripts/refs/heads/main/discogs-copy-edition.js
// @updateURL       https://raw.githubusercontent.com/euamotubaina/userscripts/refs/heads/main/discogs-copy-edition.js
// ==/UserScript==

(function() {
    'use strict';

    const editionsTbl = document.querySelector('#versions div[class^="well_"] table tbody');
    const moreBtn = document.querySelector('#versions button[class^="more_"]');

    // enable selection on versions table
    let isSelecting = false;
    const sel = getSelection();

    /**
     * @param {HTMLTableRowElement} tableEl
     * @returns {void}
    */
    const handleSelection = tableEl => {
        tableEl.querySelectorAll('tr').forEach(tr => {
            tr.addEventListener('mousedown', evtMDown => {
                let caretPos;

                if (evtMDown.shiftKey) {
                    caretPos = document.caretPositionFromPoint(evtMDown.clientX, evtMDown.clientY);
                    sel.extend(caretPos.offsetNode, caretPos.offset)
                    return;
                }

                const range = document.createRange();
                sel.removeAllRanges();
                caretPos = document.caretPositionFromPoint(evtMDown.clientX, evtMDown.clientY);
                range.setEnd(caretPos.offsetNode, caretPos.offset);
                range.collapse();
                sel.addRange(range);
                isSelecting = true;

                const mOverListener = tableEl.addEventListener('mousemove', evtMOver => {
                    if (isSelecting) {
                        caretPos = document.caretPositionFromPoint(evtMOver.clientX, evtMOver.clientY);
                        sel.extend(caretPos.offsetNode, caretPos.offset)
                    };
                });

                if (isSelecting) {
                    tableEl.addEventListener('mouseup', evtMUp => {
                        tableEl.removeEventListener('mouseover', mOverListener);
                        isSelecting = false;
                    });
                };
            });

        });
    };

    if (moreBtn) {
        // auto-expand versions table
        moreBtn.click();
        const observer = new MutationObserver(() => handleSelection(editionsTbl));
        observer.observe(editionsTbl, { childList: true });
    } else {
        handleSelection(editionsTbl);
    }

    // fetch release info on expand version row
    editionsTbl.querySelectorAll('tr td[class^="toggle__"] button').forEach(tgl => {
        tgl.addEventListener('click', async evt => {
            /** @type {Element} */
            const tr = evt.target.closest('tr');
            let extraInfo = tr.querySelector('td.extra_info');
            if (extraInfo) {
                extraInfo.remove();
            } else {
                const relTxt = await (await fetch(tr.querySelector('[class^="title_"] a').href, {
                    "credentials": "include",
                    "headers": {
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                        "Alt-Used": "www.discogs.com",
                        "Pragma": "no-cache",
                        "Cache-Control": "no-cache"
                    },
                    "method": "GET",
                    "mode": "cors"
                })).text();
                const relParsed = Document.parseHTMLUnsafe(relTxt);

                // const relHeader     = relParsed.querySelector('div[class^="main_"] div[class^="body_"]');
                const relTracklist  = relParsed.getElementById('release-tracklist');
                const relCompanies  = relParsed.getElementById('release-companies');
                const relCredits    = relParsed.getElementById('release-credits');
                const relNotes      = relParsed.getElementById('release-notes');
                const relBarcodes   = relParsed.getElementById('release-barcodes');

                extraInfo = document.createElement('td');
                extraInfo.classList.add('extra_info');
                extraInfo.style.gridColumn = '1/-1';
                tr.appendChild(extraInfo);

                // relHeader    && extraInfo.appendChild(relHeader);
                relTracklist && extraInfo.appendChild(relTracklist);
                relCompanies && extraInfo.appendChild(relCompanies);
                relCredits   && extraInfo.appendChild(relCredits);
                relNotes     && extraInfo.appendChild(relNotes);
                relBarcodes  && extraInfo.appendChild(relBarcodes);
            }
        });
    });

})();