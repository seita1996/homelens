import styles from '../styles/Sidebar.module.css'
import { ReactSVG } from 'react-svg'
import Switch from 'react-switch'
import { useState } from 'react'

const Sidebar = (props: { visible: boolean, closeSideBar: Function}) => {
  const [enableBackCamera, setEnableBackCamera] = useState(false)

  function handleChange() {
    setEnableBackCamera(!enableBackCamera)
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
            <Switch onChange={handleChange} checked={enableBackCamera} onColor={'#F2994A'} />
          </div>
        </div>
      </div>
    )
  }
  return <div></div>
}

export default Sidebar
