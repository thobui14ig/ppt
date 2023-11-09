const puppeteer = require('puppeteer');
const { JSDOM } = require('jsdom');
const io = require('socket.io-client');
const fs = require('fs');

class SocketSingleton{
    socket;
    constructor() {
        this.socket = io('http://localhost:9000/');
        this.socket.on('connect', () => {
          console.log('Connected to server admin page!.');
        });
        this.socket.on('error', (error) => {
          console.error('Socket connection error:', error);
        });
        this.socket.on('disconnect', () => {
          console.log('Disconnected from socket');
        });
    }

    getSocket() {
        return this.socket;
    }
}
const socket = new SocketSingleton().getSocket()

const app = () => {
    let browserSingleton = null;
    let isLogin = false;

    async function getPost() {
        await loginFacebook()
        setTimeout(async () => {
            const run = async () => {
                console.time('a')
                const url = `https://www.facebook.com/groups/1390167227872503?sorting_setting=CHRONOLOGICAL`
                const data = await getDatePuppeteer(url);
                const { name, postId, content, link } = data || {}

                if (name && postId && content && link) {
                    socket.emit('message', data);
                }

                console.timeEnd('a')
                setTimeout(() => {
                    return run()
                }, 100);                
            }
            run()

        }, 5000);
    }

    async function getDatePuppeteer(url) {
        try {
            const browser = await getBrowser();
            const page = await browser.newPage();
            await page.goto(url);
            await page.waitForSelector('.xdj266r');
            
            const content = await page.evaluate(() => {
                document.querySelector('.x1ve1bff').remove()
                document.querySelector('.x1vjfegm').remove()
                document.querySelector('.x1xzczws').remove()
                return document.body.innerHTML;
            });

            const name = getName(content);
            const postId = getPostId(content);
            const message = getNoiDung(content);
            const link = getUserLink(content)
            await page.close();

            return { name, postId, content: message, link };            
        } catch (error) {
            console.log(1111, error)
        }
    }
    
    async function getBrowser() {
        if (!browserSingleton) {
            const browser = await puppeteer.launch({ headless: false });
            browserSingleton = browser;
        }

        return browserSingleton;
    }

    async function loginFacebook() {
        if (!isLogin) {
            isLogin = true;
            const browser = await getBrowser();
            const page = await browser.newPage();
            await page.goto('https://www.facebook.com/');
            await page.type('#email', '0822423246');
            await page.type('#pass', 'Thitanh98@');

            await page.click('button[name="login"]');
        }
    }
    
    function getName(inputString) {
        const regex = /<strong><span>(.*?)<\/span><\/strong>/;
        const matches = inputString.match(regex);

        if (matches && matches.length > 1) {
            const extractedValue = matches[1];
            return extractedValue;
        } else {
            return null;
        }
    }
    
    function getPostId(inputString) {
        const regex = /"post_id":"(\d+)"/;
        const matches = inputString.match(regex);

        if (matches && matches.length > 1) {
            const postIdValue = matches[1];
            return postIdValue;
        } else {
            return null;
        }
    }
    
    function getNoiDung(inputString) {
        const dom1 = new JSDOM(inputString);
        const elements1 = dom1.window.document.querySelectorAll(
            '.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.x1vvkbs',
        );
        const content1 = elements1[0]?.textContent;
        return content1;
    }

    function getUserLink(inputString) {
        const regex = /href="\/groups\/\d+\/user\/\d+\/\?__cft__[^"]*"/g;
        const matches = inputString.match(regex);
        
        return (matches??null)  ? matches[0] : null
    }

    getPost()
}

app()
