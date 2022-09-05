const MyText = (props: { title: string, description: string }) => {
  return (
    <div>
      <span>{props.title}:</span>
      <span>{props.description}</span>
    </div>
  )
}

export default MyText
