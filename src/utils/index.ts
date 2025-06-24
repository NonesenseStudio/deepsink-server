export const generateUuid = (): string => {
  const buffer = new Uint8Array(10);
  crypto.getRandomValues(buffer); // 加密安全随机数
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};
