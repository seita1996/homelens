import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import { publicIpv4 } from 'public-ip'
import { gzip, unzip } from '../lib/compression'
import { sdp, playVideo, pauseVideo, stopLocalStream, setRemoteDescriptionOfferAnswer, makeOffer } from '../lib/p2p'

let localStream: MediaStream
let receivedSdp: string
const Home: NextPage = () => {

  const socketRef = useRef<WebSocket>()
  const [isConnected, setIsConnected] = useState(false)
  const [nameList, setNameList] = useState<object[]>([])
  const [myName, setMyName] = useState('')
  const [stopButtonVisible, setStopButtonVisible] = useState(false)

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
  async function startVideo() {
    console.log('startVideo')
    const localVideo = document.getElementById('localVideo') as HTMLVideoElement
    localStream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}, audio: false})
    playVideo(localVideo, localStream)
    setStopButtonVisible(true)
  }

  // 自身のデバイスのカメラをオフにしてStreamを中断
  function stopVideo() {
    console.log('stopVideo')
    const localVideo = document.getElementById('localVideo') as HTMLVideoElement
    pauseVideo(localVideo)
    stopLocalStream(localStream)
    setStopButtonVisible(false)
  }

  // Start PeerConnection
  function connect() {
    console.log('connect')
    console.log('make Offer')
    makeOffer(localStream)
  }

  function startInteractiveStreaming() {
    const text = _trimTailDoubleLF(receivedSdp); // for Safar TP --> Chrome
    setRemoteDescriptionOfferAnswer(text, localStream)
    receivedSdp = ''
  }

  async function onReceiveSdp(resSdp: string, from: string) {
    if (from !== '') {
      // Outbound trip
      await startVideo()
      sendSdp(from, '')
      setRemoteDescriptionOfferAnswer(resSdp, localStream)
    } else {
      // Return trip
      receivedSdp = resSdp

      const startStreaming = confirm('通信を開始しますか？')
      if(startStreaming) {
        startInteractiveStreaming()
      } else {
        stopVideo()
      }
    }
  }

  function _trimTailDoubleLF(str: string) {
    const trimed = str.trim()
    return trimed + String.fromCharCode(13, 10)
  }

  async function startExchangeSDP(targetClientName: string) {
    if (targetClientName === myName) {
      // TODO: Launch Settings Modal
      console.error('×startExchangeSDP')
      return
    }
    console.log('startExchangeSDP')
    // start video
    await startVideo()
    // connect
    connect()
    // send sdp
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

  function decorateClientName(clientName: string) {
    if (clientName === myName) {
      return clientName + '(me)'
    }
    return clientName
  }

  function displayClientList(list: any) {
    return list.map(function (clientName: string, i: number) {
      return <div key={`clientName${i}`} className={styles.btn} onClick={() => startExchangeSDP(clientName)}>{decorateClientName(clientName)}</div>
    })
  }

  function stopButton() {
    if(stopButtonVisible) {
      return <button onClick={stopVideo}>Stop Video</button>
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
        {stopButton()}
      </div>
      <div>
        <video id="localVideo" className={styles.videoBox} muted autoPlay playsInline></video>
        <video id="remoteVideo" className={styles.videoBox} muted autoPlay playsInline></video>
      </div>
      <div>
        <span>WebSocket is connected : {`${isConnected}`}</span>
      </div>
      <div>
        <span>Room List</span>
        <div className={styles.flexSpaceAround}>
          { displayClientList(nameList) }
        </div>
      </div>
      <Link href='/terms'>Terms</Link>
    </div>
  )
}

export default Home
