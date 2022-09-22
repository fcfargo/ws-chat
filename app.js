const express = require('express');
const { join } = require('path');
const app = express();
const path = require('path');
const WebSocket = require('ws');

require('dotenv').config();
app.use('/', express.static(path.resolve(__dirname, '../client')));

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`listening server on port ${port}`);
});

// 통신 프로토콜이 http일 경우 express 서버 사용
// 통신 프로토콜이 ws일 경우 websocket 서버 사용
const wss = new WebSocket.Server({
  noServer: true,
});

const typingUsers = [];

const messages = [];

// wss: WebSocketServer(Class)
// ws: WebSocket(Class)
// 웹소켓 서버에 연결될 때마다 callback 함수 실행
wss.on('connection', (ws) => {
  // 웹소켓 서버에 메시지가 전송될 때마다 callback 함수 실행
  ws.on('message', (data) => {
    try {
      const { event, data } = JSON.parse(data);

      // 조건을 여러개 설정할 경우 if 대신 swtich 활용 권장
      // 클라이언트에서 전송하는 이벤트 유형 별 처리
      switch (event) {
        case 'addTypingUsers': {
          typingUsers.push(ws);
          break;
        }
        case 'removeTypingUsers': {
          const userIdx = typingUsers.findIndex((user) => user === ws);
          if (userIdx !== -1) {
            typingUsers.splice(userIdx, 1);
          }
          break;
        }
        case 'oldMessage': {
          messages.push(data.msg);
          break;
        }
        case 'thisUser': {
          ws.__userDetails = data;
          break;
        }
        case 'updateUserStatus': {
          ws.__userDetails.onlineStatus = data;
          break;
        }
      }
    } catch (error) {
      // not expected
    }
  });
});

// express 서버(hhtp) 연결 업그레이드
server.on('upgrade', async function upgrade(request, socket, head) {
  // verfiyClient() 기능처럼 사용자 인증을 처리할 수 있다.
  // return false 인 경우 사용자 웹소켓 연결 불가능
  // return false 인 경우 웹소켓 서버 연결 상태는 CLOSED가 아닌 pending이기 때문에, 웹소켓 서버 연결을 종료하려면 return socket.end()로 처리해야 한다.
  // if (Math.random() > 0.5) {
  //   socket.destroy();
  //   return;
  // }

  // 웹소켓 서버 실행
  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit('connection', ws, request, head);
  });
});
