// ==UserScript==
// @name         食事予約自動化（全件自動）
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  朝食A、夕食揚げ物回避ロジックで全件自動予約
// @match        https://rieils.gif.jp/zigcoq00_0200*
// @grant        none
// ==/UserScript==

(function () {
'use strict';

alert("食事予約スクリプト読み込み成功");

const AUTO_KEY = 'meal_auto_reserve_running';

const FRIED_WORDS = [
    'カツ','フライ','唐揚げ','からあげ','コロッケ','天ぷら','フリッター','竜田揚げ'
];

const CHICKEN_WORDS = [
    'チキン','鶏肉','若鶏','鶏'
];

function containsAny(text, words) {
    return words.some(word => text.includes(word));
}

function getMainMenu(text, prefix) {
    const lines = text
        .split('\n')
        .map(v => v.trim())
        .filter(v => v.startsWith(prefix));

    return lines.length ? lines[lines.length - 1] : '';
}

function chooseDinner(menuText) {

    const aMain = getMainMenu(menuText, 'A');
    const bMain = getMainMenu(menuText, 'B');

    const aFried = containsAny(aMain, FRIED_WORDS);
    const bFried = containsAny(bMain, FRIED_WORDS);

    if (!bFried) return 'Ｂ予約';
    if (!aFried) return 'Ａ予約';

    if (containsAny(aMain, CHICKEN_WORDS)) return 'Ａ予約';

    return 'Ｂ予約';
}

function getMenuText(form) {
    let node = form.previousElementSibling;

    while (node) {
        if (node.tagName === 'TEXTAREA' && node.classList.contains('sam3')) {
            return node.value;
        }
        node = node.previousElementSibling;
    }
    return '';
}

function createControlButton() {

    if (document.getElementById('meal-auto-button')) return;

    const btn = document.createElement('button');
    btn.id = 'meal-auto-button';
    btn.textContent = '自動予約開始';

    Object.assign(btn.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '99999',
        padding: '12px 20px',
        fontSize: '16px',
        background: '#006633',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer'
    });

    btn.onclick = () => {
        localStorage.setItem(AUTO_KEY, '1');
        btn.textContent = '実行中...';
        setTimeout(runReservation, 500);
    };

    document.body.appendChild(btn);
}

function runReservation() {

    const forms = [...document.querySelectorAll('form')]
        .filter(f => f.querySelector('button[name="myoya"]'));

    for (const form of forms) {

        const mealType = form.querySelector('[name="myoyass"]')?.value || '';
        const menuText = getMenuText(form);

        let reserveValue = null;

        if (mealType === '朝予約') reserveValue = 'Ａ予約';
        else if (mealType === '昼予約') reserveValue = 'Ａ予約';
        else if (mealType === '夕予約') reserveValue = chooseDinner(menuText);

        if (!reserveValue) continue;

        const btn = [...form.querySelectorAll('button[name="myoya"]')]
            .find(b => b.value === reserveValue);

        if (!btn) continue;

        console.log('[自動予約]', mealType, reserveValue);

        setTimeout(() => btn.click(), 800);
        return;
    }

    localStorage.removeItem(AUTO_KEY);
    alert('全ての未予約食事の予約が完了しました');
}

createControlButton();

if (localStorage.getItem(AUTO_KEY) === '1') {
    console.log('自動予約再開');
    setTimeout(runReservation, 1500);
}

})();
