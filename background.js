
//ここで取得すると拡張機能(chrome://extensions/)の情報が取得されるので実際のアクティブなタブの情報を取得することができない
// chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     console.log({ tabs });
// });

//メッセージ受信
chrome.runtime.onMessage.addListener((request) => {
    // 期待通りのリクエストかどうかをチェック
    if (request.name === 'displayUrl:background') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            console.log({ tabs });
        });
        // content_script へデータを送る
        chrome.tabs.sendMessage(request.id, { // content_script はタブごとに存在するため ID 指定する必要がある
            name: 'displayUrl:contentScripts',
            data: {
                url: request.url,
                fall: request.fall
            }
        });
    }
});