import type { Server } from "socket.io";
import type { MessageDetail } from "./message.js";

const RETRY_INTERVAL = 100;
const MAX_RETRIES = 6;

export async function emitWithRetry(
  io: Server,
  roomId: number,
  event: string,
  data: MessageDetail,
  retries = MAX_RETRIES
) {
  return new Promise<void>((resolve, reject) => {
    let attempts = 0;

    function sendEvent() {
      attempts++;
      io.to(roomId.toString()).emit(event, data, (ack: boolean) => {
        if (ack) {
          console.log(`Acknowledgement received for event: ${event}`);
          resolve();
        } else if (attempts < retries) {
          console.log(
            `No acknowledgement received for event: ${event}, retrying... (${attempts})`
          );
          setTimeout(sendEvent, Math.pow(2, attempts) * RETRY_INTERVAL);
        } else {
          console.log(
            `Failed to deliver event: ${event} after ${retries} attempts`
          );
          reject(
            new Error(
              `Failed to deliver event: ${event} after ${retries} attempts`
            )
          );
        }
      });
    }

    sendEvent();
  });
}
