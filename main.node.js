"ui-thread nodejs";

const { createWindow } = require('floating_window');
const { accessibility } = require('accessibility');
const { requestListeningNotifications } = require('notification');
const { delay } = require('lang');
const { device } = require('device');

require('rhino').install();
const LayoutTransition = android.animation.LayoutTransition;
const OvershootInterpolator = android.view.animation.OvershootInterpolator;

async function main() {
    console.log("请求无障碍权限");
    await accessibility.enableService({ toast: "请授予本应用无障碍权限" });
    const notificationListenerService = await requestListeningNotifications({ toast: "请授予本应用通知使用权" });

    await delay(500);
    const island = new DynamicIsland();
    await island.show();

    let timeout;
    let lastNotification;
    console.log("设置监听");
    notificationListenerService.on("notification", n => {
        console.log(n.toString());
        if (n.getPackageName() == 'com.miui.securitycenter') {
            console.log("跳过安全中心消息");
            return;
        }
        n.appIcon = loadIcon(n.getPackageName());
        lastNotification = n;

        island.setState("medium");
        // tickerText 因该是 Android 的原生属性，是简略消息由标题+内容组成
        console.log("n.tickerText:" + n.tickerText);
        island.setMessage(n.tickerText ?? n.getTitle(), n.appIcon);
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            island.setState("small");
        }, 2500);
    });
    island.onMessageClick(() => {
        island.setExpandedMessage(lastNotification.getTitle(), lastNotification.getText(), lastNotification.appIcon);
        island.setState("large");
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            island.setState("small");
        }, 2500);
    });
    island.onExpandedMessageClick(() => {
        lastNotification?.click();
        lastNotification = undefined;
        island.setState("small");
        clearTimeout(timeout);
    });
    console.log("阻塞");
    const id = $autojs.keepRunning();
    // setTimeout(() => {
    //     console.log("停止监听");
    //     $autojs.cancelKeepRunning(id);
    // }, 10000);

}

function loadIcon(packageName) {
    const pm = $autojs.androidContext.getPackageManager();
    return pm.getApplicationInfo(packageName, 0).loadIcon(pm);
}

class DynamicIsland {
    static styles = {
        "small": {
            w: 100, h: 30, radius: 15,
        },
        "medium": {
            w: 215, h: 30, radius: 15, messageContainer: true,
        },
        "large": {
            w: 400, h: 80, radius: 40, expandedMessage: true,
        },
    };

    constructor() {
        // this.window = createWindow({ context: accessibility.service });      
        this.window = createWindow();
        // this.window.setPosition(0, -100);
    }

    async show() {
        // 如果项目保存到设备可以使用这种方式
        // await this.window.setViewFromXmlFile('./island.xml');

        // 远程调试使用这种方式
        await this.window.setViewFromXml(`<frame>
            <column animateLayoutChanges="true" w="*" gravity="center">
                <card id="card" cardBackgroundColor="#000000">
                    <frame>
                        <row id="message" visibility="gone" gravity="center_vertical" w="*">
                            <img id="messageIcon" w="18" h="18" marginLeft="12" />
                            <text id="messageText" textColor="#ffffff" textSize="12" marginLeft="8" marginRight="12" ellipsize="end" maxLines="1" />
                        </row>
                        <row id="expandedMessage" visibility="gone" gravity="center_vertical" w="*">
                            <img id="expandedMessageIcon" w="48" h="48" marginLeft="24" />
                            <column marginLeft="12" marginRight="24">
                                <text id="expandedMessageTitle" textColor="#ffffff" textSize="14" ellipsize="end" maxLines="1" />
                                <text id="expandedMessageContent" textColor="#9f9f9f" marginTop="8" textSize="12" ellipsize="end" maxLines="1" />
                            </column>
                        </row>
                    </frame>
                </card>
            </column>
        </frame>
        `);

        this.card = this.window.view.findView('card');
        this.messageContainer = this.window.view.findView("message");
        this.messageText = this.window.view.findView("messageText");
        this.messageIcon = this.window.view.findView("messageIcon");
        this.expandedMessage = this.window.view.findView("expandedMessage");
        this.expandedMessageIcon = this.window.view.findView("expandedMessageIcon");
        this.expandedMessageTitle = this.window.view.findView("expandedMessageTitle");
        this.expandedMessageContent = this.window.view.findView("expandedMessageContent");

        const transition = this.card.getParent().getLayoutTransition();
        transition.enableTransitionType(LayoutTransition.CHANGING);
        transition.setInterpolator(LayoutTransition.CHANGING, new OvershootInterpolator());

        this.setState('small');

        // console.log(device.screenWidth);
        // console.log(this.window.size.width);
        // let positionX = (device.screenWidth - this.window.size.width) / 2;
        // this.window.setPosition(10, 100);

        this.window.show();
    }

    onMessageClick(callback) {
        this.messageContainer.on("click", callback);
    }

    onExpandedMessageClick(callback) {
        this.expandedMessage.on("click", callback);
    }

    setMessage(messageText, icon) {
        console.log("setMessage:" + messageText + "," + icon.toString());
        this.messageText.attr('text', messageText);
        this.messageIcon.setImageDrawable(icon);
    }

    setExpandedMessage(title, content, icon) {
        this.expandedMessageTitle.attr('text', title);
        this.expandedMessageContent.attr('text', content);
        this.expandedMessageIcon.setImageDrawable(icon);
    }

    setState(state) {
        const style = DynamicIsland.styles[state];
        this.card.attr("w", style.w.toString())
        this.card.attr("h", style.h.toString());
        this.card.attr("cardCornerRadius", style.radius.toString());
        this.messageContainer.attr("visibility", style.messageContainer ? 'visible' : 'gone');
        this.expandedMessage.attr("visibility", style.expandedMessage ? 'visible' : 'gone');
    }
}

// 通用坐标转换
// class ConvertXy {
//     static rx = 1080; //开发设备x值
//     static ry = 1920; //开发设备的y值

//     constructor() {
//     }

//     //换算公式 点击坐标除以 点击坐标X Y | 除以开发设备X Y |乘以实际设备X Y ==换算后的坐标
//     getConvert(x, y) {
//         let cx = x / rx * device.width //换算后的x
//         let cy = y / ry * device.height //换算后的y
//         return { x: cx, y: cy };
//     }
// }

main();
