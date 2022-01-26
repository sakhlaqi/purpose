import { useState } from 'react';
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import useSWR from 'swr'
import { PrismaClient } from '@prisma/client';
import _ from 'lodash';
import moment from 'moment';

let formData = {}
let dbData = {}
const DEFAULT_DATE = moment.utc('2020/11/26', 'YYYY/MM/DD')
const DATA_FEED_URL = "https://purposecloud.s3.amazonaws.com/challenge-data.json"
const fetcher = (url: RequestInfo) => fetch(url).then(r => r.json())
const prisma = new PrismaClient()
class FundsClass{
  data = {}
  constructor(){}

  init(_db_data:any) {
    console.log('init',_db_data)
    let self = this;
    dbData = _db_data;
    return this.getRemoteData(function(data : any){
      if ( data && typeof data === 'object' && !_.isEmpty(data) ){
        if ( _db_data && typeof _db_data === 'object' && !_.isEmpty(_db_data) ){
            //override remote data with previously saved database data.
            data = _.merge(data,_db_data)
        }
        return self.renderContent(self.filter(data))
      }
    })
  }
  protected getRemoteData (callback:(n:any)=>any) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, error } = useSWR(DATA_FEED_URL, fetcher)
    if (error) return <div>failed to load</div>
    if (!data) return <div>loading...</div>
    console.log('getRemoteData:', data)
    this.data = data
    return callback(data)
  }
  protected filter (data : any) {
    console.log('filter:', data)
    if ( data ){
      // filtering funds based on the latest nav date.
      // subtract 3 days if the default day is a Monday to get to the last friday, 
      // otherwise subtract 1 day to get to yesterday's date
      let _compare_date = DEFAULT_DATE.subtract( ( (DEFAULT_DATE.format('dddd') == 'Monday') ? 3 : 1 ), "days" )
      for (let key in data) {
        if (data.hasOwnProperty(key)) {
          for (let k in data[key].series) {
            if (data[key].series.hasOwnProperty(k)) {
              let _date = moment.utc(data[key].series[k].latest_nav.date, 'YYYY/MM/DD')
              if (_date.isAfter(_compare_date) ){
                delete data[key];
                break;
              }
            }
          }
        }
      }
    }
    return data
  }
  public renderContent (data : any){
    if ( data ){
      console.log('render:', data)
      return this.renderList( data )
    }
  }
  protected renderList( data : any){
    let self = this;
    return(
      <form onSubmit={ async(e) => {self.saveFunds(e) }}>
        <ul className={styles.fundsList}>
          <li className={styles.warning}>
            <div className={styles.row}>
              <label htmlFor='latest_nav.date' className={styles.flexItem}>The funds listed below are probably out of date and has stale data, please check and update the info below and set the latest date accordingly:</label>
              <input onChange={this.onChange} id="latest_nav.date" name='latest_nav.date' type="date" defaultValue={new Date().toISOString().split('T')[0]}/>
              <button type='submit'>Save</button>
            </div>
          </li>
          {this.renderListElements(data)}
        </ul>
      </form>
    )
  }
  protected renderListElements(data : any) {
    return (
      Object.keys(data).map((item, i) => (
        <li key={i} className={styles.funds}>
          <div className={styles.fundInfo}>
            <div>{data[item].name.en} ( {data[item].symbol} )</div>
          </div>
          <div className={styles.series}>
            <div className={styles.row}>
              <label className={styles.flexItem} >AUM : </label>
              <div className={styles.flexItem}>
                <span className={styles.inputSymbol}>$</span>
                <input onChange={this.onChange} name="aum" data-symbol={data[item].symbol} className={styles.flexItem} type="number" defaultValue={data[item].aum} />
              </div>
            </div>
            {Object.entries(data[item].series).map(([k]) => {
              return (
                <div key={k} className={styles.row}>
                  <label className={styles.flexItem}>Series {k} : </label>
                  <div className={styles.flexItem}>
                    <input onChange={this.onChange} name="latest_nav.value" data-symbol={data[item].symbol} data-series={k} className={styles.flexItem} type="number" defaultValue={data[item].series[k].latest_nav.value}/>
                  </div>
                </div>
              )
            })}
          </div>
        </li>
      ))
    )
  }
  protected onChange (event:any){
    const name = event.target.name;
    const value = event.target.value;
    const symbol = event.target.dataset.symbol;
    const series = event.target.dataset.series;
    switch(name){
      case "latest_nav.value" :
        formData = _.merge(formData,{[symbol]:{"series":{[series]:{"latest_nav":{"value":value}}}}})
        break;
      case "latest_nav.date":
        let data : any = funds.data
        for (let key in data) {
          if (data.hasOwnProperty(key)) {
            for (let k in data[key].series) {
              if (data[key].series.hasOwnProperty(k)) {
                formData = _.merge(formData,{[key]:{"series":{[k]:{"latest_nav":{"date":value}}}}})
              }
            }
          }
        }
        break;
      default:
        formData = _.merge(formData,{[symbol]:{[name]:value}})
        break;
    }    
    console.log('form data:', formData);
  }
  protected async saveFunds (event:any){
    console.log('save form', formData)
    event.preventDefault();

    if (formData && !_.isEmpty(formData)) {
      dbData = _.merge(dbData, formData);
      const response = await fetch('/api/funds', {
        method: 'POST',
        body: JSON.stringify(dbData)
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return await response.json();
    }
  }
}

const funds = new FundsClass();

export default function Index({ DB_DATA } : any) {
  const [data] = useState(DB_DATA);
  return (
  <div className={styles.container}>
    <Head>
      <title>Interview Assignment</title>
      <meta name="description" content="Purpose Investment interview assignmnet" />
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <main className={styles.main}>
      {funds.init(data)}
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

export async function getServerSideProps() {
  let _db_data: any = await prisma.funds.findFirst();
  if ( _db_data && typeof _db_data === 'object' && !_.isEmpty(_db_data) ){
    _db_data = JSON.parse(_db_data.data);
  }
  return {
    props : {
      DB_DATA : _db_data
    }
  };
}
