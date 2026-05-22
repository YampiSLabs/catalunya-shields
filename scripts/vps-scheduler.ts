import http from "http";

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: "healthy",
      service: "catalunya-shields",
      scheduler: "dokploy-scheduled-task",
      time: new Date().toISOString(),
    }),
  );
});

server.listen(PORT, () => {
  console.log(
    `Healthcheck server listening on port ${PORT}. Updates run via Dokploy scheduled task.`,
  );
});
