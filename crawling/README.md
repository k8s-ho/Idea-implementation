# AWS Lambda Testing code
메가박스 상영중인 영화 예매 1순위의 변동을 탐지하고 사용자에게 알람을 주는 서비스입니다.  
AWS Lambda를 통해 SNS 알림을 보냅니다.
<br><br>
### Usage
```bash
git clone https://github.com/k8s-ho/Idea-implementation
npm install
serverless deploy -c serverless.yaml --aws-profile [your profile]
```
<br>  

###  Environment
- Nodejs, AWS {DynamoDB, SNS, Lambda, CloudWatch, S3}
- [참고] Lambda Layer 정보
```bash
https://github.com/shelfio/chrome-aws-lambda-layer
```
![ㅁㅁㅁ](https://github.com/k8s-ho/Idea-implementation/assets/118821939/41495289-61e0-4036-921e-4866c32aa21d)
