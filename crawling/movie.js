const puppeteer = require("puppeteer");
const args = process.argv.slice(2);
const username = args[0] || 'defaultUsername';
const password = args[1] || 'defaultPassword';

(async () => {
  // headless 브라우저 실행
  const browser = await puppeteer.launch({ // Puppeteer용 브라우저 실행
	    defaultViewport : {
	      width: 1920,
	      height: 1080
	    }
    });

  // 새로운 페이지 열기
  const page = await browser.newPage();

  // URL에 접근 후 메인 페이지 로그인 버튼 클릭
  await page.goto("https://www.megabox.co.kr/");
  await page.click('.before a[title="로그인"]');

  // 로그인 팝업에서 계정 정보 입력 후 로그인
  await page.type('[id=ibxLoginId]', username)
  await page.type('[id=ibxLoginPwd]',password)
  await page.click('[id=btnLogin]');

  // 마케팅 수신정보 "다음에 하기" 클릭 후 로그인 완료 페이지 대기
  await page.waitForSelector('[class="button lyclose"]');
  await page.click('[class="button lyclose"]');
  await page.waitForNavigation();

  // 영화 정보 페이지 접근 
  await page.click('[class="gnb-txt-movie"]');
  await page.waitForTimeout(2000); 
  
  // URL 스크린샷으로 result 폴더에 저장
  await page.screenshot({ path: "./result/abc.png" });

  // URL을 pdf 파일로 result 폴더에 저장
  await page.pdf({ path: "./result/abc.pdf", format: "A4" });
  
  await browser.close();
})();
