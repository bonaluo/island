"ui-thread nodejs";

const { createWindow } = require("floating_window");
const window = createWindow({ initialPosition: { x: 200, y: 400 } });
window.setViewFromXml(`
  <vertical bg="#ffffff">
      <text text="Node.js: ${process.version}" textColor="#aa0000" textSize="20"/>                
  </vertical>
`);
window.show();
const id = $autojs.keepRunning();
// 三秒后取消
setTimeout(() => {
    $autojs.cancelKeepRunning(id);
}, 3000);