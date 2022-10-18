import styles from '../styles/Clients.module.css'

// TODO: stop using any type
const Clients = (props: { clientList: any, myName: string, clientsOnClick: Function, meOnClick: Function }) => {
  return props.clientList.map(function (clientName: string, i: number) {
    return (
      <div key={`clientName${i}`} className={styles.btn}
        onClick={
          () => {
            if (clientName === props.myName) {
              props.meOnClick(clientName)
            } else {
              props.clientsOnClick(clientName)
            }
          }
        }>
        {decorateClientName(clientName, props.myName)}
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

export default Clients
