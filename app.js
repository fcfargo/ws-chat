const express = require('express');
const app = express();
const path = require('path');
const WebSocket = require('ws');

require('dotenv').config();
app.use(express.static(__dirname + '/client'));

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`listening server on port ${port}`);
});

// 통신 프로토콜이 http일 경우 express 서버 사용
// 통신 프로토콜이 ws일 경우 websocket 서버 사용
const wss = new WebSocket.Server({
  noServer: true,
});

const allClients = [];
const typingUsers = [];
const messages = [];

/** 접속 중인 모든 클라이언트에게 '새로운 메시지 데이터(newMessage) 이벤트' 를 전송*/
function broadcastNewMessage(user, msg) {
  allClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          event: 'newMessage',
          data: {
            user,
            msg,
          },
        }),
      );
    }
  });
}

/** 접속 중인 모든 클라이언트에게 '접속 중인 모든 유저 데이터(all-Users) 이벤트' 를 전송*/
function updateAllUsers() {
  allClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN)
      client.send(
        JSON.stringify({
          event: 'all-Users',
          data: allClients.map((user) => ({
            status: user.info.onlineStatus,
            user: user.info.user,
          })),
        }),
      );
  });
}

/** 접속 중인 모든 클라이언트에게 '메시지 타이핑 실행 중인 모든 유저(showTypingUsers) 이벤트 데이터'를 전송*/
function broadcastTypingUsers() {
  allClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          event: 'showTypingUsers',
          data: typingUsers.map((userWS) => ({
            user: userWS.info.user,
          })),
        }),
      );
    }
  });
}

// wss: WebSocketServer(Class), 웹 소켓 서버 객체
// ws: WebSocket(Class), 클라이언트 객체
// 웹소켓 서버에 연결될 때마다 callback 함수 실행
wss.on('connection', (ws) => {
  ws.info = {
    user: '',
    onlineStatus: 'green',
    messages: [],
  };
  // 웹소켓 서버에 메시지가 전송될 때마다 callback 함수 실행
  ws.on('message', (message) => {
    try {
      const { event, data } = JSON.parse(message);

      // 조건을 여러개 설정할 경우 if 대신 swtich 활용 권장
      // 클라이언트에서 전송하는 이벤트 유형 별 처리
      switch (event) {
        case 'addTypingUsers': {
          typingUsers.push(ws);
          broadcastTypingUsers();
          break;
        }
        case 'removeTypingUsers': {
          const userIdx = typingUsers.findIndex((user) => user === ws);
          if (userIdx !== -1) {
            typingUsers.splice(userIdx, 1);
          }
          broadcastTypingUsers();
          break;
        }
        case 'oldMessage': {
          messages.push({ contents: data.msg, user: ws.info.user });
          broadcastNewMessage(ws.info.user, data.msg);
          break;
        }
        case 'thisUser': {
          ws.info = data;
          allClients.push(ws);
          updateAllUsers();
          break;
        }
        case 'updateUserStatus': {
          ws.info.onlineStatus = data;
          updateAllUsers();
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
  // 웹소켓 서버 실행
  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit('connection', ws, request, head);
  });
});
