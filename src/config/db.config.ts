import { getPlatformProxy } from "wrangler";

export default (async () => {
  const { env } = await getPlatformProxy();
  return env.DB; // 通过binding名称"DB"获取实例
})();
