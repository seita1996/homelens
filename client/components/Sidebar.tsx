import styles from '../styles/Sidebar.module.css'
import { ReactSVG } from 'react-svg'
import Switch from 'react-switch'
import { useState } from 'react'
import { useRecoilState } from 'recoil'
import { facingModeState } from '@/states/rootStates/userState'

const Sidebar = (props: { visible: boolean, closeSideBar: Function}) => {
  const [facingMode, setFacingMode] = useRecoilState(facingModeState)
  const [enableBackCamera, setEnableBackCamera] = useState(false)

  function changeFacingMode() {
    setEnableBackCamera(!enableBackCamera)
    if(enableBackCamera) {
      setFacingMode('environment')
    } else {
      setFacingMode('user')
    }
    console.log('facingMode', facingMode)
  }

  if(props.visible) {
    return (
      <div className={styles.sideBox}>
        <div className={styles.flexSpaceBetween}>
          <div className={styles.title}>設定</div>
          <div className={styles.iconBox}>
            <ReactSVG src="/xmark.svg" className={styles.deviceicon} style={{ width: "32px", height: "32px" }} onClick={() => {props.closeSideBar()}} />
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.flexSpaceBetween}>
            <div>
              背面カメラを使う
            </div>
            <Switch onChange={changeFacingMode} checked={enableBackCamera} onColor={'#F2994A'} />
          </div>
        </div>
      </div>
    )
  }
  return <div></div>
}

export default Sidebar
