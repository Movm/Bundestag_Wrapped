const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// [H1] Vite `?url` imports (lib/snd-sprite.ts): strip the query, Metro serves the file as an asset.
if (!config.resolver.assetExts.includes('ogg')) config.resolver.assetExts.push('ogg');
const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const name = moduleName.endsWith('?url') ? moduleName.slice(0, -4) : moduleName;
  return (upstream ?? context.resolveRequest)(context, name, platform);
};

module.exports = config;
