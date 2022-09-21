const { WebSocketServer } = require('ws');
const express = require('express');
const app = express();
const path = require('path');

require('dotenv').config();
app.use('/', express.static(path.resolve(__dirname, '../client')));

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`listening server on port ${port}`);
});

// 통신 프로토콜이 http일 경우 express 서버 사용
// 통신 프로토콜이 ws일 경우 websocket 서버 사용
const wss = new WebSocketServer({
  noServer: true,
  // return false 인 경우 인증되지 않은 사용자는 웹소켓 연결 불가능해진다. 하지만 실제로 verifyClient 대신 handleupgrade method 사용이 권장된다.
  // verifyClient: (info) => {
  //   return true;
  // },
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

// express 서버(hhtp) 연결 업그레이드
server.on('upgrade', async function upgrade(request, socket, head) {
  // verfiyClient() 기능처럼 사용자 인증을 처리할 수 있다.
  // return false 인 경우 사용자 웹소켓 연결 불가능
  // return false 인 경우 웹소켓 서버 연결 상태는 CLOSED가 아닌 pending이기 때문에, 웹소켓 서버 연결을 종료하려면 return socket.end()로 처리해야 한다.
  if (Math.random() > 0.5) {
    socket.destroy();
    return;
  }

  // 웹소켓 서버 실행
  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit('connection', ws, request, head);
  });
});
