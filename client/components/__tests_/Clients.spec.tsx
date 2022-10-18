import Clients from "@/components/Clients"
import { fireEvent, render } from "@testing-library/react"

describe("Clients", () => {
  test("(me) only for Client that match myname", () => {
    const { getByText } = render(<Clients clientList={['a', 'b']} myName={'b'} clientsOnClick={function() {}} meOnClick={function() {}} />)
    expect(getByText('a')).toBeTruthy()
    expect(getByText('b(me)')).toBeTruthy()
  })
  describe("When a Client without \"(me)\" is clicked", () => {
    test("the function specified in clientsOnClick is executed only once", () => {
      const handleClick = jest.fn()
      const { getByText } = render(<Clients clientList={['a', 'b']} myName={'b'} clientsOnClick={handleClick} meOnClick={function() {}} />)
      fireEvent.click(getByText('a'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
    test("the function specified in meOnClick is not executed", () => {
      const handleClick = jest.fn()
      const { getByText } = render(<Clients clientList={['a', 'b']} myName={'b'} clientsOnClick={function() {}} meOnClick={handleClick} />)
      fireEvent.click(getByText('a'))
      expect(handleClick).toHaveBeenCalledTimes(0)
    })
  })
  describe("When a client with \"(me)\" is clicked", () => {
    test("the function specified in clientsOnClick is not executed", () => {
      const handleClick = jest.fn()
      const { getByText } = render(<Clients clientList={['a', 'b']} myName={'b'} clientsOnClick={handleClick} meOnClick={function() {}} />)
      fireEvent.click(getByText('b(me)'))
      expect(handleClick).toHaveBeenCalledTimes(0)
    })
    test("the function specified in meOnClick is executed only once", () => {
      const handleClick = jest.fn()
      const { getByText } = render(<Clients clientList={['a', 'b']} myName={'b'} clientsOnClick={function() {}} meOnClick={handleClick} />)
      fireEvent.click(getByText('b(me)'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })
})
