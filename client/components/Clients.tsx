import styles from '../styles/Clients.module.css'
import { ReactSVG } from 'react-svg'

// TODO: clientList's type is {name: string, ua: string}[]. However, if you specify it, the component cannot be called.
const Clients = (props: { clientList: any, myName: string, clientsOnClick: Function, meOnClick: Function }) => {
  return props.clientList.map(function (client: {name: string, ua: string, mobile: string}, i: number) {
    return (
      <div key={`client${i}`}>
        <div key={`clientName${i}`} className={styles.clientcard}
          onClick={
            () => {
              if (client.name === props.myName) {
                props.meOnClick(client.name)
              } else {
                props.clientsOnClick(client.name)
              }
            }
          }>
          <div className={styles.textcenter}>
            {client.ua}
          </div>
          <div className={styles.iconBox}>
            {viewIcon(client.mobile)}
          </div>
          <div className={styles.textcenter}>
            {decorateClientName(client.name, props.myName)}
          </div>
        </div>
      </div>
    )
  })
}

function decorateClientName(clientName: string, myName: string) {
  if (clientName === myName) {
    return clientName + '(me)'
  }
  return clientName
}

function viewIcon(isMobile: string) {
  if (isMobile === 'true') {
    return <ReactSVG src="/mobile.svg" className={styles.deviceicon} style={{ width: "48px", height: "48px" }} />
  }
  return <ReactSVG src="/pc.svg" className={styles.deviceicon} style={{ width: "48px", height: "48px" }} />
}

export default Clients
