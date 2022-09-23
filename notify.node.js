"nodejs";
"ui-thread";

const { createWindow } = require('floating_window');
const { accessibility } = require('accessibility');
const { requestListeningNotifications } = require('notification');
const { delay } = require('lang');

require('rhino').install();

function loadIcon(packageName) {
    const pm = $autojs.androidContext.getPackageManager();
    return pm.getApplicationInfo(packageName, 0).loadIcon(pm);
}

async function main() {
    // console.log("请求无障碍");
    // await accessibility.enableService({ toast: "请授予本应用无障碍权限" });
    console.log("start request notification");
    const notificationListenerService = await requestListeningNotifications({ toast: "请授予本应用通知使用权" });
    console.log("end request notification");
    await delay(500);

    let timeout;
    let lastNotification;
    notificationListenerService.on("notification", n => {
        n.appIcon = loadIcon(n.getPackageName());
        lastNotification = n;

        console.log(n.getText());

        clearTimeout(timeout);
        timeout = setTimeout(() => {
        }, 2500);
    });
   
}

main();