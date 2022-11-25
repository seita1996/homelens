const remoteVideoId = 'remoteVideo'
let peerConnection: RTCPeerConnection

export let sdp: string

// Reflect MediaStream to the target HTML element
export function playVideo(element: HTMLMediaElement, stream: MediaStream) {
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

export function stopVideo(element: HTMLMediaElement, stream: MediaStream) {
  pauseVideo(element)
  stopLocalStream(stream)
}

export function connect(stream: MediaStream) {
  makeOffer(stream)
}

export function webrtcSignaling(sdpText: string, stream: MediaStream) {
  if (peerConnection) {
    console.log('Received answer text...')
    let answer = new RTCSessionDescription({
      type : 'answer',
      sdp : sdpText,
    })
    setAnswer(answer)
  }
  else {
    console.log('Received offer text...')
    let offer = new RTCSessionDescription({
      type : 'offer',
      sdp : sdpText,
    })
    setOffer(offer, stream)
  }
}

// -----------------------
// --- private methods ---
// -----------------------

// Turn off the device's camera
function pauseVideo(element: HTMLMediaElement) {
  element.pause()
  if ('srcObject' in element) {
    element.srcObject = null
  }
  // else {
  //   if (element.src && (element.src !== '') ) {
  //     window.URL.revokeObjectURL(element.src)
  //   }
  //   element.src = ''
  // }
}

// Suspend Stream
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

function setOffer(sessionDescription: RTCSessionDescription, stream: MediaStream) {
  if (peerConnection) {
    console.error('peerConnection alreay exist!')
  }
  peerConnection = prepareNewConnection(stream)
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
}

function makeOffer(stream: MediaStream) {
  if (peerConnection) {
    console.warn('peer already exist.')
    return
  }
  peerConnection = prepareNewConnection(stream)

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
}

function prepareNewConnection(stream: MediaStream) {
  let pc_config = {"iceServers":[]}
  let peer = new RTCPeerConnection(pc_config)
  // --- on get remote stream ---
  if ('ontrack' in peer) {
    peer.ontrack = function(event) {
      console.log('-- peer.ontrack()')
      let stream = event.streams[0]
      const remoteVideo = document.getElementById(remoteVideoId) as HTMLVideoElement
      playVideo(remoteVideo, stream)
      if (event.streams.length > 1) {
        console.warn('got multi-stream, but play only 1 stream')
      }
    }
  }
  // --- on get local ICE candidate
  peer.onicecandidate = function (evt) {
    if (evt.candidate) {
      console.log(evt.candidate)
      // For Trickle ICE, send ICE candidate to the peer
      // In the case of Vanilla ICE, do nothing
    } else {
      console.log('empty ice event')
      // In the case of Trickle ICE, do nothing
      // In case of Vanilla ICE, send SDP containing ICE candidate to the peer
      setSdp(peer.localDescription as RTCSessionDescription)
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

function setSdp(sessionDescription: RTCSessionDescription) {
  console.log('---set sdp ---')
  sdp = sessionDescription.sdp
}
