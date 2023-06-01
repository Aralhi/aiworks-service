export const config = {
  runtime: "edge",
};

const handler = async (req: Request) => {
  const body = await req.json();
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export default handler;