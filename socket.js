const cookieParser = require("cookie-parser");
const SocketIO = require("socket.io");
const axios = require("axios");

module.exports = (server, app, sessionMiddleware) => {
  const io = SocketIO(server, { path: "/socket.io" });
  app.set("io", io); // 라우터에서 io 객체를 쓸 수 있게 저장. req.app.get('io') 로 접근 가능
  const room = io.of("/room"); // of(): Socket.IO에 네임스페이스를 부여하는 메서드
  const chat = io.of("/chat");

  //   io.use((socket, next) => {
  //     cookieParser(process.env.COOKIE_SECRET)(
  //       socket.request,
  //       socket.request.res,
  //       next
  //     );
  //     sessionMiddleware(socket.request, socket.request.res, next);
  //   });

  const wrap = (middleware) => (socket, next) =>
    middleware(socket.request, {}, next);
  chat.use(wrap(cookieParser(process.env.COOKIE_SECRET)));
  chat.use(wrap(sessionMiddleware));

  room.on("connection", (socket) => {
    console.log("room 네임스페이스 접속");
    socket.on("disconnect", () => {
      console.log("room 네임스페이스 접속 해제");
    });
  });

  chat.on("connection", (socket) => {
    console.log("chat 네임스페이스 접속");
    const req = socket.request;
    const {
      headers: { referer }, // socket.request.headers.referer를 통해 현재 웹 페이지의 URL을 가져옴
    } = req;
    const roomId = referer
      .split("/")
      [referer.split("/").length - 1].replace(/\?.+/, "");
    socket.join(roomId);
    socket.to(roomId).emit("join", {
      user: "system",
      chat: `${req.session.color}님이 입장하셨습니다.`,
    });

    socket.on("disconnect", () => {
      console.log("chat 네임스페이스 접속 해제");
      console.log(roomId);
      socket.leave(roomId);
      console.log(socket.adapter.rooms);
      const currentRoom = socket.adapter.rooms.get(roomId); // socket.adapter.rooms[방 아이디]에 참여 중인 소켓 정보가 들어 있음.
      const userCount = currentRoom ? currentRoom.size : 0;
      if (userCount === 0) {
        // 유저가 0명이면 방 삭제
        axios
          .delete(`http://localhost:8005/room/${roomId}`)
          .then(() => {
            console.log("방 제거 요청 성공");
          })
          .catch((err) => {
            console.error(err);
          });
      } else {
        socket.to(roomId).emit("exit", {
          user: "system",
          chat: `${req.session.color}님이 퇴장하셨습니다.`,
        });
      }
    });
  });
};
