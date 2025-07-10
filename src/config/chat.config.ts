
export const getSessionTitle = async (userMessage: string) => {
  let data: any = await fetch(
    "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer 2257c2054dab5298400daba0ae1db49b.r20QIsgSwxqbmgPL",
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          {
            role: "system",
            content:
              "你是一个多语言标题生成专家，接下来我会给你一段用户输入的内容，请你生成一个会话标题，只需要返回标题即可，需要突出主题，使用陈述句表达",
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
      }),
    },
  ).then((response) => response.json());
  return data.choices[0].message.content;
};
