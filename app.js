const WebSocket = require('ws');

const wss = new WebSocket.Server({
  port: 8006,
});

// 웹소켓 서버에 연결된 사용자를 저장하는 배열
const clients = [];

// 웹소켓 서버에 연결될 때마다 callback 함수 실행
wss.on('connection', (ws) => {
  clients.push(ws);
  // 웹소켓 서버에 메시지가 전송될 때마다 callback 함수 실행
  // broadcasting
  ws.on('message', (data) => {
    clients.forEach((client) => {
      // readyState: 웹소켓의 상태를 의미한다.
      // 웹 소켓의 상태는 4가지다.(OPEN: 상태 번호 1, CLOSED: 상태 번호 3, CONNECTING: 상태 번호 0, CLOSING: 상태 번호 2)
      // 사용자의 웹소켓 서버 연결 상태가 OPEN(VALID CONNECTION)인지를 확인하는 조건문
      if (client.readyState === WebSocket.OPEN) {
        client.send(data.toString());
      }
    });
  });
});
