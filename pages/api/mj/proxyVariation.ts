export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    const { content, index, msgId, msgHash, unionId } = await req.json();
    const res = await fetch('https://discord.com/api/v9/interactions', {
      headers: {
        accept: '*/*',
        'accept-language': 'zh-CN,zh;q=0.9',
        authorization: process.env.SALAI_TOKEN as string,
        'content-type': 'application/json',
        'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-debug-options': 'bugReporterEnabled',
        'x-discord-locale': 'zh-CN',
        'x-discord-timezone': 'Asia/Shanghai',
        'x-super-properties':
          'eyJvcyI6Ik1hYyBPUyBYIiwiYnJvd3NlciI6IkNocm9tZSIsImRldmljZSI6IiIsInN5c3RlbV9sb2NhbGUiOiJ6aC1DTiIsImJyb3dzZXJfdXNlcl9hZ2VudCI6Ik1vemlsbGEvNS4wIChNYWNpbnRvc2g7IEludGVsIE1hYyBPUyBYIDEwXzE1XzcpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMTQuMC4wLjAgU2FmYXJpLzUzNy4zNiIsImJyb3dzZXJfdmVyc2lvbiI6IjExNC4wLjAuMCIsIm9zX3ZlcnNpb24iOiIxMC4xNS43IiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tLyIsInJlZmVycmluZ19kb21haW4iOiJkaXNjb3JkLmNvbSIsInJlZmVycmVyX2N1cnJlbnQiOiJodHRwczovL3d3dy5nb29nbGUuY29tLyIsInJlZmVycmluZ19kb21haW5fY3VycmVudCI6Ind3dy5nb29nbGUuY29tIiwic2VhcmNoX2VuZ2luZV9jdXJyZW50IjoiZ29vZ2xlIiwicmVsZWFzZV9jaGFubmVsIjoic3RhYmxlIiwiY2xpZW50X2J1aWxkX251bWJlciI6MjA1Nzk3LCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==',
      },
      referrer: 'https://discord.com/channels/1093531304059998299/1109836479468937216',
      referrerPolicy: 'strict-origin-when-cross-origin',
      body: JSON.stringify({
        type: 5,
        application_id: '936929561302675456',
        channel_id: process.env.CHANNEL_ID,
        guild_id: process.env.SERVER_ID,
        data: {
          id: msgId,
          custom_id: `MJ::RemixModal::${msgHash}::${index}`,
          components: [{ type: 1, components: [{ type: 4, custom_id: 'MJ::RemixModal::new_prompt', value: content }] }],
        },
        session_id: 'b128dc60237e5576c3ebc44bd8309bec',
        nonce: '1118930593317388288',
      }),
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
    });
    console.log(res);
    return new Response(JSON.stringify(res));
  } catch (e) {
    return new Response(JSON.stringify({ status: 'failed' }), { status: 500 });
  }
}
