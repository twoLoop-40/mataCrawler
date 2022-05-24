const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const configData = require("./config");
const parse = require("csv-parse/lib/sync");
const stringfy = require("csv-stringify/lib/sync");

const recordsFrom = async function (fileLoc) {
  const contents = await fs.readFile(fileLoc);
  return parse(contents.toString("utf-8"));
};
const writeToCsv = async (data, fileName) => {
  const csvForm = stringfy(data);
  await fs.writeFile(fileName, csvForm);
};

const crawler = async () => {
  try {
    const gotoPage = async (url) => {
      const page = await browser.newPage();
      await page.setUserAgent(userAgent);
      // await page.setViewport({
      // 	width: 1200,
      // 	height: 800
      // });
      await page.goto(url);
      return async (action) => {
        await action(page);
        await page.waitForNavigation();
        return page;
      };
    };
    const loginPage = async (loginElsData) => {
      const loginEls = await Promise.all(
        loginElsData.map((data) => page.waitForSelector(data))
      );
      return async (loginData) => {
        for (const [i, el] of loginEls.entries()) {
          await el.type(loginData[i], { delay: 20 });
        }
        const btn = await page.$(enterBtn);
        await btn.click();
        await page.waitForNavigation();
      };
    };
    const menuPage = async (elsData) => {
      const { expandMenu, menu } = elsData;
      await page.$eval(expandMenu, (el) => el.click());
      const holder = await page.waitForSelector(menu);
      const menuList = await holder.$$("li");
      return async (selector) => {
        let result;
        await Promise.all(
          menuList.map(async (menu, i) => {
            if (await selector(menu)) result = i;
          })
        );
        await menuList[result].click();
      };
    };
    const dropDown = async (selectorId) => {
      await page.waitForFunction(
        (els) => {
          const dropList = document.querySelectorAll(els);
          return dropList.length > 0;
        },
        {},
        `${selectorId} option`
      );
      return async (choice, action) => {
        const selected = await page.select(selectorId, choice);
        //console.log(choice);
        if (action) action(selected);
      };
    };
    const closePage = async (page) => page.close();
    const close = async () => browser.close();

    const {
      url,
      login,
      launchOptions,
      firstPage,
      menuData,
      userAgent,
      setName,
    } = configData;
    const { loginEls, loginData, enterBtn } = login;

    const browser = await puppeteer.launch(launchOptions);
    const entrance = await gotoPage(url);
    const page = await entrance(async (page) => {
      const btn = await page.waitForSelector(firstPage.buttonId);
      btn.click();
    });

    const gotoMain = await loginPage(loginEls);
    await gotoMain(loginData);
    const gotoTest = await menuPage(menuData);
    await gotoTest(
      async (menu) => (await menu.evaluate((el) => el.textContent)) === "시험"
    );

    const gotoSeries = await dropDown("#seriesId");
    const records = await recordsFrom("./seriesId.csv");
    const title = (record) => record[0],
      id = (record) => record[1];
    let result = [],
      count = 0;
    const gather = async (listOfRec, trial) => {
      const failure = [];
      if (trial === 0 || listOfRec.length === 0) return;
      count++;
      for (const record of listOfRec) {
        await gotoSeries(id(record));
        try {
          await page.waitForTimeout(1000 * count);
          await page.waitForSelector(setName, { timeout: 1000 });
          await page.waitForFunction(
            (sets) => {
              const setNames = document.querySelectorAll(sets);
              return setNames.length > 0;
            },
            { timeout: 3000 },
            setName
          );

          const dataEls = await page.$$(setName);
          const setNames = await Promise.all(
            dataEls.map(async (el) => {
              let setTitle = "";
              if (el) {
                setTitle = await el.evaluate((th) => {
                  const span = th.querySelector("span");
                  if (span) return span.title;
                });
              }
              return setTitle;
            })
          );
          console.log(setNames);
          setNames.unshift(id(record));
          setNames.unshift(title(record));
          result.push(setNames);
        } catch (err) {
          console.error(err);
          failure.push(record);
        }
      }
      return gather(failure, trial - 1);
    };
    await gather(records, 4);
    console.log(result, result.length, count);
    await writeToCsv(result, "./successFinal.csv");
    await page.waitForTimeout(3000);
    await closePage(page);
    await close();
  } catch (err) {
    console.error(err);
  }
};

crawler();
