const { Router } = require("express");

const pingRouter = Router();

pingRouter.get("/ping", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "autoclipper-backend",
    timestamp: new Date().toISOString(),
  });
});

module.exports = {
  pingRouter,
};
