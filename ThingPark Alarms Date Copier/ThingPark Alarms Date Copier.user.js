// ==UserScript==
// @name         ThingPark Alarms Date Copier
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Копіювання дати й часу по кліку із автозаміною Today на YYYY-MM-DD із таблиці відновлених тривог на сайті ThingPark.
// @author       Ovolya
// @match        *://ui-iot.kyivcity.gov.ua/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function makeCopyable(cell) {
        // Защита от дублирования обработчиков
        if (cell.dataset.copyBound) return;
        cell.dataset.copyBound = "true";

        cell.style.cursor = 'pointer';
        cell.title = 'Тик, аби скопіювати дату й час';

        cell.addEventListener('click', function(e) {
            e.stopPropagation();

            let textToCopy = cell.innerText.trim();

            // Проверяем, есть ли слово "today" (игнорируя регистр)
            if (/today/i.test(textToCopy)) {
                // Получаем текущую дату
                const now = new Date();
                const year = now.getFullYear();
                // Добавляем нули спереди для месяцев и дней (например, 07 вместо 7)
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');

                const todayDate = `${year}-${month}-${day}`;

                // Заменяем "Today" на YYYY-MM-DD.
                textToCopy = textToCopy.replace(/today/i, todayDate);
            }

            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalBg = cell.style.backgroundColor;
                    const originalTransition = cell.style.transition;

                    cell.style.transition = 'background-color 0.3s ease';
                    cell.style.backgroundColor = '#d4edda'; // Зеленая подсветка

                    setTimeout(() => {
                        cell.style.backgroundColor = originalBg;

                        setTimeout(() => {
                            cell.style.transition = originalTransition;
                        }, 300);
                    }, 700);
                }).catch(err => {
                    console.error('Не удалось скопировать текст: ', err);
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
