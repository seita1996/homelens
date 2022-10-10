import Terms from "@/pages/terms"
import { render } from "@testing-library/react"

describe("Terms", () => {
  test("should exist", () => {
    const { getByText } = render(<Terms />)
    expect(getByText("Terms")).toBeTruthy()
  })
})
