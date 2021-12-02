import { screen, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { localStorageMock } from '../__mocks__/localStorage'
import { ROUTES, ROUTES_PATH } from '../constants/routes'
import firebase from '../__mocks__/firebase'
import Router from "../app/Router";
import Bills from '../containers/Bills.js'
import '@testing-library/jest-dom/extend-expect'
import Firestore from "../app/Firestore.js"
import NewBill from "../containers/NewBill.js"
import userEvent from "@testing-library/user-event"

describe("Given I am connected as an employee", () => {

    describe("When I am on Bills Page", () => {
        test("Then bill icon in vertical layout should be highlighted", () => {
          Firestore.bills = () => ({ bills, get: jest.fn().mockResolvedValue() })
          const html = BillsUI({ data: [bills] })
          const pathname = ROUTES_PATH["Bills"];
          Object.defineProperty(window, "location", { value: { hash: pathname } })
            window.localStorage.setItem(
            "user",
            JSON.stringify({
            type: "Employee",
            })
          )
          document.body.innerHTML = `<div id='root'>${html}</div>`
          Router()
            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname })
            }
            expect(screen.getByTestId("icon-window").classList).toContain("active-icon")
        })
    
        test("Then bills should be ordered from earliest to latest", () => {
          const html = BillsUI({ data: bills })
          document.body.innerHTML = html
          const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
          const antiChrono = (a, b) => ((a < b) ? 1 : -1)
          const datesSorted = [...dates].sort(antiChrono)
          expect(dates).toEqual(datesSorted)
        })

        test("Then a new bill page should open", () => {
          const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({pathname})
          }
          const bill = new Bills ({ document, onNavigate, firestore : null, localStorage : window.localStorage })
          const btnNewBill = screen.getByTestId("btn-new-bill")
          const handleClick = jest.fn()
          btnNewBill.addEventListener("click", handleClick)
          userEvent.click(btnNewBill)
          expect(handleClick).toHaveBeenCalled()
        })

        describe("When I click on eye icon", () => {
            test("Then the justification modal should open", () => {
                const html = BillsUI({ data: bills })
                document.body.innerHTML = html
                const onNavigate = (pathname) => {
                  document.body.innerHTML = ROUTES({pathname})
                }
                const bill = new Bills ({ document, onNavigate, firestore : null, localStorage : window.localStorage })
                const btnEye= screen.getAllByTestId("icon-eye")[0]
                const handleClickEye = jest.fn()
                $.fn.modal = jest.fn() //fct simulée
                btnEye.addEventListener("click", handleClickEye)
                userEvent.click(btnEye)
                expect(handleClickEye).toHaveBeenCalled()
              }) 
        })
    })

})

// test d'intégration GET
describe("When I navigate to bill page", () => {
    describe("When I navigate to Dashboard", () => {
      test("fetches bills from mock API GET", async () => {
         const getSpy = jest.spyOn(firebase, "get")
         const userBills = await firebase.get()
         expect(getSpy).toHaveBeenCalledTimes(1)
         expect(userBills.data.length).toBe(4)
      })
      test("fetches bills from an API and fails with 404 message error", async () => {
        firebase.get.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 404"))
        )
        const html = BillsUI({ error: "Erreur 404" })
        document.body.innerHTML = html
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
      test("fetches messages from an API and fails with 500 message error", async () => {
        firebase.get.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 500"))
        )
        const html = BillsUI({ error: "Erreur 500" })
        document.body.innerHTML = html
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
  