import type { NextPage } from 'next'
// import React, { Component } from 'react';
import { useState } from 'react';
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import useSWR from 'swr'
import { PrismaClient, Funds, Prisma } from '@prisma/client';
import { diff, addedDiff, deletedDiff, updatedDiff, detailedDiff } from 'deep-object-diff';



const DEFAULT_DATE = new Date('2020-11-26').toUTCString()
const DATA_FEED_URL = "https://purposecloud.s3.amazonaws.com/challenge-data.json"
const fetcher = (url: RequestInfo) => fetch(url).then(r => r.json())
const prisma = new PrismaClient()

class FundsClass{
  
  REMOTE_DATA = {}

  constructor(){}

  init(_data:any) {
    let self = this;
    console.log('init data',_data)

    return this.getRemoteData(function(data : any){
      return self.render (self.filter(data))
    })
  }
  protected getRemoteData (callback:(n:any)=>any) {
    const { data, error } = useSWR(DATA_FEED_URL, fetcher)
    if (error) return <div>failed to load</div>
    if (!data) return <div>loading...</div>
    console.log('getRemoteData:', data)
    this.REMOTE_DATA = data
    return callback(data)
  }
  protected filter (data : any) {
    console.log('filter:', data)
    if ( data ){
      // let _filtered_data = {}
      for (let key in data) {
        if (data.hasOwnProperty(key)) {
          for (let k in data[key].series) {
            if (data[key].series.hasOwnProperty(k)) {
              let _date = new Date(data[key].series[k].latest_nav.date).toUTCString()
              if ( DEFAULT_DATE > _date ){
                // console.log(key, JSON.stringify(data[key]))
                delete data[key];
                break;
              }
            }
          }
        }
      }
      // return _filtered_data;
    }
    return data
  }
  public render (data : any){
    if ( data ){
      console.log('render:', data)
      return this.renderList( data )
    }
  }
  renderList( data : any){
    let self = this;
    return(
      // <form onSubmit={ async(e) => {self.save(data,e) }}>
      <form onSubmit={ async(e) => {
        self.setFunds([..._funds, data]);
        self.saveFunds(data,e) 
      }}>
      <ul className={styles.fundsList}>
        <li className={styles.warning}>
          <div className={styles.row}>
            <label htmlFor='new_date' className={styles.flexItem}>The funds listed below are probably out of date and has stale data, please check and update the info below and set the latest date accordingly:</label>
            <input id="new_date" name='new_date' type="date" defaultValue={new Date().toISOString().split('T')[0]}/>
            <button type='submit'>Save</button>
          </div>
        </li>
        {this.renderListElements(data)}
      </ul>
      </form>
    )
  }
  renderListElements(data : any) {
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
                <input name="aum" className={styles.flexItem} type="number" defaultValue={data[item].aum} />
              </div>
            </div>
            {Object.entries(data[item].series).map(([k]) => {
              return (
                <div key={k} className={styles.row}>
                  <label className={styles.flexItem}>Series {k} : </label>
                  <div className={styles.flexItem}><input name="latest_nav.value" className={styles.flexItem} type="number" defaultValue={data[item].series[k].latest_nav.value}/></div>
                </div>
              )
            })}
          </div>
        </li>
      ))
    )
  }
  async saveFunds (funds: Prisma.FundsCreateInput){
    console.log('saveFunds', funds)
    
    const response = await fetch('/api/funds', {
      method: 'POST',
      body: JSON.stringify(funds)
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return await response.json();
  }
}

const funds = new FundsClass();

export default function Index({ DB_DATA }) {
  const [_funds, setFunds] = useState<Funds[]>(DB_DATA);
  return (
  <div className={styles.container}>
    <Head>
      <title>Interview Assignment</title>
      <meta name="description" content="Purpose Investment interview assignmnet" />
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <main className={styles.main}>
      {/* {funds.init(data)} */}

      <form onSubmit={async (data, e) => {
          try {
            console.log('onSubmit', data)
            await funds.saveFunds(data);
            setFunds([..._funds, data]);
            e.target.reset();
          } catch (err) {
            console.log(err);
          }
        }}>
        <ul className={styles.fundsList}>
          <li className={styles.warning}>
            <div className={styles.row}>
              <label htmlFor='new_date' className={styles.flexItem}>The funds listed below are probably out of date and has stale data, please check and update the info below and set the latest date accordingly:</label>
              <input id="new_date" name='new_date' type="date" defaultValue={new Date().toISOString().split('T')[0]}/>
              <button type='submit'>Save</button>
            </div>
          </li>
          {funds.renderListElements(_funds)}
        </ul>
      </form>

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
  const _data: Funds[] = await prisma.funds.findMany(); 
  return {
    props : {
      DB_DATA : _data
    }
  };
}