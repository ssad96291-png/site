// Local protocol double for automated tests. This is NOT an antivirus engine.
import { createServer, type Socket } from "node:net";
export async function startTestScanner() {
  const sockets = new Set<Socket>();
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    let buffer = Buffer.alloc(0),
      started = false;
    const chunks: Buffer[] = [];
    socket.on("data", (part: Buffer) => {
      buffer = Buffer.concat([buffer, part]);
      if (!started) {
        if (buffer.length < 10) return;
        if (buffer.subarray(0, 10).toString() !== "zINSTREAM\0") {
          socket.destroy();
          return;
        }
        buffer = buffer.subarray(10);
        started = true;
      }
      while (buffer.length >= 4) {
        const size = buffer.readUInt32BE(0);
        if (size > 20 * 1024 * 1024) {
          socket.destroy();
          return;
        }
        if (buffer.length < size + 4) return;
        if (size === 0) {
          const bytes = Buffer.concat(chunks);
          socket.end(
            bytes.includes(Buffer.from("EICAR-STANDARD-ANTIVIRUS-TEST-FILE"))
              ? "stream: Eicar-Test-Signature FOUND\0"
              : "stream: OK\0",
          );
          return;
        }
        chunks.push(Buffer.from(buffer.subarray(4, size + 4)));
        buffer = buffer.subarray(size + 4);
      }
    });
    socket.on("error", () => undefined);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    host: "127.0.0.1",
    port: String((server.address() as any).port),
    close: async () => {
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
