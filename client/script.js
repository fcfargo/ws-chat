// 포트 번호 이후에 입력하는 주소에 상관 없이 웹소켓 서버로 연결된다.
const server = new WebSocket('ws://localhost:8005/websocket');

const message = document.getElementById('messages');
const input = document.getElementById('message');
const button = document.getElementById('send');

button.disabled = true;
button.addEventListener('click', sendMessage, false);

// socket 서버와 연결하려면 시간이 필요하기 때문에 .send() 함수 실행하면 에러가 발생한다. .onopen() 함수를 사용하자
server.onopen = () => {
  button.disabled = false;
};

server.onmessage = (event) => {
  const { data } = event;
  generateMessageEntry(data, 'Server');
};

function generateMessageEntry(msg, type) {
  const newMessage = document.createElement('div');
  newMessage.innerText = `${type} says: ${msg}`;
  message.appendChild(newMessage);
}

// 해당 함수는 버튼을 클릭한 클라이언트에게 발생하는 이벤트를 담고 있다.
function sendMessage() {
  const text = input.value;
  generateMessageEntry(text, 'Client');
  server.send(text);
}
