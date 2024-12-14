// ==UserScript==
// @name            OPS/RED: Add releases
// @namespace       https://github.com/euamotubaina
// @version         2024-12-14
// @description     Add releases to/from RED/OPS
// @author          Audionut
// @match           https://orpheus.network/torrents.php?id=*
// @match           https://orpheus.network/artist.php?id=*
// @match           https://redacted.sh/torrents.php?id=*
// @match           https://redacted.sh/artist.php?id=*
// @grant           GM_xmlhttpRequest
// @grant           GM_addStyle
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_registerMenuCommand
// @grant           GM_deleteValue
// @grant           GM_listValues
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@43fd0fe4de1166f343883511e53546e87840aeaf/gm_config.js
// @require         https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js
// @downloadURL     https://raw.githubusercontent.com/euamotubaina/userscripts/refs/heads/main/ops-red-add-releases.js
// @updateURL       https://raw.githubusercontent.com/euamotubaina/userscripts/refs/heads/main/ops-red-add-releases.js
// ==/UserScript==

(function() {
  "use strict";

  function createSettingsMenu() {
    const fields = {
      OPS_API_KEY: {
        label: "OPS API Key",
        type: "text",
        default: GM_getValue("OPS_API_KEY", ""),
        title: "Enter your OPS API Key",
      },
      RED_API_KEY: {
        label: "RED API Key",
        type: "text",
        default: GM_getValue("RED_API_KEY", ""),
        title: "Enter your RED API Key",
      },
      High_Lighting: {
        label: "Add highlighting to the added rows",
        type: "checkbox",
        default: GM_getValue("High_Lighting", false),
        title: "Add or not",
      },
      sizeMatching: {
        label: "Size Tolerance (in MiB)",
        type: "number",
        default: GM_getValue("sizeMatching", 0),
        title: "Allowed difference in size for matching (in MiB)",
      },
      CACHE_EXPIRY_TIME: {
        label: "Cache Expiry Time (in days)",
        type: "number",
        default: GM_getValue("CACHE_EXPIRY_TIME", 7), // default 7 days
        title: "Cache expiry time in days",
      },
      showFileCount: {
        label: "Show file count",
        type: "checkbox",
        default: GM_getValue("showFileCount", true),
        title: "Show file count column. Default: true",
      },
    };

    GM_config.init({
      id: "APIConfig",
      title: "API Configuration Settings",
      fields: fields,
      css: `
        #APIConfig {
            background: #333;
            color: #fff;
            padding: 20px;
            width: 400px;
            max-width: 90%;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        #APIConfig .field_label {
            color: #fff;
            width: 90%;
        }
        #APIConfig .config_header {
            color: #fff;
            padding-bottom: 10px;
        }
        #APIConfig .config_var {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
        }
        #APIConfig .config_var input {
            width: 60%;
            padding: 4px;
        }
            `,
      events: {
        save: function () {
          const fields = GM_config.fields;
          for (const field in fields) {
            if (fields.hasOwnProperty(field)) {
              const value = GM_config.get(field);
              GM_setValue(field, value);
            }
          }
        },
      },
    });

    GM_registerMenuCommand("Configure API & Cache Settings", () => {
      GM_config.open();
    });
  }

  const isOPS = window.location.hostname.includes("orpheus.network");
  const sourceTracker = isOPS ? "OPS" : "RED";
  const targetTracker = !isOPS ? "OPS" : "RED";
  const trackerDomains = {
    RED: "orpheus.network",
    OPS: "redacted.sh"
  };
  const API_KEYS = {
    OPS: GM_getValue("OPS_API_KEY"),
    RED: GM_getValue("RED_API_KEY")
  };
  const highLighting = GM_getValue("High_Lighting", false);
  const sizeMatching = GM_getValue("sizeMatching", 0);
  const showFileCount = GM_getValue("showFileCount", true);
  const CACHE_EXPIRY_DAYS = GM_getValue("CACHE_EXPIRY_TIME", 14);
  const CACHE_EXPIRY_TIME = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds
  const isArtistPage = window.location.href.includes("artist.php?id=");

  // Function to extract artist name from the page header
  function extractArtistData() {
    let artistLink = !isArtistPage
      ? document.getElementById('artist_list').querySelector(':is(.artist_main, .artists_main) a')
      : document.querySelector('.header h2');
    let artistName, artistId;
    if (artistLink) {
      artistName = artistLink.textContent.trim();
      artistId = !isArtistPage
        ? artistLink.getAttribute('href').split('artist.php?id=')[1]
        : window.location.href.split('artist.php?id=')[1];
      if (artistName) {
        //console.log("Artist Name:", artistName);
        return { artistName, artistId };
      }
    }
    console.warn("Artist data not found.");
    return null;
  }

  function flushCache() {
    const keys = GM_listValues();
    keys.forEach((key) => {
      // Delete keys except OPS_API_KEY and RED_API_KEY
      if (
        (key.startsWith("CACHE_") ||
          key.startsWith("OPS_") ||
          key.startsWith("RED_") ||
          key.startsWith("TARGET_") ||
          key.startsWith("SOURCE_") ||
          key.startsWith("https")) &&
        key !== "OPS_API_KEY" &&
        key !== "RED_API_KEY"
      ) {
        GM_deleteValue(key);
      }
    });
    alert("Cache has been flushed, except API keys.");
  }

  // Create the "Flush Cache" link
  const flushLink = document.createElement("a");
  flushLink.textContent = "Flush Cache";
  flushLink.href = "#";
  flushLink.style.marginLeft = "10px";
  flushLink.onclick = (e) => {
    e.preventDefault();
    flushCache();
  };

  // Append the link to div.linkbox
  const linkboxDiv = document.querySelector("div.linkbox");
  if (linkboxDiv) {
    linkboxDiv.appendChild(flushLink);
  } else {
    console.warn("linkbox div not found, cannot append cache flush link.");
  }

  // Add the h2 text as the first child of <div id="SnatchData">
  const snatchDataDiv = document.querySelector(".header");
  let searchingHeader = document.getElementById("searching-header");
  if (!searchingHeader) {
    searchingHeader = document.createElement("h2");
    searchingHeader.classList.add("page__title");
    searchingHeader.textContent = `Pulling data from ${targetTracker} API.....`;
    searchingHeader.style.color = "yellow";
    searchingHeader.id = "searching-header";
    snatchDataDiv.insertBefore(searchingHeader, snatchDataDiv.secondChild);
  }

  // Function to compress and cache data
  const setCache = (key, data) => {
    const cacheData = {
      timestamp: Date.now(),
      data: data,
    };
    const stringData = JSON.stringify(cacheData);
    const compressedData = LZString.compress(stringData);
    GM_setValue(key, compressedData);
  };

  // Function to decompress and retrieve cached data
  const getCache = (key) => {
    const compressedData = GM_getValue(key, null);
    if (compressedData && typeof compressedData === "string") {
      const decompressedData = LZString.decompress(compressedData);
      if (decompressedData) {
        const cacheData = JSON.parse(decompressedData);
        const currentTime = Date.now();
        if (currentTime - cacheData.timestamp > CACHE_EXPIRY_TIME) {
          GM_deleteValue(key); // Delete expired cache
          return null;
        }
        return cacheData.data;
      }
    }
    return null;
  };

  const apiRequest = async (name, tracker = "OPS", id = false) => {
    const cacheKey = id ? `${tracker}_ID_${id}` : null;
    const cachedData = getCache(cacheKey);

    if (cachedData) {
      console.log(`${tracker} API data from cache:`, cachedData);
      return await cachedData;
    }

    const res = await GM.xmlHttpRequest({
      url: `"https://${trackerDomains[tracker]}/ajax.php?action=artist&artistreleases=1&"${
        id ? `id=${id}` : `artistname=${encodeURIComponent(name)}`
      }`,
      method: "GET",
      headers: {
        Authorization: API_KEYS[tracker],
        "Content-Type": "application/json",
      }
    });

    if (res.status === 200) {
      const responseJson = JSON.parse(res.responseText);
      console.log(`${tracker} API response:`, responseJson);
      setCache(cacheKey ?? `${tracker}_ID_${responseJson.response.id}`, responseJson);
      return responseJson;
    } else {
      throw new Error(`${tracker} API Error: HTTP ${res.status}`);
    }
  };

  // Helper function to normalize strings (trim, convert to lowercase, etc.)
  function normalize(str) {
    if (!str) return "";
    const textarea = document.createElement("textarea");
    textarea.innerHTML = str;
    let decodedStr = textarea.value;
    decodedStr = decodedStr.replace(/\s*[-–—]\s*/g, "-");
    decodedStr = decodedStr.replace(/\s+/g, " ");
    return decodedStr.trim().toLowerCase().replace(/['"]/g, "");
  }

    let match_group;
    let releaseType;

  // Function to match torrents between OPS and RED
  function findMatchingTorrent(sourceData, targetData) {
    // Assign source and target torrents based on current site
    const sourceTorrents = sourceData.response.torrentgroup;
    const targetTorrents = targetData.response.torrentgroup;

    const exactMatches = [];
    const toleranceMatches = [];
    const unmatchedTargetTorrents = [];

    targetTorrents.forEach((targetGroup) => {
      const targetGroupName = normalize(targetGroup.groupName);

      sourceTorrents.forEach((sourceGroup) => {
        const sourceGroupName = normalize(sourceGroup.groupName);
        releaseType = sourceGroup.releaseType;

        if (sourceGroupName === targetGroupName) {
          // Now match torrents within this group
          sourceGroup.torrent.forEach((sourceTorrent) => {
            targetGroup.torrent.forEach((targetTorrent) => {
              const exactSizeMatch = targetTorrent.size === sourceTorrent.size;
              const sizeDifference = Math.abs(targetTorrent.size - sourceTorrent.size);
              const sizeTolerance = 1024 * 1024 * sizeMatching; // MiB tolerance
              match_group = sourceTorrent.groupId;

              const allPropsMatch =
                (!targetTorrent.media || !sourceTorrent.media || normalize(targetTorrent.media) === normalize(sourceTorrent.media)) &&
                (!targetTorrent.format || !sourceTorrent.format || normalize(targetTorrent.format) === normalize(sourceTorrent.format)) &&
                (!targetTorrent.encoding || !sourceTorrent.encoding || normalize(targetTorrent.encoding) === normalize(sourceTorrent.encoding)) &&
                (!targetTorrent.remasterTitle || !sourceTorrent.remasterTitle || normalize(targetTorrent.remasterTitle) === normalize(sourceTorrent.remasterTitle)) &&
                (!targetTorrent.remasterYear || !sourceTorrent.remasterYear || targetTorrent.remasterYear === sourceTorrent.remasterYear);

              let labelMismatch = !normalize(targetTorrent.remasterRecordLabel).includes(normalize(sourceTorrent.remasterRecordLabel));
              let fileCountMismatch = targetTorrent.fileCount !== sourceTorrent.fileCount;
              let sizeToleranceMatch = sizeDifference < sizeTolerance && !exactSizeMatch;

              if (allPropsMatch && (exactSizeMatch || sizeToleranceMatch)) {
                if (!exactMatches.some((t) => t.id === targetTorrent.id)) {
                  // Check for duplicates
                  if (labelMismatch && targetTorrent.remasterRecordLabel) {
                    targetTorrent.remasterRecordLabelAppended = targetTorrent.remasterRecordLabel;
                  }
                  if (fileCountMismatch) {
                    targetTorrent.fileCountAppended = `FileCount: ${targetTorrent.fileCount}`;
                  }
                  if (sizeToleranceMatch) {
                    const sizeDifferenceMiB = sizeDifference / 1024 ** 2;
                    targetTorrent.sizeToleranceAppended = `SizeDifference: ${sizeDifferenceMiB.toFixed(2)} MiB`;
                  }
                  appendMatchHtml(sourceTorrent.id, targetTorrent);
                  exactMatches.push(targetTorrent);
                }
              } else if (allPropsMatch && sizeDifference < sizeTolerance) {
                if (!toleranceMatches.some((t) => t.id === targetTorrent.id)) {
                  // Check for duplicates
                  toleranceMatches.push(targetTorrent);
                }
              } else {
                if (!unmatchedTargetTorrents.some((t) => t.id === targetGroup.id)) {
                  // Check for duplicates in unmatched
                  unmatchedTargetTorrents.push(targetGroup);
                }
              }
            });
          });
        } else {
          if (!unmatchedTargetTorrents.some((t) => t.id === targetGroup.id)) {
            // Check for duplicates in unmatched
            unmatchedTargetTorrents.push(targetGroup);
          }
        }
      });
    });

    if (searchingHeader) searchingHeader.remove();
    if (exactMatches.length > 0 || toleranceMatches.length > 0) {
      return { exactMatches, toleranceMatches };
    }

    return null;
  }

  // Function to initiate the API requests based on the current site
  const artistData = extractArtistData();
  if (artistData) {
    (async () => {
      try {
        const sourceResponse = await apiRequest(artistData.artistName, sourceTracker, artistData.artistId)
        const sourceNameToIds = JSON.parse(GM_getValue(`${sourceTracker}_NAME_IDS`, "{}"));
        sourceNameToIds[sourceResponse.response.name] ??= sourceResponse.response.id;
        const targetNameToIds = JSON.parse(GM_getValue(`${targetTracker}_NAME_IDS`, "{}"));
        const targetResponse = await apiRequest(sourceResponse.response.name, targetTracker, targetNameToIds[sourceResponse.response.name]);
        targetNameToIds[targetResponse.response.name] = targetResponse.response.id;
        GM_setValue(`${sourceTracker}_NAME_IDS`, JSON.stringify(sourceNameToIds));
        GM_setValue(`${targetTracker}_NAME_IDS`, JSON.stringify(targetNameToIds));
        findMatchingTorrent(sourceResponse, targetResponse);
      } catch (error) {
        console.error("API request error:", error);
        if (searchingHeader) searchingHeader.remove();
      }
    })();
  } else {
    console.error("No artist data found on the page.");
  }

  if (isArtistPage) {
    if (isOPS) {

      // Listen for the toggle_group event on the group link
      document.getElementById(`groupid_${match_group} a.edition_toggle`).addEventListener("click", (event) => {
          event.preventDefault(); // Prevent default link behavior if needed

          // Call the function to toggle hidden on all rows with the group ID
          const dynamicRows = document.querySelectorAll(`.torrent_row.exact_match_row.group_torrent.groupid_${match_group}`);
          dynamicRows.forEach((row) => {
            // Toggle the 'hidden' class based on its current state
            row.classList.toggle("hidden");
          })
        });
    } else {
/*      // If not OPS, listen for the toggle_edition event on the specified group
      const editionToggleLink = document.querySelector(`.groupid_${match_group} .edition_info a`);

      if (editionToggleLink) {
        editionToggleLink.addEventListener("click", (event) => {
          event.preventDefault(); // Prevent default link behavior

          // Get the edition number from the matching row's classes
          const editionRow = editionToggleLink.closest(".torrent_row");
          const editionClass = Array.from(editionRow.classList).find((cls) => cls.startsWith("edition_"));

          // Toggle the hidden class for rows with the specified group ID and edition
          const editionRows = document.querySelectorAll(`.torrent_row.groupid_${match_group}.${editionClass}`);
          editionRows.forEach((row) => {
            if (row.classList.contains("hidden")) {
              row.classList.remove("hidden");
            } else {
              row.classList.add("hidden");
            }
          });
        });
      }*/
    }
  }

  function appendMatchHtml(torrentId, exactMatch) {
    const torrentRowId = `torrent${torrentId}`;
    let torrentRow = document.getElementById(torrentRowId);

    // Determine the version based on whatVersion
    const matchHtml = createMatchHtml(exactMatch);

    if (!torrentRow && isArtistPage && !isOPS) {
      // On artist pages without isOPS, locate the torrent row by searching for the torrentId within each row
      const rows = document.querySelectorAll(".torrent_row");
      rows.forEach((row) => {
        if (row.innerHTML.includes(`torrentid=${torrentId}`)) {
          torrentRow = row;
        }
      });
    }

    if (torrentRow) {
      const matchRow = document.createElement("tr");
      matchRow.id = `${torrentRowId}_match`;

      const editionClass = Array.from(torrentRow.classList).find((cls) => cls.startsWith("edition_"));
      matchRow.classList.add(
        "torrent_row",
        `releases_${releaseType}`,
        `groupid_${match_group}`,
        editionClass,
        "group_torrent",
        "exact_match_row",
      );
      if (highLighting) {
        matchRow.style.background = "hsl(175deg 20 40% / 0.25)";
      }
      matchRow.style.fontWeight = "normal";
      if (!isOPS && !isArtistPage && highLighting) {
        matchRow.style.fontSize = "0.91em";
      }
      matchRow.innerHTML = matchHtml;

      if (isArtistPage) {
        // Insert directly after the matched row
        torrentRow.parentNode.insertBefore(matchRow, torrentRow.nextSibling);
      } else {
        // On torrent pages, insert after the "hidden" row as usual
        let hiddenRow = torrentRow.nextElementSibling;
        while (hiddenRow && !hiddenRow.id.includes(`torrent_${torrentId}`)) {
          hiddenRow = hiddenRow.nextElementSibling;
        }

        if (hiddenRow) {
          hiddenRow.parentNode.insertBefore(matchRow, hiddenRow.nextSibling);
        } else {
          console.warn(`No hidden row found for torrent ID: ${torrentId}`);
        }
      }
    } else {
      //console.warn(`No element found for torrent ID: ${torrentId}`);
    }
  }

  function createMatchHtml(torrent, version = "version1") {
    const {
      leechers, seeders, snatched, size, media, format, encoding, scene,
      logScore, hasCue, id, remasterRecordLabelAppended, fileCountAppended,
      sizeToleranceAppended, isFreeload, freeTorrent, isNeutralleech,
    } = torrent;

    let sizeDisplay;
    let torrentDetails;
    let siteIcon;
    let details;
    let siteDlLink;
    if (!isOPS) {
      if (isArtistPage) {
        torrentDetails = `&nbsp;${format} / ${encoding}`;
      } else {
        torrentDetails = `${format} / ${encoding}`;
      }
      sizeDisplay = size >= 1024 ** 3
          ? (size / 1024 ** 3).toFixed(2) + " GB"
          : (size / 1024 ** 2).toFixed(2) + " MB";
      siteIcon = "»";
      details = `${torrentDetails}`;
      siteDlLink = `<a href="https://orpheus.network/download/torrentId=${id}#" class="dl-link" data-id="${id}" title="Download">DL</a>`;
    } else {
      torrentDetails = `${media} / ${format} / ${encoding}`;
      sizeDisplay = size >= 1024 ** 3
          ? (size / 1024 ** 3).toFixed(2) + " GiB"
          : (size / 1024 ** 2).toFixed(2) + " MiB";
      siteIcon = "▶";
      details = `${torrentDetails}`;
      siteDlLink = `<a href="#" class="dl-link" data-id="${id}" title="Download">DL</a>`;
    }

    if (scene) details += ` / Scene`;
    if (logScore) details += ` / Log (${logScore}%)`;
    if (hasCue) details += ` / Cue`;
    if (remasterRecordLabelAppended) details += ` / (RED label) ${remasterRecordLabelAppended}`;
    if (fileCountAppended) details += ` / ${fileCountAppended}`;
    if (sizeToleranceAppended) details += ` / ${sizeToleranceAppended}`;

    const colspanValue = isArtistPage ? 2 : 1;
    const torrentLink = `https://${trackerDomains[!isOPS ? "OPS" : "RED"]}/torrents.php?torrentid=${id}`;
    const leechLabel = isFreeload
      ? '<strong class="torrent_label tooltip tl_free" title="Freeload!" style="white-space: nowrap;">Freeload!</strong>'
      : freeTorrent
      ? '<strong class="torrent_label tooltip tl_free" title="Freeleech!" style="white-space: nowrap;">Freeleech!</strong>'
      : isNeutralleech
      ? '<strong class="torrent_label tooltip tl_neutral" title="Neutral Leech!" style="white-space: nowrap;">Neutral Leech!</strong>'
      : "";

    let darkLines = "";
    if (highLighting) {
      darkLines = !isOPS ? "text-align: right; padding-right: 15px !important;" : "";
    }

    return `<td class="td_info" colspan=${colspanValue}>${!isOPS && isArtistPage
        ? `&nbsp;&nbsp;${siteIcon} <a href="${torrentLink}" target="_blank">${details} ${leechLabel}</a>`
        : `<a href="${torrentLink}" target="_blank" style="background: none; padding: 0">${siteIcon} ${isOPS ? "[" : ""}${details}${
          isOPS ? "]" : ""} ${leechLabel}`}${!isOPS ? " / " : ""}<strong class="torrent_label tooltip tl_notice">${targetTracker}</strong></a>
        <span class="torrent_links_block" style="float: right;">
          ${isArtistPage && !isOPS ? "" : "[ "}
          ${isOPS || (!isOPS && !isArtistPage) ? `${siteDlLink}` : siteDlLink}
          ${!isOPS && isArtistPage ? "" : ` | <a class="tooltip" href=${torrentLink} target="_blank" style="background: none; padding: 0">PL</a>`}
          ${isArtistPage && !isOPS ? "" : " ]"}
        </span>
      </td>
      <td class="number_column td_filecount nobr ${!showFileCount || (!isOPS && isArtistPage) ? "hidden" : ""}">${torrent.fileCount}</td>
      <td class="number_column td_size nobr" style="${darkLines}">${sizeDisplay}</td>
      <td class="number_column m_td_right td_snatched" style="${darkLines}">${snatched}</td>
      <td class="number_column m_td_right td_seeders" style="${darkLines}">${seeders}</td>
      <td class="number_column m_td_right td_leechers" style="${darkLines}">${leechers}</td>`;
  }

  document.querySelectorAll("a.dl-link")?.forEach(dlEl => {
    dlEl.addEventListener("click", event => {
      event.preventDefault();
      const torrentId = event.target.getAttribute("data-id");
      const downloadUrl = `https://${trackerDomains[!isOPS ? "OPS" : "RED"]}/ajax.php?action=download&id=${torrentId}`;
      const api_key = API_KEYS[!isOPS ? "OPS" : "RED"];

      GM_xmlhttpRequest({
        url: downloadUrl,
        method: "GET",
        headers: { Authorization: api_key },
        responseType: "blob",
        onload: (res) => {
          if (res.status === 200) {
            const blob = new Blob([res.response], {
              type: "application/x-bittorrent",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `torrent_${torrentId}.torrent`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
          } else {
            console.error("Failed to download torrent:", res.responseText);
          }
        },
        onerror: (err) => {
          console.error("Error during download request:", err);
        },
      });
    });
  });

  createSettingsMenu();

})();