import { Midjourney } from "midjourney";
import { ResponseError } from "../../../lib/MJ";

const client = new Midjourney({
  ServerId: <string>process.env.SERVER_ID,
  ChannelId: <string>process.env.CHANNEL_ID,
  SalaiToken: <string>process.env.SALAI_TOKEN,
  Debug: true,
  MaxWait: 600,
});

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  const { content, index, msgId, msgHash } = await req.json();
  console.log("upscale.handler", content);
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      console.log("upscale.start", content);
      client
        .Upscale(
          content,
          index,
          msgId,
          msgHash,
          (uri: string, progress: string) => {
            console.log("upscale.loading", uri);
            controller.enqueue(
              encoder.encode(JSON.stringify({ uri, progress }))
            );
          }
        )
        .then((msg) => {
          console.log("upscale.done", msg);
          controller.enqueue(encoder.encode(JSON.stringify(msg)));
          controller.close();
        })
        .catch((err: ResponseError) => {
          console.log("upscale.error", err);
          controller.close();
        });
    },
  });
  return new Response(readable, {});
}