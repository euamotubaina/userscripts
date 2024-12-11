// ==UserScript==
// @name            Gazelle File Count
// @namespace       https://github.com/euamotubaina
// @description     Shows the number of tracks and/or files in each torrent
// @version         2.0.3-02
// @match           https://notwhat.cd/torrents.php*id=*
// @match           https://orpheus.network/torrents.php*id=*
// @match           https://redacted.sh/torrents.php*id=*
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM.getValue
// @grant           GM.setValue
// @grant           GM_registerMenuCommand
// @require         https://openuserjs.org/src/libs/sizzle/GM_config.js
// @downloadURL     https://raw.githubusercontent.com/euamotubaina/userscripts/refs/heads/main/gazelle-file-count.js
// @updateURL       https://raw.githubusercontent.com/euamotubaina/userscripts/refs/heads/main/gazelle-file-count.js
// ==/UserScript==

(function() {
    "use strict";

// _____________________________________________________________
// _____________ Preferences ___________________________________
    function createSettingsMenu() {
        const fields = {
            display: {
                label: "Display",
                type: "number",
                default: GM_getValue("display", 1),
                title: `
                    How to display the file count:

                    1 = Total number of files in torrent (15)
                    2 = Number of tracks out of total files (12/15)
                    3 = Number of tracks plus extra files (12+3)
                    4 = Only the number of tracks (12)
                    `,
                },
            checkEditions: {
                label: "Highlight track count conflicts",
                type: "checkbox",
                default: GM_getValue("checkEditions", false),
                title: "Highlight editions with conflicting track counts",
            },
            extraSizeLimit: {
                label: "Highlight if extra files exceeds size",
                type: "number",
                default: GM_getValue("extraSizeLimit", 0),
                title: "Highlight torrents with extra files exceeding this size (in MB; 0 = disable)",
            },
            tooltipAll: {
                label: "Always show extra files size",
                type: "checkbox",
                default: GM_getValue("tooltipAll", false),
                title: "Always show the size of extras when hovering over a torrent size (false = only the highlighted ones)",
            }
        }

        GM_config.init({
            id: "GfcConfig",
            title: "Gazelle File Count Settings",
            fields: fields,
            css: `
                #GfcConfig {
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
                #GfcConfig .field_label {
                    color: #fff;
                    width: 90%;
                }
                #GfcConfig .config_header {
                    color: #fff;
                    padding-bottom: 10px;
                }
                #GfcConfig .config_var {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                }
                #GfcConfig .config_var input {
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

        GM_registerMenuCommand("Configure", () => {
            GM_config.open();
        });
    }

    let display = GM_getValue("display", 1);
    const checkEditions = GM_getValue("checkEditions", false);
    let extraSizeLimit = GM_getValue("extraSizeLimit", 0);
    const tooltipAll = GM_getValue("tooltipAll", false);
// _____________________________________________________________
// __________ End of Preferences _______________________________

    function toBytes(size) {
        const num = parseFloat(size.replace(',', ''));
        const i = ' KMGT'.indexOf(size.charAt(size.length - 2));
        return Math.round(num * Math.pow(1024, i));
    }

    function toSize(bytes) {
        if (bytes <= 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const num = Math.round(bytes / Math.pow(1024, i));
        return num + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
    }

    function addStyle(css) {
        const s = document.createElement('style');
        s.textContent = css;
        document.head.appendChild(s);
    }

    function setTitle(elem, str) {
        elem.title = str;
        if (window.jQuery && jQuery.fn.tooltipster) {
            jQuery(elem).tooltipster({ delay: 500, maxWidth: 400 });
        }
    }

    const table = document.getElementById('torrent_details');
    if (table) {

        const isMusic = !!document.querySelector('.box_artists');
        extraSizeLimit = extraSizeLimit * 1048576;

        addStyle(
            '.gmfc_files { cursor: pointer; }' +
            '.gmfc_extrasize { background-color: rgba(228, 169, 29, 0.12) !important; }'
        );

        table.rows[0].insertCell(1).innerHTML = '<strong>Files</strong>';

        let rows = table.querySelectorAll('.edition, .torrentdetails');
        for (var i = rows.length; i--; ) {
            ++rows[i].cells[0].colSpan;
        }

        rows = table.getElementsByClassName('torrent_row');
        const editions = {};

        for (let i = rows.length; i--; ) {

            const fileRows = rows[i].nextElementSibling.querySelectorAll('.filelist_table tr:not(:first-child)');
            const numFiles = fileRows.length;
            let numTracks = 0;

            if (isMusic) {
                let extraSize = 0;

                for (let j = numFiles; j--; ) {
                    if (/\.(flac|mp3|m4a|ac3|dts)\s*$/i.test(fileRows[j].cells[0].textContent)) {
                        ++numTracks;
                    } else if (extraSizeLimit || tooltipAll) {
                        extraSize += toBytes(fileRows[j].cells[1].textContent);
                    }
                }

                if (checkEditions) {
                    const ed = /edition_\d+/.exec(rows[i].className)[0];
                    editions[ed] = ed in editions && editions[ed] !== numTracks ? -1 : numTracks;
                }

                const largeExtras = extraSizeLimit && extraSize > extraSizeLimit;
                if (largeExtras || tooltipAll) {
                    const sizeCell = rows[i].cells[1];
                    setTitle(sizeCell, 'Extras: ' + toSize(extraSize));
                    if (largeExtras) {
                        sizeCell.classList.add('gmfc_extrasize');
                    }
                }

            } else {
                display = 0;
            }

            const cell = rows[i].insertCell(1);
            cell.textContent = display < 2 ? numFiles : numTracks;
            cell.className = 'gmfc_files';
            if (display != 3) {
                cell.className += ' number_column';
            } else {
                const numExtras = numFiles - numTracks;
                if (numExtras) {
                    const sml = document.createElement('small');
                    sml.textContent = '+' + numExtras;
                    cell.appendChild(sml);
                }
            }
            if (display == 2) {
                cell.textContent += '/' + numFiles;
            }
        }

        if (checkEditions) {
            let sel = '';
            for (let ed in editions) {
                if (editions.hasOwnProperty(ed) && editions[ed] < 1) {
                    sel += [sel ? ',.' : '.', ed, '>.gmfc_files'].join('');
                }
            }
            if (sel) addStyle(sel + '{background-color: rgba(236, 17, 0, 0.09) !important;}');
        }

        // Show filelist on filecount click

        table.addEventListener('click', function (e) {

            function get(type) {
                return document.getElementById([type, id].join('_'));
            }

            const elem = e.target.nodeName != 'SMALL' ? e.target : e.target.parentNode;
            if (elem.classList.contains('gmfc_files')) {

                const id = elem.parentNode.id.replace('torrent', '');
                const tEl = get('torrent');
                const fEl = get('files');
                const show = [tEl.className, fEl.className].join().indexOf('hidden') > -1;

                tEl.classList[show ? 'remove' : 'add']('hidden');
                fEl.classList[show ? 'remove' : 'add']('hidden');

                if (show) {
                    const sections = ['peers', 'downloads', 'snatches', 'reported', 'logs'];
                    for (let i = sections.length; i--; ) {
                        const el = get(sections[i]);
                        if (el) el.classList.add('hidden');
                    }
                }

            }
        }, false);

        function checkAndDispatchEvents() {
            if (display === 2 || display === 3) {
                const event = new CustomEvent('vardisplay3');
                document.dispatchEvent(event);
            } else if (display === 1 || display === 4) {
                const event = new CustomEvent('vardisplay4');
                document.dispatchEvent(event);
            }
        }

        // Run the function once when the script first runs
        checkAndDispatchEvents();

        // Set up an interval to repeat the event dispatching
        const interval1 = setInterval(() => {
            checkAndDispatchEvents();
        }, 200); // Repeat every 200 ms

        // Listen for the custom event 'OPSaddREDreleasescomplete'
        document.addEventListener('OPSaddREDreleasescomplete', function () {
            // console.log("Detected OPSaddREDreleasescomplete event, stopping event dispatching");

            // Stop further dispatching of vardisplay3 and vardisplay4
            clearInterval(interval1);

            // Get all elements with the class 'RED_filecount_placeholder'
            const fileCountElements = document.querySelectorAll('td.RED_filecount_placeholder');

            // Loop through the elements and remove the 'hidden' class
            fileCountElements.forEach(function (element) {
                element.classList.remove('hidden');
            });
            //console.log("Finished processing RED_filecount_placeholder elements");
        });
    }

    createSettingsMenu();

})();