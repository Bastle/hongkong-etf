import type { AppProps } from 'next/app'
import Head from 'next/head'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>港股热力图 - HK Stock Heatmap</title>
        <meta name="description" content="全屏港股热力图可视化，展示港股市场涨跌幅与市值分布" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
