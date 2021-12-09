import { screen, fireEvent} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import { localStorageMock, setLocalStorage } from "../__mocks__/localStorage.js";
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
                window.localStorage.setItem("user", JSON.stringify({type: "Employee"}))
                const firestore = null
                const html = NewBillUI()
                document.body.innerHTML = html
        
                const newBill = new NewBill({document, onNavigate, firestore, localStorage: window.localStorage})
                const handleSubmit = jest.fn(newBill.handleSubmit)
                newBill.fileName = "invalid"
                const submitBtn = screen.getByTestId("form-new-bill")
                submitBtn.addEventListener("submit", handleSubmit)
                fireEvent.submit(submitBtn)
                expect(handleSubmit).toHaveBeenCalled()
                expect(document.querySelector("#extension-error").style.display).toBe("block")
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
                expect(document.querySelector("#extension-error").style.display).toBe("none")
            })
            
            test('Then the file handler should be called', () => {
                document.body.innerHTML = NewBillUI()
                setLocalStorage('employee')
                const onNavigate = (pathname) => {
                    document.body.innerHTML = ROUTES({pathname})
                }
                const newBill = new NewBill({document, onNavigate, firestore: firestore, localStorage: window.localStorage})
                const handleChangeFile = jest.fn(() => newBill.handleChangeFile)
                const inputFile = screen.getByTestId('file')
                const inputData = {
                    target : {
                        files: [new File(['test.png'], 'test.png', { type: 'image/png' })],
                    }
                }
                inputFile.addEventListener('change', handleChangeFile)
                fireEvent.change(inputFile, inputData)
                expect(handleChangeFile).toHaveBeenCalled()
                expect(inputFile.files[0].name).toBe('test.png')
            })
        })
    })
  // test d'intégration POST
    describe("When I create a new bill", () => {
        test("add bill from mock API POST", async () => {
            const postSpy = jest.spyOn(firebase, "post")
            const newBill = {
                "id": "BeKy5Mo4jkmdfPGYpTxZ",
                "vat": "",
                "amount": 100,
                "name": "test1",
                "fileName": "1592770761.jpeg",
                "commentary": "plop",
                "pct": 20,
                "type": "Transports",
                "email": "a@a",
                "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…61.jpeg?alt=media&token=7685cd61-c112-42bc-9929-8a799bb82d8b",
                "date": "2001-01-01",
                "status": "refused",
                "commentAdmin": "en fait non"
              }
            const userBills = await firebase.post(newBill)
            expect(postSpy).toHaveBeenCalledTimes(1)
            expect(userBills.email).toStrictEqual(newBill.email)
        })

        test("add bill from an API and fails with 404 message error", async () => {
            firebase.post.mockImplementationOnce(() =>
                Promise.reject(new Error("Erreur 404"))
            )
            const html = BillsUI({ error: "Erreur 404" })
            document.body.innerHTML = html
            const message = await screen.getByText(/Erreur 404/)
            expect(message).toBeTruthy()
        })

        test("add bill from an API and fails with 500 message error", async () => {
            firebase.post.mockImplementationOnce(() =>
                Promise.reject(new Error("Erreur 500"))
            )
            const html = BillsUI({ error: "Erreur 500" })
            document.body.innerHTML = html
            const message = await screen.getByText(/Erreur 500/)
            expect(message).toBeTruthy()
        })
    })
})