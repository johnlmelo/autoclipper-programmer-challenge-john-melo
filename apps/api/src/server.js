const { app } = require("./app");

const PORT = Number(process.env.PORT) || 3333;

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
