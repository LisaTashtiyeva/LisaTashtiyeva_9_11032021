import { screen, fireEvent} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import { localStorageMock } from "../__mocks__/localStorage.js";
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import BillsUI from "../views/BillsUI.js";
import firestore from "../app/Firestore";
import firebase from "../__mocks__/firebase";
import { ROUTES, ROUTES_PATH } from "../constants/routes";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then it should render NewBill page", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const newBillForm = screen.getByTestId('form-new-bill')
      expect(newBillForm).toBeTruthy()
    })

    describe("When I upload a file with the wrong format", () => {
      test("Then the bill shouldn't be created", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        })
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        )
        const firestore = null
        const html = NewBillUI()
        document.body.innerHTML = html
  
        const newBill = new NewBill({
          document,
          onNavigate,
          firestore,
          localStorage: window.localStorage,
        })
        const handleSubmit = jest.fn(newBill.handleSubmit)
        newBill.fileName = "invalid"
        const submitBtn = screen.getByTestId("form-new-bill")
        submitBtn.addEventListener("submit", handleSubmit)
        fireEvent.submit(submitBtn)
        expect(handleSubmit).toHaveBeenCalled()
      })
    })

    describe('When I upload a correct file', () => {
      test('Then the name of the file should be present in the input file', () => {
        document.body.innerHTML = NewBillUI()
        const inputFile = screen.getByTestId('file')
        const inputData = {
            file: new File(['test'], 'test.png', {
                type: 'image/png',
            }),
        }
        const newBill = new NewBill({
            document,
        })
        userEvent.upload(inputFile, inputData.file)
        expect(inputFile.files[0]).toStrictEqual(inputData.file)
      })
    })
  })
})