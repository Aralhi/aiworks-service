import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI");
}
console.log('.....process.env.OPENAI_API_KEY', process.env.OPENAI_API_KEY);
export const config = {
  runtime: "edge",
};

const handler = async (req: Request) => {
  console.log("get in");
  try {
    const { payload } = (await req.json())
    console.log("payload", payload);
    if (!payload?.messages || !payload?.messages?.length) {
      return new Response("No prompt in the request", { status: 400 });
    }
    const { stream: isStream } = payload;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify(payload),
    });
    if(!isStream) {
      const result = await res.json()
      return new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
        },
      })
    } else {
      if (!res.ok) {
        console.log("res", await res.json());
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const stream = new ReadableStream({
        async start(controller) {
          // callback
          function onParse(event: ParsedEvent | ReconnectInterval) {
            if (event.type === "event") {
              const data = event.data;
              // https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
              if (data === "[DONE]") {
                controller.close();
                return;
              }
              try {
                const json = JSON.parse(data);
                const text = json.choices[0].delta?.content || "";
                console.log("text", text);
                const queue = encoder.encode(text);
                controller.enqueue(queue);
              } catch (e) {
                // maybe parse error
                controller.error(e);
              }
            }
          }
    
          // stream response (SSE) from OpenAI may be fragmented into multiple chunks
          // this ensures we properly read chunks and invoke an event for each SSE event stream
          const parser = createParser(onParse);
          // https://web.dev/streams/#asynchronous-iteration
          for await (const chunk of res.body as any) {
            parser.feed(decoder.decode(chunk));
          }
        },
      });
      return new Response(stream);
    }
  } catch (e: any) {
    console.log("error", e);
    return new Response(e.message, { status: 500 });
  }
};

export default handler;