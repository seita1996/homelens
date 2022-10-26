import styles from '../styles/Clients.module.css'

// TODO: clientList's type is {name: string, ua: string}[]. However, if you specify it, the component cannot be called.
const Clients = (props: { clientList: any, myName: string, clientsOnClick: Function, meOnClick: Function }) => {
  return props.clientList.map(function (client: {name: string, ua: string}, i: number) {
    return (
      <div key={`client${i}`}>
        <div key={`clientName${i}`} className={styles.btn}
          onClick={
            () => {
              if (client.name === props.myName) {
                props.meOnClick(client.name)
              } else {
                props.clientsOnClick(client.name)
              }
            }
          }>
          {decorateClientName(client.name, props.myName)}
          <br />
        </div>
        <div key={`clientUA${i}`}>
          {client.ua}
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

export default Clients
