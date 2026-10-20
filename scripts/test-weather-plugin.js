#!/usr/bin/env node
/**
 * 天气插件调用测试脚本
 * 用于验证插件调用参数结构是否正确
 */

const PLUGIN_ID = "7516843396187766818";
const TOOL_NAME = "search_sync";
const TOKEN = process.env.REALTIME_SEARCH_TOKEN;

if (!TOKEN) {
  console.error("错误: 未设置 REALTIME_SEARCH_TOKEN 环境变量");
  process.exit(1);
}

const query = "上海今天实时天气温度";

const requestBody = {
  tool_name: TOOL_NAME,
  arguments: {
    content: query,
  },
};

console.log("=== 请求 JSON ===");
console.log(JSON.stringify(requestBody, null, 2));
console.log("\n=== 发起请求 ===");

fetch(`https://api.coze.cn/v1/plugins/${PLUGIN_ID}/tools/call`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(requestBody),
})
  .then((res) => {
    console.log(`HTTP 状态码: ${res.status}`);
    return res.json();
  })
  .then((data) => {
    console.log("\n=== 返回 JSON ===");
    console.log(JSON.stringify(data, null, 2));
    
    // 提取天气内容
    const content = data?.data?.result?.data?.choices?.[0]?.message?.content;
    if (content) {
      console.log("\n=== 提取的天气内容 ===");
      console.log(content);
    } else {
      console.log("\n=== 未能提取天气内容 ===");
      console.log("返回数据结构:", Object.keys(data?.data?.result || {}));
    }
  })
  .catch((err) => {
    console.error("\n=== 请求失败 ===");
    console.error(err);
    process.exit(1);
  });
