// ==UserScript==
// @name          OPS-RED: Exact filesizes
// @description   Get exact size of files. Click [SZ] next to [PL]
// @version       2024-12-16
// @namespace     github.com/euamotubaina
// @author        userscript1
// @match         https://redacted.sh/torrents.php?id=*
// @match         https://orpheus.network/torrents.php?id=*
// @license       GPLv3
// @grant         GM_getValue
// @grant         GM_setValue
// @grant         GM_deleteValue
// @require       https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js
// @downloadURL   https://raw.githubusercontent.com/euamotubaina/userscripts/main/ops-red-exact-filesizes.js
// @updateURL     https://raw.githubusercontent.com/euamotubaina/userscripts/main/ops-red-exact-filesizes.js
// ==/UserScript==

(function() {
  'use strict';

  const url = new URL(location);
  const isOps = url.hostname === 'orpheus.network';
  const apiURL = `https://${url.hostname}/ajax.php?action=torrent&id=`;
  const CACHE_EXPIRY_DAYS = GM_getValue("CACHE_EXPIRY_TIME", 7);
  const CACHE_EXPIRY_TIME = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  async function getApi(torrentId) {
    let cacheData;
    const cacheKey = `${isOps ? 'OPS' : 'RED'}_${torrentId}`;

    const compressedData = GM_getValue(cacheKey, null);
    if (compressedData && typeof compressedData === "string") {
      const decompressedData = LZString.decompress(compressedData);
      if (decompressedData) {
        cacheData = JSON.parse(decompressedData);
        const currentTime = Date.now();
        if (currentTime - cacheData.timestamp > CACHE_EXPIRY_TIME) {
          GM_deleteValue(cacheKey);
          cacheData = null;
        };
      };
    };

    if (!cacheData) {
      const data = await ((await fetch(apiURL + torrentId)).json())
      if (!data) {
        throw new Error("Something went wrong with the API");
      }
      cacheData = {
        timestamp: Date.now(),
        data: data,
      };
      const compressedData = LZString.compress(JSON.stringify(cacheData));
      GM_setValue(cacheKey, compressedData);
    }

    return cacheData.data;
  };

  function parseFilesData(torRowEl, filesEl, filesData) {
    let totalSZ = torRowEl.querySelector('.td_totalexactsize');
    let totalSizeEl = torRowEl.querySelector(':scope > td.td_size, :scope > td.nobr:not(.td_filecount, .td_totalexactsize)');
    if (!totalSZ) {
      totalSZ = totalSizeEl.cloneNode();
      totalSZ.classList.add('td_totalexactsize');
      totalSZ.classList.remove('td_size');
      totalSZ.textContent = filesData.totalSize.toLocaleString();
      totalSizeEl.classList.add('hidden');
      torRowEl.insertBefore(totalSZ, totalSizeEl);
    } else {
      totalSZ.classList.toggle('hidden');
      totalSizeEl.classList.toggle('hidden');
    }

    filesEl.querySelectorAll('tr:not(.colhead_dark)').forEach((tr, i) => {
      const fileData = filesData.fileList[i];
      if (tr.children[0].textContent === fileData.name) {
        let tdSZ = tr.querySelector('.td_exactsize');
        if (!tdSZ) {
          tdSZ = tr.children[1].cloneNode();
          tdSZ.classList.add('td_exactsize');
          tdSZ.textContent = fileData.size.toLocaleString();
          tr.children[1].classList.add('hidden');
          tr.appendChild(tdSZ);
        } else {
          tdSZ.classList.toggle('hidden');
          tr.children[1].classList.toggle('hidden');
        };
      };
    });
  };

  document.querySelectorAll(
    'a[title="Permalink"],.button_pl,\
    .torrent_links_block a.tooltip[href^="torrents.php?torrentid="]'
  ).forEach(a => {
    const torrentId = a.href.split('torrentid=')[1];
    const szEl = document.createElement('a');
    szEl.href = "#";
    szEl.classList.add("tooltip", "button_sz");
    szEl.dataset.id = torrentId;
    szEl.title = "Exact filesizes";
    szEl.textContent = "SZ";
    a.parentElement.insertBefore(szEl, a);
    const divEl = document.createTextNode(' | ');
    a.parentElement.insertBefore(divEl, a);
  });

  let firstRun = true;

  document.querySelectorAll('a.button_sz').forEach(a => {
    a.addEventListener('click', async evt => {
      evt.preventDefault();

      const torRowEl = document.getElementById(`torrent${evt.target.dataset.id}`)
      const filesEl = document.getElementById(`files_${evt.currentTarget.dataset.id}`);
      if (filesEl.classList.contains('hidden')) {
        evt.currentTarget.parentElement.nextElementSibling.click();
        document.getElementById(`torrent_${evt.currentTarget.dataset.id}`)
          .querySelector('a[onclick^="show_files"], a.view-filelist')
          .click();
      }

      const res = await getApi(evt.target.dataset.id);
      const filesData = {
        fileList: res.response.torrent.fileList.split('|||').map(f => {
          const s = f.split(/{{3}|}{3}/);
          return {name: s[0], size: parseInt(s[1])};
        }),
        get totalSize() {
          return this.fileList.reduce((acc, cv) => acc + cv.size, 0);
        }
      };

      if (isOps && firstRun) {
        const observer = new MutationObserver(() => parseFilesData(torRowEl, filesEl, filesData));
        observer.observe(filesEl, {childList: true});
        firstRun = false;
      } else {
        parseFilesData(torRowEl, filesEl, filesData);
      }

    });
  });

})();