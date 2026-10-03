// ==UserScript==
// @name         食事予約自動化（朝A・昼揚げ物判定・白身魚保留）
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  朝食A固定・昼食は揚げ物回避、白身魚は保留
// @match        https://rieils.gif.jp/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const FRIED_WORDS = [
        'カツ',
        'フライ',
        '唐揚げ',
        'からあげ',
        'コロッケ',
        '天ぷら',
        'フリッター',
        '竜田揚げ'
    ];

    const CHICKEN_WORDS = [
        'チキン',
        '鶏肉',
        '若鶏',
        '鶏'
    ];

    // このワードを含むメニューは予約せず保留
    const HOLD_WORDS = [
        '白身魚'
    ];

    function containsAny(text, list) {
        return list.some(v => text.includes(v));
    }

    // A/Bの最後の行（メイン）を取得
    function getMain(menu, prefix) {
        const lines = menu
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.startsWith(prefix));

        return lines.length ? lines[lines.length - 1] : '';
    }

    // 昼食ロジック
    function chooseLunch(menuText) {

        const aMain = getMain(menuText, 'A');
        const bMain = getMain(menuText, 'B');

        // AもBも書かれていない場合は予約しない
        if (!aMain && !bMain) {
            console.log('A/Bメニューが見つからないため昼食予約を保留');
            return null;
        }

        // 白身魚が含まれていたら予約しない
        if (
            containsAny(aMain, HOLD_WORDS) ||
            containsAny(bMain, HOLD_WORDS)
        ) {
            console.log('白身魚メニューのため昼食予約を保留:', {
                A: aMain,
                B: bMain
            });

            return null;
        }

        const aFried = containsAny(aMain, FRIED_WORDS);
        const bFried = containsAny(bMain, FRIED_WORDS);

        // Bが揚げ物じゃない → B
        if (!bFried) return 'Ｂ予約';

        // Bが揚げ物でAが揚げ物じゃない → A
        if (!aFried) return 'Ａ予約';

        // 両方揚げ物 → 鶏優先
        if (containsAny(aMain, CHICKEN_WORDS)) {
            return 'Ａ予約';
        }

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

    const forms = [...document.querySelectorAll('form')]
        .filter(f => f.querySelector('button[name="myoya"]'));

    for (const form of forms) {

        const type = form.querySelector('[name="myoyass"]')?.value || '';
        const menu = getMenuText(form);

        let target = null;

        // 朝食は固定A
        if (type === '朝予約') {
            target = 'Ａ予約';
        }

        // 昼食は揚げ物判定＋白身魚なら保留
        else if (type === '昼予約') {
            target = chooseLunch(menu);
        }

        // targetがない場合は予約しない
        if (!target) continue;

        const btn = [...form.querySelectorAll('button[name="myoya"]')]
            .find(b => b.value === target);

        if (btn) {
            console.log('予約実行:', type, target);
            setTimeout(() => btn.click(), 800);
            break;
        }
    }

})();
