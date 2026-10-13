/**
 * `@mysten/sui/graphql` 的模块声明。
 *
 * 背景：本项目的 tsconfig 用的是 `moduleResolution: "node"`（旧式解析），
 * 它不读取 package.json 的 `exports` 字段，因此解析不到该子路径的类型
 * （包本身提供了 dist/graphql/index.d.mts）。
 *
 * 改 tsconfig 为 `bundler`/`nodenext` 会影响全仓类型解析、风险大，
 * 这里用最小声明补齐 —— 只声明本项目实际用到的部分。
 */
declare module '@mysten/sui/graphql' {
  export class SuiGraphQLClient {
    constructor(options: { url: string })
    query<T = unknown>(options: {
      query: string
      variables?: Record<string, unknown>
      operationName?: string
    }): Promise<T>
  }
}
