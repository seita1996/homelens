import styles from '../styles/InfoModal.module.css'
import { ReactSVG } from 'react-svg'

const InfoModal = (props: { visible: boolean, closeInfoModal: Function}) => {

  if(props.visible) {
    return (
      <div className={styles.sideBox}>
        <div className={styles.flexSpaceBetween}>
          <div className={styles.title}>homelensについて</div>
          <div className={styles.iconBox}>
            <ReactSVG src="/xmark.svg" className={styles.deviceicon} style={{ width: "32px", height: "32px" }} onClick={() => {props.closeInfoModal()}} />
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.flexCenter}>
            <div>
              つくったひと
            </div>
            <div>
              seita1996
            </div>
          </div>
          <div className={styles.flexCenter}>
            <div>
              ソースコード
            </div>
            <div>
              https://github.com/seita1996/homelens
            </div>
          </div>
          <div className={styles.flexCenter}>
            <div>
              FAQ
            </div>
            <div>
              Coming soon
            </div>
          </div>
        </div>
      </div>
    )
  }
  return <div></div>
}

export default InfoModal
