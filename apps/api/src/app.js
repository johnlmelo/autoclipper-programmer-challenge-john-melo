const express = require("express");
const { pingRouter } = require("./routes/ping.route");

const app = express();

app.use(express.json());
app.use(pingRouter);

module.exports = {
  app,
};
