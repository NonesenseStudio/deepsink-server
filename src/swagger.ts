import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: '3.0.0', // OpenAPI版本
    info: {
      title: 'API文档标题',
      version: '1.0.0',
      description: 'API接口描述',
    },
    servers: [
      { url: 'http://localhost:3000', description: '本地环境' },
      // 添加其他服务器地址（如生产环境）
    ],
  },
  apis: ['./routes/*.js'], // 指定包含JSDoc注释的路由文件路径
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;