process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1'; //v2 경고로그 무시
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const AWS = require('aws-sdk');
AWS.config.update({
    region: "ap-northeast-2"
});
const chromium = require('@sparticuz/chromium');
const moment = require('moment');

//const chromium = require('chrome-aws-lambda');
// const puppeteer = require('puppeteer-core'); 

// 계정정보 인자로 넘기기
// const args = process.argv.slice(2);
// const username = args[0] || 'defaultUsername';
// const password = args[1] || 'defaultPassword';

module.exports = {
    handler: async () => {    
        // debug 용
        //var credentials = new AWS.SharedIniFileCredentials({ profile: "test" }); // debug시 주석 삭제
        //AWS.config.credentials = credentials; // debug시 주석 삭제
        let browser = null; // debug시 주석처리
        
        var docClient = new AWS.DynamoDB.DocumentClient();

    
        try {
            const browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(), // debug시 executablePath로 사용
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            });
    
            const page = await browser.newPage();
    
            // // URL에 접근 
            await page.goto("https://www.megabox.co.kr/");
            // //메인 페이지 로그인 버튼 클릭
            // await page.click('.before a[title="로그인"]');
    
            // // 로그인 팝업에서 계정 정보 입력 후 로그인
            // await page.type('[id=ibxLoginId]', username)
            // await page.type('[id=ibxLoginPwd]', password)
            // await page.click('[id=btnLogin]');
    
            // // 마케팅 수신정보 "다음에 하기" 클릭 후 로그인 완료 페이지 대기
            // await page.waitForSelector('[class="button lyclose"]');
            // await page.click('[class="button lyclose"]');
            // await page.waitForNavigation();
    
            // 영화 정보 페이지 접근 
            await page.click('[class="gnb-txt-movie"]');
            //await page.waitForTimeout(2000);
            await new Promise(resolve => setTimeout(resolve, 2000));

            // --- 영화 예매 1위 변동 확인 ---
            // 현재 1위 영화 파씽
            const $$ = cheerio.load(await page.content());
            const top_movie = $$("#movieList > li:nth-child(1) > div.tit-area > p.tit").text();
    
            // 기존 DynamoDB에 저장된 데이터 존재 확인
            var params = {
                TableName: 'last-record',
                KeyConditionExpression: '#HashKey = :hkey',
                ExpressionAttributeNames: { '#HashKey': 'movie_name' },
                ExpressionAttributeValues: {
                    ':hkey': "top_movie"
                }
            };

            // 기존에 저장된 1위 영화가 있는 경우 가져다 사용함
            let movie; 
            const exist_movie = await docClient.query(params).promise();
            console.log(exist_movie);
            
            if (exist_movie.Count === 0 || (Array.isArray(exist_movie.Items) && exist_movie.Items.length > 0 && exist_movie.Items[0].movie.trim() === '')) {
                console.log("[?] 기존 DB에 데이터가 없습니다.");
                movie = "abc123none"; // null 대신 넣어놓음
              } else {
                console.log("[+] 기존 DB에 데이터가 존재하므로 불러옵니다.");
                movie = exist_movie.Items[0].movie;
                console.log("[DB에 저장되어있는 영화]:",movie);
              }
            console.log("[top_movie]:",top_movie);
            let chg_check = (movie !== top_movie); // 변동 체크
            console.log("[?]변동여부:", chg_check);
            let comp_last_movie = (movie === top_movie) ? movie : top_movie; // 변동이 존재하는 경우 1위영화 교체
            console.log(comp_last_movie);
            // 변동 확인 로직
            if (chg_check) {
                comp_last_movie = top_movie;
                console.log("[!] 순위 변동이 탐지되었습니다.");
                // 시간넣기
                var currentDate = new Date();
                var formattedDate = currentDate.toLocaleString(); 

                let sns = new AWS.SNS({ apiVersion: '2010-03-31', region: "us-east-1" });
                var params = {
                    Message: `${formattedDate} 기준\n\n[!] 영화 순위에 변동이 탐지 [!]\n\n현재 예매 1위 영화는 "${comp_last_movie}"입니다.`,
                    PhoneNumber: process.env.PhoneNumber,
                };
                console.log("[+] 문자를 전송하였습니다.")
                try {
                    let result = await sns.publish(params).promise();
                    console.log(result);
                } catch (e) {
                    console.log(e);
                }
                // DynamoDB에 1위 영화 갱신
                console.log("[+] 순위가 변동되었으므로 DB 데이터를 갱신합니다.");
                const now = moment();
                var params = {
                    TableName: 'last-record',
                    Key: { movie_name: 'top_movie' },
                    UpdateExpression: 'set #a = :x, #b = :y',
                    ExpressionAttributeNames: { '#a': 'movie', '#b': 'last_updated' },
                    ExpressionAttributeValues: {
                        ':x': top_movie,
                        ':y': now.format("YYYY-MM-DD HH:mm:ss"),
                    }
                };
                await docClient.update(params).promise();
            }
            
            // 영화 순위 추출
            const content = await page.content();
            const $ = cheerio.load(content);
            console.log(`
            __  __            _        ____             _
            |  \\/  | _____   _(_) ___  |  _ \\ __ _ _ __ | | __
            | |\\/| |/ _ \\ \\ / / |/ _ \\ | |_) / _\` | '_ \\| |/
            | |  | | (_) \\ V /| |  __/ |  _ < (_| | | | |   <
            |_|  |_|\\___/ \\_/ |_|\\___| |_| \\_\\__,_|_| |_|_|\\_\\
            `);
    
            const lists = $("#movieList li div.tit-area p.tit");
            lists.each((index, element) => {
                const movieTitle = $(element).text();
                console.log(`${index + 1}. ${movieTitle}`);
            });
    
            // // URL 스크린샷
            // await page.screenshot({ path: "./result/abc.png" });
            // // URL을 pdf 파일로 result 폴더에 저장
            // await page.pdf({ path: "./result/abc.pdf", format: "A4" });
            await browser.close();
            
        } catch (error) {
            console.log(error);
        } 
        return "ok"
    },
};
