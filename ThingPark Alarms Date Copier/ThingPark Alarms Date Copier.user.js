// ==UserScript==
// @name         ThingPark Alarms Date Copier
// @namespace    http://tampermonkey.net/
// @version      20260726
// @description  * Копіювання LRR-ID із Base stations. * Копіювання дати й часу по кліку із автозаміною Today та Yesterday на YYYY-MM-DD із таблиці відновлених тривог на сайті ThingPark.
// @author       Ovolya
// @match        *://ui-iot.kyivcity.gov.ua/*
// @updateURL    https://github.com/Ovolsan/ThingPark-Alarms-Date-Copier/raw/refs/heads/main/ThingPark%20Alarms%20Date%20Copier/ThingPark%20Alarms%20Date%20Copier.user.js
// @downloadURL  https://github.com/Ovolsan/ThingPark-Alarms-Date-Copier/raw/refs/heads/main/ThingPark%20Alarms%20Date%20Copier/ThingPark%20Alarms%20Date%20Copier.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Допоміжна функція для форматування дати у YYYY-MM-DD
    function formatDate(dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function makeCopyable(cell) {
        // Захист від дублювання обробників
        if (cell.dataset.copyBound) return;
        cell.dataset.copyBound = "true";

        cell.style.cursor = 'pointer';
        cell.title = 'Натисніть, щоб скопіювати дату/час';

        cell.addEventListener('click', function(e) {
            e.stopPropagation();

            let textToCopy = cell.innerText.trim();
            const now = new Date();

            // Перевіряємо та замінюємо Today
            if (/today/i.test(textToCopy)) {
                const todayDate = formatDate(now);
                textToCopy = textToCopy.replace(/today/i, todayDate);
            } 
            // Перевіряємо та замінюємо Yesterday
            else if (/yesterday/i.test(textToCopy)) {
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1); // Віднімаємо 1 день
                const yesterdayDate = formatDate(yesterday);
                textToCopy = textToCopy.replace(/yesterday/i, yesterdayDate);
            }

            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalBg = cell.style.backgroundColor;
                    const originalTransition = cell.style.transition;

                    cell.style.transition = 'background-color 0.3s ease';
                    cell.style.backgroundColor = '#d4edda'; // Зелена підсвітка

                    setTimeout(() => {
                        cell.style.backgroundColor = originalBg;
                        
                        setTimeout(() => {
                            cell.style.transition = originalTransition;
                        }, 300);
                    }, 700);
                }).catch(err => {
                    console.error('Не вдалося скопіювати текст: ', err);
                });
            }
        });
    }

    const observer = new MutationObserver(() => {
        const rows = document.querySelectorAll('table.table-bordered.table-striped tbody tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4) {
                const creationDateCell = cells[2];
                const clearanceDateCell = cells[3];
                
                if (creationDateCell) makeCopyable(creationDateCell);
                if (clearanceDateCell) makeCopyable(clearanceDateCell);
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
