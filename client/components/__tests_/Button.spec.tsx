import Button from "@/components/Button"
import { fireEvent, render } from "@testing-library/react"

describe("Button", () => {
  test("text is displayed on the button", () => {
    const text = 'hoge'
    const { getByText } = render(<Button text={text} class={''} visible={true} onClickAction={function() {}} />)
    expect(getByText(text)).toBeTruthy()
  })
  test("If \"visible\" is true, button element is displayed", () => {
    const { getByRole } = render(<Button text={'hoge'} class={''} visible={true} onClickAction={function() {}} />)
    expect(getByRole('button', { hidden: false }))
  })
  test("If \"visible\" is false, button element is not displayed", () => {
    const { getByRole } = render(<Button text={'hoge'} class={''} visible={false} onClickAction={function() {}} />)
    expect(getByRole('button', { hidden: true }))
  })
  test("onClickAction is executed only once", () => {
    const handleClick = jest.fn()
    const text = 'hoge'
    const { getByText } = render(<Button text={text} class={''} visible={false} onClickAction={handleClick} />)
    fireEvent.click(getByText(text))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
