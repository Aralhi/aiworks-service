/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "OPTIONS,POST" },
          { key: "Access-Control-Allow-Headers", value: "Authorization, Accept-Version, Content-Length, Content-MD5, User-Agent, Content-Type, Date, Referer, X-Fingerprint, X-Salai-Plaintext" },
        ]
      },
    ];
  },
};
