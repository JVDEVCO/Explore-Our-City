import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      's3-media0.fl.yelpcdn.com',
      's3-media1.fl.yelpcdn.com',
      's3-media2.fl.yelpcdn.com',
      's3-media3.fl.yelpcdn.com',
      's3-media4.fl.yelpcdn.com',
      'media-cdn.tripadvisor.com',
      'dynamic-media-cdn.tripadvisor.com',
      'images.unsplash.com',
      'plus.unsplash.com',
      'source.unsplash.com',
      'cdn.pixabay.com',
      'images.pexels.com',
      'lh3.googleusercontent.com',
      'lh4.googleusercontent.com',
      'lh5.googleusercontent.com',
      'maps.googleapis.com',
      'streetviewpixels-pa.googleapis.com',
      'fastly.4sqi.net',
      'foursquare.com',
      'ss3.4sqi.net',
      'igx.4sqi.net',
      'playfoursquare.s3.amazonaws.com',
      'fb-s-c-a.akamaihd.net',
      'scontent.xx.fbcdn.net',
      'platform-lookaside.fbsbx.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.yelpcdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.tripadvisor.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.4sqi.net',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
      }
    ]
  }
};

export default nextConfig;