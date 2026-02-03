/**
 * 应用根路由页面
 * 自动重定向到主标签页导航
 */
import { Redirect } from "expo-router";

export default function Index() {
  // 重定向到标签页路由
  return <Redirect href="/(tabs)" />;
}
