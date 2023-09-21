// next.config.js

module.exports = {
    webpack: (config) => {
      // 'fs'、'stream'、'zlib'に対するポリフィルを追加
      config.resolve.fallback = {
        fs: false, // 'fs'モジュールのポリフィルを無効化
        stream: require.resolve('stream-browserify'), // 'stream'モジュールのポリフィルを有効化
        zlib: require.resolve('browserify-zlib'), // 'zlib'モジュールのポリフィルを有効化
      };
  
      return config;
    },
  };
  