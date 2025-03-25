/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
 
    images: {
      domains: ['assets.coingecko.com','thegivingblock.com','uploads-ssl.webflow.com','token-icons.s3.amazonaws.com','app.cabana.fi','www.iconarchive.com','raw.githubusercontent.com', 'pooltime.app']
    },
    webpack: (config) => {
      config.resolve.extensionAlias = {
        '.js': ['.js', '.ts', '.tsx']
      }
      return config
    },
  
    transpilePackages: ['@farcaster/frame-sdk', '@farcaster/frame-wagmi-connector', '@farcaster/frame-core'],
    experimental: {
      esmExternals: 'loose'
    }

};

module.exports = nextConfig;
