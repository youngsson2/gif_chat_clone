const mongoose = require("mongoose");

const { MONGO_ID, MONGO_PASSWORD, NODE_ENV } = process.env;
const MONGO_URL = `mongodb://${MONGO_ID}:${MONGO_PASSWORD}@localhost:27017/admin`;
console.log(MONGO_URL);
const connect = () => {
  if (NODE_ENV !== "production") {
    mongoose.set("debug", true);
  }
  mongoose.connect(
    MONGO_URL,
    {
      dbName: "gifchat",
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
    },
    (err) => {
      if (err) {
        console.error("몽고디비 연결 에러", error);
      } else {
        console.log("몽고디비 연결 성공");
      }
    }
  );
};

mongoose.connection.on("error", (err) => {
  console.error("mongodb connection error", err);
});

mongoose.connection.on("disconnected", () => {
  console.error("mongodb disconnected, try connect");
  connect();
});

module.exports = connect;
