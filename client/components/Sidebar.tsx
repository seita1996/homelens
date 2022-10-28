import styles from '../styles/Sidebar.module.css'
import { ReactSVG } from 'react-svg'

const Sidebar = (props: { visible: boolean, closeSideBar: Function}) => {
  if(props.visible) {
    return (
      <div className={`${styles.sideBox} ${styles.flexSpaceBetween}`}>
        <div className={styles.title}>設定</div>
        <div className={styles.iconBox}>
          <ReactSVG src="/xmark.svg" className={styles.deviceicon} style={{ width: "32px", height: "32px" }} onClick={() => {props.closeSideBar()}} />
        </div>
      </div>
    )
  }
  return <div></div>
}

export default Sidebar
