import '../styles/globals.css'
import type { AppProps } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

(async function(){
  // カメラ映像取得
  const localMediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: 1280,
      height: 720,
      frameRate: { ideal: 8 }
    },
    audio: false
  }) as MediaStream
  const localVideo = document.getElementById('localVideo') as HTMLVideoElement
  if(localVideo !== null) {
    localVideo.srcObject = localMediaStream
  }
})()

export default MyApp
