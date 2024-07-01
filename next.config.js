/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
 
    images: {
      domains: ['assets.coingecko.com','thegivingblock.com','uploads-ssl.webflow.com','token-icons.s3.amazonaws.com','app.cabana.fi','www.iconarchive.com','raw.githubusercontent.com']
    },

};

module.exports = nextConfig;
