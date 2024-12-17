// ==UserScript==
// @name            Discogs Copy Edition
// @namespace       github.com/euamotubaina
// @version         2024-12-17
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

    let moreBtn = document.querySelector('#versions button[class^="more_"]');
    moreBtn?.click();

    const editionsTbl = document.querySelector('#versions div[class^="well_"] table tbody');
    let isSelecting = false;
    const sel = getSelection();

    const observer = new MutationObserver(() => {
        const editionsRws = editionsTbl.querySelectorAll('tr');
        editionsRws.forEach(tr => {
            tr.addEventListener('mousedown', evtMDown => {
                const range = document.createRange();
                sel.removeAllRanges();
                let caretPos = document.caretPositionFromPoint(evtMDown.clientX, evtMDown.clientY);
                range.setEnd(caretPos.offsetNode, caretPos.offset);
                range.collapse();
                sel.addRange(range);
                isSelecting = true;

                let mOverListener = editionsTbl.addEventListener('mousemove', evtMOver => {
                    if (isSelecting) {
                        caretPos = document.caretPositionFromPoint(evtMOver.clientX, evtMOver.clientY);
                        sel.extend(caretPos.offsetNode, caretPos.offset)
                    };
                });

                if (isSelecting) {
                    editionsTbl.addEventListener('mouseup', evtMUp => {
                        editionsTbl.removeEventListener('mouseover', mOverListener);
                        isSelecting = false;
                    });
                };
            });

        });
    });

    observer.observe(editionsTbl, { childList: true });

})();