import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Button from '@/components/Button'
import Clients from '@/components/Clients'
import styles from '../styles/Home.module.css'
import { publicIpv4 } from 'public-ip'
import { gzip, unzip } from '../lib/compression'
import { sdp, playVideo, stopVideo, connect, webrtcSignaling } from '../lib/p2p'

let localStream: MediaStream
let receivedSdp: string
const Home: NextPage = () => {

  const localVideoElementRef = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<WebSocket>()
  const [isConnected, setIsConnected] = useState(false)
  const [nameList, setNameList] = useState<object[]>([])
  const [myName, setMyName] = useState('')
  const [stopButtonVisible, setStopButtonVisible] = useState(false)
  const [clientListVisible, setClientListVisible] = useState(true)

  useEffect(() => {
    (async () => {
      // IPv4 address cannot be obtained for IPoE connection, so it is sent after obtaining it with Client.
      const ipv4 = await publicIpv4()
      console.log('global ipv4 address', ipv4)
      socketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WEBSOCKET_SERVER_URL}/ws?ipv4=${ipv4}`)
      console.log(socketRef)
      socketRef.current.onopen = function() {
        setIsConnected(true)
        console.log('Connected')
      }
      socketRef.current.onmessage = function(event) {
        // Executed only when connection is Open
        // https://developer.mozilla.org/ja/docs/Web/API/WebSocket/readyState
        if(socketRef.current?.readyState === 1) {
          const resData = JSON.parse(event.data)
          if(resData.type === 'healthcheck' && resData.data === 'ping') {
            socketRef.current?.send('{ "type": "healthcheck", "data": "pong", "target": "" }')
          }
          else if(resData.type === 'yourname') {
            console.log('yourname', resData.data)
            setMyName(resData.data)
          }
          else if(resData.type === 'namelist') {
            setNameList([...nameList, ...resData.data])
          }
          else if(resData.type === 'sdp') {
            const resSdp = unzip(resData.data)
            onReceiveSdp(resSdp, resData.from)
          }
        }
      }
      socketRef.current.onclose = function() {
        setIsConnected(false)
        console.log('Closed')
      }
    })()
  }, [])

  // 自身のデバイスのカメラをオンにしてvideoタグ内へ映像を反映
  async function turnOnVideo() {
    console.log('turnOnVideo')
    const localVideo = localVideoElementRef.current as HTMLVideoElement
    localStream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}, audio: false})
    playVideo(localVideo, localStream)
    setStopButtonVisible(true)
  }

  // 自身のデバイスのカメラをオフにしてStreamを中断
  function turnOffVideo() {
    console.log('turnOffVideo')
    const localVideo = localVideoElementRef.current as HTMLVideoElement
    stopVideo(localVideo, localStream)
    setStopButtonVisible(false)
  }

  // Start PeerConnection
  function startPeerConnection() {
    console.log('connect')
    connect(localStream)
  }

  function startInteractiveStreaming() {
    webrtcSignaling(receivedSdp, localStream)
    receivedSdp = ''
  }

  async function onReceiveSdp(resSdp: string, from: string) {
    setClientListVisible(false)
    if (from !== '') {
      // Outbound trip
      await turnOnVideo()
      sendSdp(from, '')
      webrtcSignaling(resSdp, localStream)
    } else {
      // Return trip
      receivedSdp = resSdp

      const startStreaming = confirm('通信を開始しますか？')
      if(startStreaming) {
        startInteractiveStreaming()
      } else {
        turnOffVideo()
      }
    }
  }

  function launchSettingsModal(name: string) {
    // TODO: Launch Settings Modal
    alert(name)
  }

  async function startExchangeSDP(targetClientName: string) {
    console.log('startExchangeSDP')
    await turnOnVideo()
    startPeerConnection()
    sendSdp(targetClientName, myName)
  }

  function sendSdp(targetClientName: string, fromClientName: string) {
    let previousValue = sdp
    const observe = function() {
      const value = sdp
      if(previousValue === value) return
      if(socketRef.current?.readyState === 1) {
        // Send value to Peer when SDP value is set
        socketRef.current?.send(`{ "type": "sdp", "data": "${gzip(sdp)}", "target": "${targetClientName}", "from": "${fromClientName}" }`)
      }
      previousValue = sdp
    }
    setInterval(observe, 500)
  }

  function clientList() {
    if(clientListVisible && isConnected) {
      return (
        <div>
          <span>通信可能な端末</span>
          <div className={styles.flexSpaceAround}>
            <Clients clientList={nameList} myName={myName} clientsOnClick={startExchangeSDP} meOnClick={launchSettingsModal} />
          </div>
        </div>
      )
    }
    return <div></div>
  }

  return (
    <div>
      <Head>
        <title>homecam</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.title}>homecam</div>
      <div>
        <video id="remoteVideo" className={styles.remoteVideoBox} muted autoPlay playsInline></video>
      </div>
      <div>
        <video id="localVideo" className={styles.localVideoBox} ref={localVideoElementRef} muted autoPlay playsInline></video>
        <Button text={'停止'} class={styles.stopBtn} visible={stopButtonVisible} onClickAction={turnOffVideo} />
      </div>
      <Button text={'再読み込み'} class={''} visible={!isConnected} onClickAction={() => location.reload()} />
      {clientList()}
      <Link href='/terms'>Terms</Link>
    </div>
  )
}

export default Home
