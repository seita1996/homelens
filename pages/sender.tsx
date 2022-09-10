import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Sender.module.css'

const Sender: NextPage = () => {
  let localStream: MediaStream // TODO: スコープを狭く
  let peerConnection: RTCPeerConnection // TODO: スコープを狭く

  // 自身のデバイスのカメラをオンにしてvideoタグ内へ映像を反映
  async function startVideo() {
    console.log('startVideo')
    const localVideo = document.getElementById('localVideo') as HTMLVideoElement
    localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false})
    playVideo(localVideo, localStream)
  }

  // 自身のデバイスのカメラをオフにしてStreamを中断
  function stopVideo() {
    console.log('stopVideo')
    const localVideo = document.getElementById('localVideo') as HTMLVideoElement
    pauseVideo(localVideo)
    stopLocalStream(localStream)
  }

  // Start PeerConnection
  function connect() {
    console.log('connect')
    if (! peerConnection) {
      console.log('make Offer')
      makeOffer(localStream)
    }
    else {
      console.warn('peer already exist.')
    }
  }
  function hangup() {
    console.log('hangup')
  }

  // 対象のHTMLエレメントに対してMediaStreamを反映
  function playVideo(element: HTMLMediaElement, stream: MediaStream) {
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
  }

  // デバイスのカメラをオフ
  function pauseVideo(element: HTMLMediaElement) {
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
  }

  // Streamを中断
  function stopLocalStream(stream: MediaStream) {
    let tracks = stream.getTracks()
    if (! tracks) {
      console.warn('NO tracks')
      return
    }
    for (let track of tracks) {
      track.stop()
    }
  }

  function prepareNewConnection(stream: MediaStream) {
    let pc_config = {"iceServers":[]}
    let peer = new RTCPeerConnection(pc_config)

    // このロジックはReceiverで必要
    // --- on get remote stream ---
    if ('ontrack' in peer) {
      // 【RTCPeerConnection.ontrack()】
      // Peer接続が完了している状態でイベントが配信される
      // RTCRtpReceiverに新しいTrackが追加されるとontrackのイベントハンドラへtrackイベントが送信される
      // ※RTCRtpReceiverはRTCPeerConnection上のMediaStreamTrackのデータ受信とデコードを管理するもの
      peer.ontrack = function(event) {
        console.log('-- peer.ontrack()')
        let stream = event.streams[0]
        const remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement
        playVideo(remoteVideo, stream)
        if (event.streams.length > 1) {
          console.warn('got multi-stream, but play only 1 stream')
        }
      }
    }

    // --- on get local ICE candidate
    // 【RTCPeerConnection.onicecandidate()】
    // RTCPeerConnection.setLocalDescription()の呼び出しによってRTCIceCandidateが識別され、
    // ローカルPeerに追加されると、RTCPeerConnectionに送信される
    peer.onicecandidate = function (evt) {
      if (evt.candidate) {
        console.log(evt.candidate)

        // Trickle ICE の場合は、ICE candidateを相手に送る
        // Vanilla ICE の場合には、何もしない
      } else {
        console.log('empty ice event')

        // Trickle ICE の場合は、何もしない
        // Vanilla ICE の場合には、ICE candidateを含んだSDPを相手に送る
        sendSdp(peer.localDescription as RTCSessionDescription)
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
  }

  function makeOffer(stream: MediaStream) {
    peerConnection = prepareNewConnection(stream)

    let options = {}
    // if: 片方のVideoを送信のみ（受信しない）設定にしたいときにアンコメント
    // if (stream) {
    //   console.log('-- try sendonly ---')
    //   options = { offerToReceiveAudio: false, offerToReceiveVideo: false }
    // }
    // else: このロジックはReceiveで必要?（なくても動いた）
    // else {
    //   // -- no localStream, so receive --
    //   console.log('-- try recvonly ---')

    //   options = { offerToReceiveAudio: true, offerToReceiveVideo: true }

    //   if ('addTransceiver' in peerConnection) {
    //     console.log('-- use addTransceiver() for recvonly --')
    //     peerConnection.addTransceiver('video', { direction: 'recvonly' })
    //     peerConnection.addTransceiver('audio', { direction: 'recvonly' })
    //   }
    // }

    // 【RTCPeerConnection.createOffer()】
    // リモートPeerとの新しいWebRTC接続を開始するために、SDP Offerの生成を開始する
    peerConnection.createOffer(options)
    .then(function (sessionDescription) {
      console.log('createOffer() succsess in promise')
      // 【RTCPeerConnection.setLocalDescription()】
      // 接続に関連付けられたローカルな記述を変更する
      // 記述が変更されると非同期に実行される Promise を返す
      return peerConnection.setLocalDescription(sessionDescription)
    }).then(function() {
      console.log('setLocalDescription() succsess in promise')

      // -- Trickle ICE の場合は、初期SDPを相手に送る --
      // -- Vanilla ICE の場合には、まだSDPは送らない --
      //sendSdp(peerConnection.localDescription);
    }).catch(function(err) {
      console.error(err)
    });
  }

  function setOffer(sessionDescription: RTCSessionDescription, stream: MediaStream) {
    if (peerConnection) {
      console.error('peerConnection alreay exist!')
    }
    peerConnection = prepareNewConnection(stream)
    // 【RTCPeerConnection.setRemoteDescription()】
    // 指定されたsessionDescriptionをリモートPeerの現在のOfferまたはAnswerとして設定する
    // sessionDescriptionはメディア形式を含む、接続のリモート側のプロパティを指定する
    // sessionDescriptionが変更されると、非同期で実行されるPromiseを返す
    // 通常シグナリングサーバー上で他のPeerからOfferまたはAnswerを受信した後に呼び出される
    peerConnection.setRemoteDescription(sessionDescription)
    .then(function() {
      console.log('setRemoteDescription(offer) succsess in promise')
      makeAnswer(stream)
    }).catch(function(err) {
      console.error('setRemoteDescription(offer) ERROR: ', err)
    })
  }

  function makeAnswer(stream: MediaStream) {
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
        // 【RTCPeerConnection.addTransceiver()】
        // 新しい RTCRtpTransceiver を作成し、それを RTCPeerConnection に関連付けられたトランシーバーのセットに追加
        // 各トランシーバは、RTCRtpSender と RTCRtpReceiver の両方が関連付けられた双方向のストリームを表し、
        // RTCRtpSender と RTCRtpReceiver の両方は、それに関連付けられた双方向のストリームを表す
        peerConnection.addTransceiver('video', { direction: 'recvonly' })
        peerConnection.addTransceiver('audio', { direction: 'recvonly' })
      }
    }

    // 【RTCPeerConnection.createAnswer()】
    // WebRTC 接続のOffer/Answer交渉中に リモートピアから受け取ったOfferに対する SDP Answerを作成する
    // Answerは返された Promise に配信され、ネゴシエーションプロセスを継続するために、Offerのソースに送信される必要がある
    peerConnection.createAnswer(options)
    .then(function (sessionDescription) {
      console.log('createAnswer() succsess in promise')
      return peerConnection.setLocalDescription(sessionDescription)
    }).then(function() {
      console.log('setLocalDescription() succsess in promise')

      // -- Trickle ICE の場合は、初期SDPを相手に送る --
      // -- Vanilla ICE の場合には、まだSDPは送らない --
      //sendSdp(peerConnection.localDescription);
    }).catch(function(err) {
      console.error(err)
    })
  }

  function sendSdp(sessionDescription: RTCSessionDescription) {
    console.log('---sending sdp ---')
    const textForSendSdp: HTMLTextAreaElement = document.getElementById('text_for_send_sdp') as HTMLTextAreaElement
    textForSendSdp.value = sessionDescription.sdp
    textForSendSdp.focus()
    textForSendSdp.select()
  }

  function onSdpText() {
    const textToReceiveSdp = document.getElementById('text_for_receive_sdp') as HTMLTextAreaElement
    let text = textToReceiveSdp.value
    text = _trimTailDoubleLF(text); // for Safar TP --> Chrome
    if (peerConnection) {
      console.log('Received answer text...')
      let answer = new RTCSessionDescription({
        type : 'answer',
        sdp : text,
      })
      setAnswer(answer)
    }
    else {
      console.log('Received offer text...')
      let offer = new RTCSessionDescription({
        type : 'offer',
        sdp : text,
      })
      setOffer(offer, localStream)
    }
    textToReceiveSdp.value =''
  }

  function setAnswer(sessionDescription: RTCSessionDescription) {
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
      Sender
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
          <textarea id="text_for_send_sdp" rows={5} cols={60} readOnly={true}>SDP to send</textarea>
        </p>
        <p>SDP to receive:&nbsp;
          <button type="button" onClick={onSdpText}>Receive remote SDP</button><br />
          <textarea id="text_for_receive_sdp" rows={5} cols={60}></textarea>
        </p>
      </div>
    </div>
  )
}

export default Sender
