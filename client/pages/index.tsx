import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'

const P2P = function({ remoteVideoId = '', displaySdpId = '' }) {
  let peerConnection: RTCPeerConnection

  return {
    // 対象のHTMLエレメントに対してMediaStreamを反映
    playVideo: function(element: HTMLMediaElement, stream: MediaStream) {
      console.log('playVideo')
      if ('srcObject' in element) {
        if (! element.srcObject) {
          element.srcObject = stream
        } else {
          console.log('stream alreay playing, so skip')
        }
      }
      element.play()
      element.volume = 0
    },

    // デバイスのカメラをオフ
    pauseVideo: function(element: HTMLMediaElement) {
      element.pause()
      if ('srcObject' in element) {
        element.srcObject = null
      }
      else {
        if (element.src && (element.src !== '') ) {
          window.URL.revokeObjectURL(element.src)
        }
        element.src = ''
      }
    },

    // Streamを中断
    stopLocalStream: function(stream: MediaStream) {
      let tracks = stream.getTracks()
      if (! tracks) {
        console.warn('NO tracks')
        return
      }
      for (let track of tracks) {
        track.stop()
      }
    },

    setRemoteDescriptionOfferAnswer: function(sdpText: string, stream: MediaStream) {
      if (peerConnection) {
        console.log('Received answer text...')
        let answer = new RTCSessionDescription({
          type : 'answer',
          sdp : sdpText,
        })
        this.setAnswer(answer)
      }
      else {
        console.log('Received offer text...')
        let offer = new RTCSessionDescription({
          type : 'offer',
          sdp : sdpText,
        })
        this.setOffer(offer, stream)
      }
    },

    setAnswer: function(sessionDescription: RTCSessionDescription) {
      if (! peerConnection) {
        console.error('peerConnection NOT exist!')
        return
      }
      peerConnection.setRemoteDescription(sessionDescription)
      .then(function() {
        console.log('setRemoteDescription(answer) succsess in promise')
      }).catch(function(err) {
        console.error('setRemoteDescription(answer) ERROR: ', err)
      })
    },

    setOffer: function(sessionDescription: RTCSessionDescription, stream: MediaStream) {
      if (peerConnection) {
        console.error('peerConnection alreay exist!')
      }
      peerConnection = this.prepareNewConnection(stream)
      const _this = this
      peerConnection.setRemoteDescription(sessionDescription)
      .then(function() {
        console.log('setRemoteDescription(offer) succsess in promise')
        _this.makeAnswer(stream)
      }).catch(function(err) {
        console.error('setRemoteDescription(offer) ERROR: ', err)
      })
    },

    makeAnswer: function(stream: MediaStream) {
      console.log('sending Answer. Creating remote session description...' )
      if (! peerConnection) {
        console.error('peerConnection NOT exist!')
        return
      }
      let options = {}
      if (! stream) {
        //options = { offerToReceiveAudio: true, offerToReceiveVideo: true }

        if ('addTransceiver' in peerConnection) {
          console.log('-- use addTransceiver() for recvonly --')
          peerConnection.addTransceiver('video', { direction: 'recvonly' })
          peerConnection.addTransceiver('audio', { direction: 'recvonly' })
        }
      }
      peerConnection.createAnswer(options)
      .then(function (sessionDescription) {
        console.log('createAnswer() succsess in promise')
        return peerConnection.setLocalDescription(sessionDescription)
      }).then(function() {
        console.log('setLocalDescription() succsess in promise')
      }).catch(function(err) {
        console.error(err)
      })
    },

    makeOffer: function(stream: MediaStream) {
      if (peerConnection) {
        console.warn('peer already exist.')
        return
      }
      peerConnection = this.prepareNewConnection(stream)

      let options = {}
      peerConnection.createOffer(options)
      .then(function (sessionDescription) {
        console.log('createOffer() succsess in promise')
        return peerConnection.setLocalDescription(sessionDescription)
      }).then(function() {
        console.log('setLocalDescription() succsess in promise')
      }).catch(function(err) {
        console.error(err)
      })
    },

    prepareNewConnection: function(stream: MediaStream) {
      let pc_config = {"iceServers":[]}
      let peer = new RTCPeerConnection(pc_config)
      // --- on get remote stream ---
      const _this = this
      if ('ontrack' in peer) {
        peer.ontrack = function(event) {
          console.log('-- peer.ontrack()')
          let stream = event.streams[0]
          const remoteVideo = document.getElementById(remoteVideoId) as HTMLVideoElement
          _this.playVideo(remoteVideo, stream)
          if (event.streams.length > 1) {
            console.warn('got multi-stream, but play only 1 stream')
          }
        }
      }
      // --- on get local ICE candidate
      peer.onicecandidate = function (evt) {
        if (evt.candidate) {
          console.log(evt.candidate)
          // Trickle ICE の場合は、ICE candidateを相手に送る
          // Vanilla ICE の場合には、何もしない
        } else {
          console.log('empty ice event')
          // Trickle ICE の場合は、何もしない
          // Vanilla ICE の場合には、ICE candidateを含んだSDPを相手に送る
          _this.displaySdp(peer.localDescription as RTCSessionDescription)
        }
      }
      // -- add local stream --
      if (stream) {
        console.log('Adding local stream...')
        if ('addTrack' in peer) {
          console.log('use addTrack()')
          let tracks = stream.getTracks()
          for (let track of tracks) {
            let sender = peer.addTrack(track, stream)
          }
        }
      }
      else {
        console.warn('no local stream, but continue.')
      }

      return peer
    },

    displaySdp: function(sessionDescription: RTCSessionDescription) {
      console.log('---sending sdp ---')
      const textForDisplaySdp: HTMLTextAreaElement = document.getElementById(displaySdpId) as HTMLTextAreaElement
      textForDisplaySdp.value = sessionDescription.sdp
      textForDisplaySdp.focus()
      textForDisplaySdp.select()
    }
  }
}

const Home: NextPage = () => {
  let localStream: MediaStream

  const p2p = P2P({ remoteVideoId: 'remoteVideo', displaySdpId: 'text_for_display_sdp' })

  const socketRef = useRef<WebSocket>()
  const [isConnected, setIsConnected] = useState(false)
  const [nameList, setNameList] = useState<object[]>([])

  useEffect(() => {
    socketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WEBSOCKET_SERVER_URL}/ws`)
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
        if(resData.type === 'ping') {
          socketRef.current?.send('{ "type": "pong" }')
        }
        if(resData.type === 'yourname') {
          console.log('yourname', resData.data)
        }
        if(resData.type === 'namelist') {
          setNameList([...nameList, ...resData.data])
        }
      }
    }
    socketRef.current.onclose = function() {
      setIsConnected(false)
      console.log('Closed')
    }
  }, [])

  // 自身のデバイスのカメラをオンにしてvideoタグ内へ映像を反映
  async function startVideo() {
    console.log('startVideo')
    const localVideo = document.getElementById('localVideo') as HTMLVideoElement
    localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false})
    p2p.playVideo(localVideo, localStream)
  }

  // 自身のデバイスのカメラをオフにしてStreamを中断
  function stopVideo() {
    console.log('stopVideo')
    const localVideo = document.getElementById('localVideo') as HTMLVideoElement
    p2p.pauseVideo(localVideo)
    p2p.stopLocalStream(localStream)
  }

  // Start PeerConnection
  function connect() {
    console.log('connect')
    console.log('make Offer')
    p2p.makeOffer(localStream)
  }
  function hangup() {
    console.log('hangup')
  }

  function onSdpText() {
    const textToReceiveSdp = document.getElementById('text_for_receive_sdp') as HTMLTextAreaElement
    let text = textToReceiveSdp.value
    text = _trimTailDoubleLF(text); // for Safar TP --> Chrome
    p2p.setRemoteDescriptionOfferAnswer(text, localStream)
    textToReceiveSdp.value =''
  }

  function _trimTailDoubleLF(str: string) {
    const trimed = str.trim()
    return trimed + String.fromCharCode(13, 10)
  }

  return (
    <div>
      <Head>
        <title>homecam</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.title}>homecam</div>
      <div className={styles.flexSpaceAround}>
        <div className={styles.btn}>
          <Link href='/sender'>Sender</Link>
        </div>
        <div className={styles.btn}>
          <Link href='/receiver'>Receiver</Link>
        </div>
      </div>
      <div>
        <button onClick={startVideo}>Start Video</button>
        <button onClick={stopVideo}>Stop Video</button>
        <button onClick={connect}>Connect</button>
        <button onClick={hangup}>Hang Up</button>
      </div>
      <div>
        <video id="localVideo" className={styles.videoBox} muted autoPlay playsInline></video>
        <video id="remoteVideo" className={styles.videoBox} muted autoPlay playsInline></video>
      </div>
      <div>
        <p>SDP to send:&nbsp;
          <button type="button">copy local SDP</button><br />
          <textarea id="text_for_display_sdp" rows={5} cols={60} readOnly={true}>SDP to send</textarea>
        </p>
        <p>SDP to receive:&nbsp;
          <button type="button" onClick={onSdpText}>Receive remote SDP</button><br />
          <textarea id="text_for_receive_sdp" rows={5} cols={60}></textarea>
        </p>
      </div>
      <div>
        <span>WebSocket is connected : {`${isConnected}`}</span>
      </div>
      <div>
        <span>Room List</span>
        <div className={styles.flexSpaceAround}>
          { nameList.map((clientName, i) => <div key={`clientName${i}`} className={styles.btn}>{clientName.toString()}</div>)}
        </div>
      </div>
    </div>
  )
}

export default Home
