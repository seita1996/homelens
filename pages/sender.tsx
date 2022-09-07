import { connect } from 'http2'
import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Sender.module.css'
import React, { useEffect, useState } from 'react'
import MyText from '../components/mytext'
import { element } from 'prop-types'

const Sender: NextPage = () => {
  // let canditates = [] as RTCIceCandidate[];
  const [canditates, setCanditates] = useState<RTCIceCandidate[]>([]);
  // let offer: RTCSessionDescriptionInit;
  const [offer, setOffer] = useState<RTCSessionDescriptionInit>();

  // useEffect(() => {
  //   connectPeers()
  // }, [])

  // async function connectPeers() {
  //   if(typeof window === 'undefined') {
  //     return // Server sideでは実行しない
  //   }

  //   const config = {
  //     offerToReceiveAudio: 1,
  //     offerToReceiveVideo: 0,
  //     iceServers: [{
  //       urls: 'stun:stun.l.google.com:19302'
  //     }]
  //   }

  //   const connection = new RTCPeerConnection(config)

  //   const channel = connection.createDataChannel('channel')
  //   // channel.onmessage = e => { receivedMessages.push(e.data) }
  //   // channel.onopen = e => { channelOpen = true }
  //   // channel.onclose = e => { channelOpen = false }

  //   // setLocalDescriptionが呼ばれるとICE Candidatesが生成され発火
  //   connection.onicecandidate = e => {
  //     if (e.candidate) {
  //       setCanditates([...canditates, e.candidate])
  //       // canditates.push(e.candidate)
  //       console.log('canditates', canditates)
  //     }
  //   }

  //   let localMediaStream: MediaStream
  //   try {
  //     localMediaStream = await navigator.mediaDevices.getUserMedia({
  //       video: {
  //         width: { ideal: 1280 },
  //         height: { ideal: 720 },
  //         frameRate: { ideal: 8 }
  //       },
  //       audio: false
  //     })
  //     localMediaStream.getTracks().forEach(track => connection.addTrack(track, localMediaStream))
  //     const localVideo = document.getElementById('localVideo') as HTMLVideoElement
  //     if(localVideo !== null) {
  //       localVideo.srcObject = localMediaStream
  //     }
  //   } catch (e) {
  //     console.log(e)
  //   }

  //   connection.createOffer().then(offerSDP => {
  //     connection.setLocalDescription(offerSDP) // ICE Candidates生成
  //     setOffer(offerSDP)
  //     // offer = offerSDP
  //     console.log('offer', offerSDP)
  //   })

  //   console.log('finish connectPeers')
  // }

  let localStream: MediaStream
  let peerConnection: RTCPeerConnection

  async function startVideo() {
    console.log('startVideo')
    const localVideo = document.getElementById('localVideo') as HTMLVideoElement
    localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false})
    playVideo(localVideo, localStream)
  }

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
      makeOffer()
    }
    else {
      console.warn('peer already exist.')
    }
  }
  function hangup() {
    console.log('hangup')
  }

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

  function prepareNewConnection() {
    let pc_config = {"iceServers":[]}
    let peer = new RTCPeerConnection(pc_config)

    // このロジックはReceiverで必要
    // --- on get remote stream ---
    // if ('ontrack' in peer) {
    //   peer.ontrack = function(event) {
    //     console.log('-- peer.ontrack()')
    //     let stream = event.streams[0]
    //     playVideo(remoteVideo, stream)
    //     if (event.streams.length > 1) {
    //       console.warn('got multi-stream, but play only 1 stream')
    //     }
    //   }
    // }
    // else {
    //   peer.onaddstream = function(event) {
    //     console.log('-- peer.onaddstream()')
    //     let stream = event.stream
    //     playVideo(remoteVideo, stream)
    //   };
    // }

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
        sendSdp(peer.localDescription as RTCSessionDescription)
      }
    }

    // -- add local stream --
    if (localStream) {
      console.log('Adding local stream...')
      if ('addTrack' in peer) {
        console.log('use addTrack()')
        let tracks = localStream.getTracks()
        for (let track of tracks) {
          let sender = peer.addTrack(track, localStream)
        }
      }
      else {
        console.log('use addStream()')
        peer.addStream(localStream)
      }
    }
    else {
      console.warn('no local stream, but continue.')
    }

    return peer
  }

  function makeOffer() {
    peerConnection = prepareNewConnection()

    let options = {}
    if (localStream) {
      console.log('-- try sendonly ---')
      options = { offerToReceiveAudio: false, offerToReceiveVideo: false }
    }
    // このロジックはReceiveで必要
    // else {
    //   // -- no localStream, so receive --
    //   console.log('-- try recvonly ---')

    //   options = { offerToReceiveAudio: true, offerToReceiveVideo: true }

    //   if ('addTransceiver' in peerConnection) {
    //     console.log('-- use addTransceiver() for recvonly --')
    //     peerConnection.addTransceiver('video').setDirection('recvonly')
    //     peerConnection.addTransceiver('audio').setDirection('recvonly')
    //   }
    // }

    peerConnection.createOffer(options)
    .then(function (sessionDescription) {
      console.log('createOffer() succsess in promise')
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

  function sendSdp(sessionDescription: RTCSessionDescription) {
    console.log('---sending sdp ---')
    const textForSendSdp: HTMLTextAreaElement = document.getElementById('text_for_send_sdp') as HTMLTextAreaElement
    textForSendSdp.value = sessionDescription.sdp
    textForSendSdp.focus()
    textForSendSdp.select()
  }

  const title: string = "title"
  const description: string = "description"

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
      </div>
      <div>
        <MyText
          title={"offer"}
          description={JSON.stringify(offer)}
        />
        <MyText
          title={"canditates"}
          description={JSON.stringify(canditates)}
        />
        <p>SDP to send:&nbsp;
          <button type="button">copy local SDP</button><br />
          <textarea id="text_for_send_sdp" rows={5} cols={60} readOnly={true}>SDP to send</textarea>
        </p>
        {/* Receive実装時にアンコメント */}
        {/* <p>SDP to receive:&nbsp;
          <button type="button" onClick={onSdpText}>Receive remote SDP</button><br />
          <textarea id="text_for_receive_sdp" rows="5" cols="60"></textarea>
        </p> */}
      </div>
    </div>
  )
}

export default Sender
