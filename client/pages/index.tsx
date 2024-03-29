import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { facingModeState } from '../states/rootStates/userState'
import { ReactSVG } from 'react-svg'
import Button from '@/components/Button'
import Clients from '@/components/Clients'
import Sidebar from '@/components/Sidebar'
import styles from '../styles/Home.module.css'
import Seo from '@/components/Seo'
import { publicIpv4 } from 'public-ip'
import { gzip, unzip } from '../lib/compression'
import { sdp, playVideo, stopVideo, connect, webrtcSignaling } from '../lib/p2p'
import InfoModal from '@/components/InfoModal'

let localStream: MediaStream
let receivedSdp: string
const Home: NextPage = () => {

  const localVideoElementRef = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<WebSocket>()
  const [isConnected, setIsConnected] = useState(false)
  const [memberList, setMemberList] = useState<{name: string, ua: string, mobile: string}[]>([])
  const [myName, setMyName] = useState('')
  const [stopButtonVisible, setStopButtonVisible] = useState(false)
  const [clientListVisible, setClientListVisible] = useState(true)
  const [infoModalVisible, setInfoModalVisible] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(false)

  const facingMode = useRecoilValue(facingModeState) || 'user'

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
          else if(resData.type === 'memberlist') {
            resData.data.map((el: string) => console.log('json', JSON.parse(el)))
            setMemberList([...memberList, ...resData.data.map((element: string) => JSON.parse(element))])
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
    localStream = await navigator.mediaDevices.getUserMedia({video: {facingMode: facingMode}, audio: false})
    playVideo(localVideo, localStream)
    setStopButtonVisible(true)
  }

  // 自身のデバイスのカメラをオフにしてStreamを中断
  function turnOffVideo() {
    console.log('turnOffVideo')
    const localVideo = localVideoElementRef.current as HTMLVideoElement
    stopVideo(localVideo, localStream)
    setStopButtonVisible(false)
    setClientListVisible(true)

    // TODO: Fix initialization by resetting p2p module variables without reloading
    location.reload()
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

  function openInfoModal() {
    setInfoModalVisible(true)
  }

  function closeInfoModal() {
    setInfoModalVisible(false)
  }

  function openSideBar() {
    setSidebarVisible(true)
  }

  function closeSideBar() {
    setSidebarVisible(false)
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
          <div className={`${styles.flexSpaceAround} ${styles.clientList}`}>
            <Clients clientList={memberList} myName={myName} clientsOnClick={startExchangeSDP} meOnClick={launchSettingsModal} />
          </div>
        </div>
      )
    }
    return <div></div>
  }

  function videoView() {
    if(clientListVisible) {
        return (
          <div>
            <div>
              <video id="remoteVideo" className={styles.noVideoBox} muted autoPlay playsInline></video>
            </div>
            <div>
              <video id="localVideo" className={styles.noVideoBox} ref={localVideoElementRef} muted autoPlay playsInline></video>
            </div>
          </div>
        )
    }
    return (
      <div>
        <div>
          <video id="remoteVideo" className={styles.remoteVideoBox} muted autoPlay playsInline></video>
        </div>
        <div>
          <video id="localVideo" className={stopButtonVisible ? styles.localVideoBox : ''} ref={localVideoElementRef} muted autoPlay playsInline></video>
          <Button text={'停止'} class={styles.stopBtn} visible={stopButtonVisible} onClickAction={turnOffVideo} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <Seo
        pageTitle={'homelens'}
        pageDescription={'同じLANに接続された端末間でビデオ通信。ログインなし、複数の端末でhomelensにアクセスするだけで簡単に通信できます。ビデオ映像は外部サーバーに送信されないので高速かつ安心です。'}
        pageImg={'https://homelens.seita.work/homelens-logo.png'}
        pageImgWidth={1920}
        pageImgHeight={1080}
      />
      <div className={styles.flexSpaceBetween}>
        <div className={styles.title}>homelens（β版）</div>
        <div className={styles.flexSpaceBetween}>
          {/* TODO: Uncomment when displaying a modal */}
          {/* <div className={styles.iconBox} onClick={openInfoModal}>
            <ReactSVG src="/information-circle.svg" style={{ width: "32px", height: "32px" }} />
          </div> */}
          <div className={styles.iconBox} onClick={openSideBar}>
            <ReactSVG src="/cog8tooth.svg" style={{ width: "32px", height: "32px" }} />
          </div>
        </div>
      </div>
      {videoView()}
      <Button text={'再読み込み'} class={styles.reloadBtn} visible={!isConnected} onClickAction={() => location.reload()} />
      {clientList()}
      <Sidebar visible={sidebarVisible} closeSideBar={closeSideBar} />
      {/* TODO: Uncomment when displaying a modal */}
      {/* <InfoModal visible={infoModalVisible} closeInfoModal={closeInfoModal} /> */}
    </div>
  )
}

export default Home
