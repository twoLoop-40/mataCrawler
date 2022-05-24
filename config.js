module.exports = {
  launchOptions: {
    headless: false,
    //args: ['--window-size=1920,1080']
  },
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36",
  url: "https://matamath.net/views/v4_2/intro/main.jsp",
  login: {
    loginEls: ["#userId", "#passwd"],
    loginData: ["jh.lee@spira-t.com", "sucle@2017"],
    enterBtn: "#okBtn",
  },
  firstPage: {
    buttonId: "#goHome",
  },
  menuData: {
    expandMenu: "#mobile_nav_alink",
    menu: "#mobileMenuMask",
  },
  setName: "#thead tr.th-set-row th",
};
