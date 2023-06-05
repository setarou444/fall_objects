let id;
let url;

//アクティブタブ情報の取得
chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
    // const results = document.getElementById('results');
    // const titles = [];

    for (let i = 0; i < tabs.length; i++) {
        console.log(tabs[i]);
    }
    id = tabs[0].id;
    url = tabs[0].url;
});

document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('settingbtn_snow');
    const btn2 = document.getElementById('settingbtn_cherry');

    btn.addEventListener('click', function () {
        //alert('test');

        //バックグラウンド処理にメッセージ送信
        //この時IDは送っておかないとアクティブタブが判別できない
        chrome.runtime.sendMessage({
            name: 'displayUrl:background',
            url: url,
            id: id,
            fall: 'snow'
        });
    });

    btn2.addEventListener('click', function () {
        //alert('test');

        //バックグラウンド処理にメッセージ送信
        //この時IDは送っておかないとアクティブタブが判別できない
        chrome.runtime.sendMessage({
            name: 'displayUrl:background',
            url: url,
            id: id,
            fall: 'cherry'
        });
    });
});

