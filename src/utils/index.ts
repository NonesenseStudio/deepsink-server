export const generateUuid = (withHyphens: boolean = false): string => {
  const buffer = new Uint8Array(16); // UUID的标准长度是16字节
  crypto.getRandomValues(buffer); // 加密安全随机数

  let uuid = Array.from(buffer, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  if (withHyphens) {
    // 在标准UUID位置插入分隔符
    uuid = `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
  }
  return withHyphens ? uuid : uuid.slice(0, 16);
};

export const encodeBase64 = (data: string) => {
  return Buffer.from(data).toString("base64");
};

export const decodeBase64 = (encodedData: string) => {
  return Buffer.from(encodedData, "base64").toString("utf-8");
};
