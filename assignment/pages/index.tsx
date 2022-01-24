import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

import useSWR from 'swr'

const DATA_FEED_URL = "https://purposecloud.s3.amazonaws.com/challenge-data.json";
const fetcher = (url: RequestInfo) => fetch(url).then(r => r.json())

class Funds {

  init() {
    return this.getRemoteData(function(data : any){
      console.log('callback', data)
      return funds.filter(data)
    })
  }
  protected getRemoteData (callback:(n:any)=>any) {
    const { data, error } = useSWR(DATA_FEED_URL, fetcher)
    if (error) return <div>failed to load</div>
    if (!data) return <div>loading...</div>
    console.log('getRemoteData:', data)
    return callback(data)
  }
  protected filter (data : any) {
    console.log('filter:', data)
    return this.render(data)
  }
  public render (data : any){
    if ( data ){
      console.log('redner:', data)
      return (
        <ul className={styles.fundsList}>
          { Object.keys(data).map((item, i) => (
          <li key={i} className={styles.funds}>
            <div className={styles.fundInfo}>
              <div>{data[item].name.en} ( {data[item].symbol} )</div>
            </div>
            <div className={styles.series}>
              <div><label>AUM : </label><input type="number" defaultValue={data[item].aum} /></div>
              {Object.entries(data[item].series).map(([k]) => {
                return (
                  <div key={k} >
                    <label>Series {k} : </label><input type="date" defaultValue={data[item].series[k].latest_nav.date}/>
                  </div>
                )
              })}
            </div>
          </li>
          ))}
        </ul>
      )
    }
  }
}

const funds = new Funds();

const Home: NextPage = () => {
    return (
    <div className={styles.container}>
      <Head>
        <title>Interview Assignment</title>
        <meta name="description" content="Purpose Investment interview assignmnet" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        {funds.init()}
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}

export default Home
