import { MouseEventHandler } from "react"

const Button = (props: { text: string, class: string, visible: boolean, onClickAction: MouseEventHandler<HTMLButtonElement> }) => {
  const visibility = props.visible ? 'block' : 'none'
  return (
    <button style={{ display: visibility }} className={props.class} onClick={props.onClickAction}>
      {props.text}
    </button>
  )
}

export default Button
