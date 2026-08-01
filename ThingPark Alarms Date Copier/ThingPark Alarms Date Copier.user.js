// ==UserScript==
// @name         ThingPark Alarms Date Copier
// @namespace    http://tampermonkey.net/
// @version      20260801
// @description  * Копіювання LRR-ID із Base stations. * Копіювання дати й часу по кліку із автозаміною Today та Yesterday на YYYY-MM-DD із таблиці відновлених тривог на сайті ThingPark.
// @author       Ovolya
// @match        *://ui-iot.kyivcity.gov.ua/*
// @updateURL    https://github.com/Ovolsan/ThingPark-Alarms-Date-Copier/raw/refs/heads/main/ThingPark%20Alarms%20Date%20Copier/ThingPark%20Alarms%20Date%20Copier.user.js
// @downloadURL  https://github.com/Ovolsan/ThingPark-Alarms-Date-Copier/raw/refs/heads/main/ThingPark%20Alarms%20Date%20Copier/ThingPark%20Alarms%20Date%20Copier.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Белый список колонок, обязательно в нижнем регистре писать
    const ALLOWED_HEADERS = [
        'creation date',
        'clearance date',
        'lrr-id',
        'last update'
    ];

    // Вспомогательная функция для форматирования даты YYYY-MM-DD
    function formatDate(dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function makeCopyable(cell) {
        // Защита от дублирования обработчиков
        if (cell.dataset.copyBound) return;
        cell.dataset.copyBound = "true";

        cell.style.cursor = 'pointer';
        cell.title = 'Натисніть, щоб скопіювати.';

        cell.addEventListener('click', function(e) {
            e.stopPropagation();

            let textToCopy = cell.innerText.trim();
            const now = new Date();

            // Проверяем и заменяем Today
            if (/today/i.test(textToCopy)) {
                const todayDate = formatDate(now);
                textToCopy = textToCopy.replace(/today/i, todayDate);
            }
            // Проверяем и заменяем Yesterday
            else if (/yesterday/i.test(textToCopy)) {
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                const yesterdayDate = formatDate(yesterday);
                textToCopy = textToCopy.replace(/yesterday/i, yesterdayDate);
            }

            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalBg = cell.style.backgroundColor;
                    const originalTransition = cell.style.transition;

                    cell.style.transition = 'background-color 0.3s ease';
                    cell.style.backgroundColor = '#d4edda';

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
            // Находим таблицу, которой принадлежит строчка, чтобы прочитать ее шапку
            const table = row.closest('table');
            if (!table) return;

            const headers = table.querySelectorAll('thead th');
            const cells = row.querySelectorAll('td');

            cells.forEach((cell, index) => {
                // 1. Игнорируем раскрывающиеся детали (у них colspan больше 1)
                if (cell.hasAttribute('colspan') && parseInt(cell.getAttribute('colspan'), 10) > 1) {
                    return;
                }

                // Если для этой ячейки есть соответствующий заголовок в шапке
                if (headers[index]) {
                    // Получаем название колонки, переводим в нижний регистр
                    const headerText = headers[index].innerText.trim().toLowerCase();

                    // 2. ПРОВЕРЯЕМ БЕЛЫЙ СПИСОК
                    // Если текст заголовка содержит хотя бы одно из разрешенных слов
                    const isAllowed = ALLOWED_HEADERS.some(allowedText => headerText.includes(allowedText));

                    // Если колонка в белом списке - активируем копирование
                    if (isAllowed) {
                        makeCopyable(cell);
                    }
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
